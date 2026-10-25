import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import type { Note, Notebook, User } from "../types";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let localKeyPromise: Promise<string> | null = null;
const db = () =>
  (dbPromise ??= SQLite.openDatabaseAsync("keepsecret-local.db"));

async function localKey() {
  if (!localKeyPromise)
    localKeyPromise = (async () => {
      let key = await SecureStore.getItemAsync(
        "keepsecret.local-encryption-key",
      );
      if (!key) {
        key = (await Crypto.randomUUID()) + (await Crypto.randomUUID());
        await SecureStore.setItemAsync("keepsecret.local-encryption-key", key);
      }
      return key;
    })();
  return localKeyPromise;
}
const seal = async (value: unknown) =>
  CryptoJS.AES.encrypt(JSON.stringify(value), await localKey()).toString();
const open = async <T>(value: string): Promise<T> =>
  JSON.parse(
    CryptoJS.AES.decrypt(value, await localKey()).toString(CryptoJS.enc.Utf8),
  ) as T;

export async function initLocalDb() {
  const d = await db();
  await d.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updatedAt TEXT NOT NULL, pending INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS notebooks (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updatedAt TEXT NOT NULL, pending INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS pending_ops (id INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT NOT NULL, action TEXT NOT NULL, entityId TEXT NOT NULL, payload TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS id_map (localId TEXT PRIMARY KEY NOT NULL, remoteId TEXT NOT NULL, entity TEXT NOT NULL);`);
}
export async function getLocalNotes(includeDeleted = false): Promise<Note[]> {
  const d = await db();
  const rows = await d.getAllAsync<{ payload: string }>(
    "SELECT payload FROM notes ORDER BY updatedAt DESC",
  );
  const values = await Promise.all(rows.map((r) => open<Note>(r.payload)));
  return values
    .filter((n) => (includeDeleted ? !!n.isDeleted : !n.isDeleted))
    .sort(
      (a, b) =>
        Number(!!b.isPinned) - Number(!!a.isPinned) ||
        (a.position ?? 0) - (b.position ?? 0),
    );
}
export async function getLocalNotebooks(): Promise<Notebook[]> {
  const d = await db();
  const rows = await d.getAllAsync<{ payload: string }>(
    "SELECT payload FROM notebooks ORDER BY updatedAt DESC",
  );
  return (await Promise.all(rows.map((r) => open<Notebook>(r.payload)))).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}
export async function saveLocalNote(note: Note, pending = false) {
  const d = await db();
  await d.runAsync(
    "INSERT OR REPLACE INTO notes(id,payload,updatedAt,pending) VALUES(?,?,?,?)",
    note.id,
    await seal(note),
    note.updatedAt ?? new Date().toISOString(),
    pending ? 1 : 0,
  );
}
export async function saveLocalNotebook(notebook: Notebook, pending = false) {
  const d = await db();
  await d.runAsync(
    "INSERT OR REPLACE INTO notebooks(id,payload,updatedAt,pending) VALUES(?,?,?,?)",
    notebook.id,
    await seal(notebook),
    notebook.updatedAt ?? new Date().toISOString(),
    pending ? 1 : 0,
  );
}
export async function removeLocalNote(id: string) {
  const d = await db();
  await d.runAsync("DELETE FROM notes WHERE id=?", id);
}
export async function removeLocalNotebook(id: string) {
  const d = await db();
  await d.runAsync("DELETE FROM notebooks WHERE id=?", id);
}
export async function enqueue(
  entity: "note" | "notebook",
  action: string,
  entityId: string,
  payload: unknown,
) {
  const d = await db();
  await d.runAsync(
    "INSERT INTO pending_ops(entity,action,entityId,payload,createdAt) VALUES(?,?,?,?,?)",
    entity,
    action,
    entityId,
    await seal(payload),
    new Date().toISOString(),
  );
}
export async function pendingOps() {
  const d = await db();
  const rows = await d.getAllAsync<{
    id: number;
    entity: string;
    action: string;
    entityId: string;
    payload: string;
  }>("SELECT * FROM pending_ops ORDER BY id ASC");
  return Promise.all(
    rows.map(async (r) => ({ ...r, payload: await open<any>(r.payload) })),
  );
}
export async function removePendingOp(id: number) {
  const d = await db();
  await d.runAsync("DELETE FROM pending_ops WHERE id=?", id);
}
export async function mapRemoteId(
  localId: string,
  remoteId: string,
  entity: string,
) {
  const d = await db();
  await d.runAsync(
    "INSERT OR REPLACE INTO id_map(localId,remoteId,entity) VALUES(?,?,?)",
    localId,
    remoteId,
    entity,
  );
}
export async function resolveRemoteId(id: string) {
  if (!id.startsWith("local-")) return id;
  const d = await db();
  const row = await d.getFirstAsync<{ remoteId: string }>(
    "SELECT remoteId FROM id_map WHERE localId=?",
    id,
  );
  return row?.remoteId ?? id;
}
export async function replaceLocalId(
  entity: "note" | "notebook",
  localId: string,
  remoteId: string,
  serverValue: Note | Notebook,
) {
  const d = await db();
  await mapRemoteId(localId, remoteId, entity);
  if (entity === "note") await saveLocalNote(serverValue as Note, false);
  else await saveLocalNotebook(serverValue as Notebook, false);
  if (entity === "note") await removeLocalNote(localId);
  else await removeLocalNotebook(localId);
}
export async function markSynced(
  entity: "note" | "notebook",
  id: string,
  value: Note | Notebook,
) {
  if (entity === "note") await saveLocalNote(value as Note, false);
  else await saveLocalNotebook(value as Notebook, false);
}
export async function hasPendingFor(entity: string, id: string) {
  const d = await db();
  const rows = await d.getAllAsync<{
    entity: string;
    entityId: string;
    action: string;
    payload: string;
  }>(
    "SELECT entity,entityId,action,payload FROM pending_ops WHERE entity=?",
    entity,
  );
  // An offline-created local ID may already have been mapped to this remote ID.
  // Treat its queued edits as pending too, otherwise the pull phase can overwrite them.
  const mapped = await d.getFirstAsync<{ localId: string }>(
    "SELECT localId FROM id_map WHERE remoteId=? AND entity=?",
    id,
    entity,
  );
  for (const row of rows) {
    if (row.entityId === id || (mapped && row.entityId === mapped.localId))
      return true;
    if (row.action === "reorder" && entity === "note") {
      try {
        const payload = await open<any>(row.payload);
        if (
          (payload.items ?? []).some(
            (item: any) =>
              item.id === id || (mapped && item.id === mapped.localId),
          )
        )
          return true;
      } catch {}
    }
  }
  return false;
}
export async function cacheSignedInUser(user: User) {
  await SecureStore.setItemAsync(
    "keepsecret.cached-user",
    JSON.stringify(user),
  );
}
export async function getCachedSignedInUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync("keepsecret.cached-user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
export async function clearLocalTrash() {
  const d = await db();
  const noteRows = await d.getAllAsync<{ id: string; payload: string }>(
    "SELECT id,payload FROM notes",
  );
  const bookRows = await d.getAllAsync<{ id: string; payload: string }>(
    "SELECT id,payload FROM notebooks",
  );
  for (const row of noteRows) {
    try {
      const value = await open<any>(row.payload);
      if (value.isDeleted)
        await d.runAsync("DELETE FROM notes WHERE id=?", row.id);
    } catch {}
  }
  for (const row of bookRows) {
    try {
      const value = await open<any>(row.payload);
      if (value.isDeleted)
        await d.runAsync("DELETE FROM notebooks WHERE id=?", row.id);
    } catch {}
  }
}
export async function clearLocalPrivateData() {
  const d = await db();
  await d.execAsync(
    "DELETE FROM notes; DELETE FROM notebooks; DELETE FROM pending_ops; DELETE FROM id_map;",
  );
  await SecureStore.deleteItemAsync("keepsecret.local-encryption-key");
  await SecureStore.deleteItemAsync("keepsecret.cached-user");
  localKeyPromise = null;
}
export async function getThemePreference(): Promise<boolean> {
  return (await SecureStore.getItemAsync("keepsecret.theme.dark")) === "true";
}
export async function setThemePreference(value: boolean) {
  await SecureStore.setItemAsync(
    "keepsecret.theme.dark",
    value ? "true" : "false",
  );
}
