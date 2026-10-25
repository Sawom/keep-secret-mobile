// Browser-only development adapter so the same Expo screens can be smoke-tested on web.
// Android uses SQLite + Android Keystore-backed SecureStore from localDb.ts.
import CryptoJS from "crypto-js";
import type { Note, Notebook, User } from "../types";
const KEY = "keepsecret.web.local-key";
const NOTES = "keepsecret.web.notes";
const BOOKS = "keepsecret.web.notebooks";
const OPS = "keepsecret.web.pending";
const MAP = "keepsecret.web.id-map";
const USER = "keepsecret.web.cached-user";
const key = () => {
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem(KEY, k);
  }
  return k;
};
const seal = (v: unknown) =>
  CryptoJS.AES.encrypt(JSON.stringify(v), key()).toString();
const open = <T>(v: string): T =>
  JSON.parse(CryptoJS.AES.decrypt(v, key()).toString(CryptoJS.enc.Utf8)) as T;
function read<T>(storage: string): T[] {
  try {
    return (JSON.parse(localStorage.getItem(storage) || "[]") as string[]).map(
      (x) => open<T>(x),
    );
  } catch {
    return [];
  }
}
function write<T>(storage: string, items: T[]) {
  localStorage.setItem(storage, JSON.stringify(items.map(seal)));
}
export async function initLocalDb() {
  key();
}
export async function getLocalNotes(includeDeleted = false): Promise<Note[]> {
  return read<Note>(NOTES)
    .filter((n) => (includeDeleted ? !!n.isDeleted : !n.isDeleted))
    .sort(
      (a, b) =>
        Number(!!b.isPinned) - Number(!!a.isPinned) ||
        (a.position ?? 0) - (b.position ?? 0),
    );
}
export async function getLocalNotebooks(): Promise<Notebook[]> {
  return read<Notebook>(BOOKS).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}
export async function saveLocalNote(note: Note, _pending = false) {
  const a = read<Note>(NOTES).filter((x) => x.id !== note.id);
  a.push(note);
  write(NOTES, a);
}
export async function saveLocalNotebook(book: Notebook, _pending = false) {
  const a = read<Notebook>(BOOKS).filter((x) => x.id !== book.id);
  a.push(book);
  write(BOOKS, a);
}
export async function removeLocalNote(id: string) {
  write(
    NOTES,
    read<Note>(NOTES).filter((x) => x.id !== id),
  );
}
export async function removeLocalNotebook(id: string) {
  write(
    BOOKS,
    read<Notebook>(BOOKS).filter((x) => x.id !== id),
  );
}
export async function enqueue(
  entity: "note" | "notebook",
  action: string,
  entityId: string,
  payload: unknown,
) {
  const a = JSON.parse(localStorage.getItem(OPS) || "[]");
  a.push({
    id: a.length ? Math.max(...a.map((x: any) => x.id)) + 1 : 1,
    entity,
    action,
    entityId,
    payload: seal(payload),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(OPS, JSON.stringify(a));
}
export async function pendingOps() {
  return (JSON.parse(localStorage.getItem(OPS) || "[]") as any[])
    .map((x) => ({ ...x, payload: open(x.payload) }))
    .sort((a, b) => a.id - b.id);
}
export async function removePendingOp(id: number) {
  localStorage.setItem(
    OPS,
    JSON.stringify(
      (JSON.parse(localStorage.getItem(OPS) || "[]") as any[]).filter(
        (x) => x.id !== id,
      ),
    ),
  );
}
export async function mapRemoteId(
  localId: string,
  remoteId: string,
  entity: string,
) {
  const a = JSON.parse(localStorage.getItem(MAP) || "[]").filter(
    (x: any) => x.localId !== localId,
  );
  a.push({ localId, remoteId, entity });
  localStorage.setItem(MAP, JSON.stringify(a));
}
export async function resolveRemoteId(id: string) {
  if (!id.startsWith("local-")) return id;
  return (
    (JSON.parse(localStorage.getItem(MAP) || "[]") as any[]).find(
      (x) => x.localId === id,
    )?.remoteId ?? id
  );
}
export async function replaceLocalId(
  entity: "note" | "notebook",
  localId: string,
  remoteId: string,
  value: Note | Notebook,
) {
  await mapRemoteId(localId, remoteId, entity);
  if (entity === "note") {
    await saveLocalNote(value as Note);
    await removeLocalNote(localId);
  } else {
    await saveLocalNotebook(value as Notebook);
    await removeLocalNotebook(localId);
  }
}
export async function markSynced(
  entity: "note" | "notebook",
  id: string,
  value: Note | Notebook,
) {
  if (entity === "note") await saveLocalNote(value as Note);
  else await saveLocalNotebook(value as Notebook);
}
export async function hasPendingFor(entity: string, id: string) {
  return (await pendingOps()).some(
    (x) =>
      x.entity === entity &&
      (x.entityId === id ||
        (x.action === "reorder" &&
          entity === "note" &&
          (x.payload.items ?? []).some((item: any) => item.id === id))),
  );
}
export async function cacheSignedInUser(user: User) {
  localStorage.setItem(USER, JSON.stringify(user));
}
export async function getCachedSignedInUser(): Promise<User | null> {
  try {
    return JSON.parse(localStorage.getItem(USER) || "null") as User | null;
  } catch {
    return null;
  }
}
export async function clearLocalTrash() {
  write(
    NOTES,
    read<Note>(NOTES).filter((x) => !x.isDeleted),
  );
  write(
    BOOKS,
    read<Notebook>(BOOKS).filter((x) => !x.isDeleted),
  );
}
export async function clearLocalPrivateData() {
  localStorage.removeItem(NOTES);
  localStorage.removeItem(BOOKS);
  localStorage.removeItem(OPS);
  localStorage.removeItem(MAP);
  localStorage.removeItem(USER);
  localStorage.removeItem(KEY);
}
export async function getThemePreference(): Promise<boolean> {
  return localStorage.getItem("keepsecret.theme.dark") === "true";
}
export async function setThemePreference(value: boolean) {
  localStorage.setItem("keepsecret.theme.dark", value ? "true" : "false");
}
