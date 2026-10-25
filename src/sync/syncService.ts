import NetInfo from "@react-native-community/netinfo";
import { dataService } from "../api/dataService";
import {
  enqueue,
  getLocalNotes,
  getLocalNotebooks,
  hasPendingFor,
  markSynced,
  pendingOps,
  removePendingOp,
  replaceLocalId,
  resolveRemoteId,
  saveLocalNote,
  saveLocalNotebook,
  removeLocalNote,
  removeLocalNotebook,
} from "../storage/localDb";
import type { Note, Notebook } from "../types";

let running: Promise<{
  synced: number;
  online: boolean;
  error?: string;
}> | null = null;
export async function syncNow() {
  if (running) return running;
  running = (async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected || state.isInternetReachable === false)
      return { synced: 0, online: false };
    let synced = 0;
    let lastError: string | undefined;
    const ops = await pendingOps();
    for (const op of ops) {
      const id = await resolveRemoteId(op.entityId);
      try {
        if (op.action === "create") {
          const payload = { ...op.payload };
          if (payload.notebookId)
            payload.notebookId = await resolveRemoteId(payload.notebookId);
          if (op.entity === "note") {
            const created = await dataService.createNote(payload);
            await replaceLocalId("note", op.entityId, created.id, created);
          } else {
            const created = await dataService.createNotebook(payload);
            await replaceLocalId("notebook", op.entityId, created.id, created);
          }
        } else if (op.action === "update") {
          const payload = { ...op.payload };
          if (payload.notebookId)
            payload.notebookId = await resolveRemoteId(payload.notebookId);
          const updated =
            op.entity === "note"
              ? await dataService.updateNote(id, payload)
              : await dataService.updateNotebook(id, payload);
          await markSynced(
            op.entity as "note" | "notebook",
            id,
            updated as Note | Notebook,
          );
        } else if (op.action === "trash") {
          if (op.entity === "note") {
            await dataService.trashNote(id);
            const [activeCached, deletedCached] = await Promise.all([
              getLocalNotes(),
              getLocalNotes(true),
            ]);
            const cached = [...activeCached, ...deletedCached].find(
              (n) => n.id === id || n.id === op.entityId,
            );
            if (cached)
              await saveLocalNote(
                {
                  ...cached,
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                },
                false,
              );
          } else {
            await dataService.trashNotebook(id);
            const cached = (await getLocalNotebooks()).find(
              (n) => n.id === id || n.id === op.entityId,
            );
            if (cached)
              await saveLocalNotebook(
                { ...cached, isDeleted: true } as Notebook,
                false,
              );
          }
        } else if (op.action === "restore") {
          if (op.entity === "note") await dataService.restoreNote(id);
          else await dataService.restoreNotebook(id);
        } else if (op.action === "permanent-delete") {
          if (op.entity === "note") await dataService.permanentDeleteNote(id);
          else await dataService.permanentDeleteNotebook(id);
        } else if (op.action === "reorder") {
          if (op.entity === "note") {
            const items = (op.payload.items ?? []).map(
              (item: { id: string; position: number }) => ({ ...item }),
            );
            for (const item of items) item.id = await resolveRemoteId(item.id);
            const notebookId = op.payload.notebookId
              ? await resolveRemoteId(op.payload.notebookId)
              : null;
            await dataService.reorderNotes(items, notebookId);
          } else {
            await dataService.reorderNotebook(
              id,
              op.payload.beforeId
                ? await resolveRemoteId(op.payload.beforeId)
                : null,
              op.payload.afterId
                ? await resolveRemoteId(op.payload.afterId)
                : null,
            );
          }
        }
        await removePendingOp(op.id);
        synced++;
      } catch (error: any) {
        // Preserve the operation and surface a safe diagnostic; never discard private user data.
        const raw = error?.response?.data?.message;
        lastError =
          (Array.isArray(raw) ? raw.join(", ") : raw) ||
          (error?.response?.status
            ? `HTTP ${error.response.status}`
            : error?.message) ||
          "Network request failed";
        // Stop because later operations may depend on this operation's ID mapping.
        break;
      }
    }
    try {
      const [remoteNotes, remoteNotebooks] = await Promise.all([
        dataService.getNotes(),
        dataService.getNotebooks(),
      ]);
      const remoteNoteIds = new Set(remoteNotes.map((n) => n.id));
      const remoteNotebookIds = new Set(remoteNotebooks.map((n) => n.id));
      for (const local of await getLocalNotes())
        if (
          !local.id.startsWith("local-") &&
          !remoteNoteIds.has(local.id) &&
          !(await hasPendingFor("note", local.id))
        )
          await removeLocalNote(local.id);
      for (const local of await getLocalNotebooks())
        if (
          !local.id.startsWith("local-") &&
          !remoteNotebookIds.has(local.id) &&
          !(await hasPendingFor("notebook", local.id)) &&
          !local.isDeleted
        )
          await removeLocalNotebook(local.id);
      // Cache independent records concurrently; serial encryption/database writes
      // made a larger account feel slow after every refresh.
      const [notesToCache, notebooksToCache] = await Promise.all([
        Promise.all(
          remoteNotes.map(async (note) => ({
            note,
            pending: await hasPendingFor("note", note.id),
          })),
        ),
        Promise.all(
          remoteNotebooks.map(async (notebook) => ({
            notebook,
            pending: await hasPendingFor("notebook", notebook.id),
          })),
        ),
      ]);
      await Promise.all([
        ...notesToCache
          .filter(({ pending }) => !pending)
          .map(({ note }) => saveLocalNote(note, false)),
        ...notebooksToCache
          .filter(({ pending }) => !pending)
          .map(({ notebook }) => saveLocalNotebook(notebook, false)),
      ]);
    } catch (error: any) {
      // Cached data remains available when a pull fails.
      if (!lastError) {
        const raw = error?.response?.data?.message;
        lastError =
          (Array.isArray(raw) ? raw.join(", ") : raw) ||
          (error?.response?.status
            ? `HTTP ${error.response.status}`
            : error?.message) ||
          "Could not refresh server data";
      }
    }
    return { synced, online: true, error: lastError };
  })().finally(() => {
    running = null;
  });
  return running;
}

export async function createOfflineNote(payload: Partial<Note>) {
  const now = new Date().toISOString();
  const note: Note = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title ?? "",
    content: payload.content ?? "",
    isPinned: payload.isPinned ?? false,
    notebookId: payload.notebookId ?? null,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    offlineOnly: true,
  };
  await saveLocalNote(note, true);
  await enqueue("note", "create", note.id, {
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    notebookId: note.notebookId,
  });
  return note;
}
export async function updateOfflineNote(note: Note, patch: Partial<Note>) {
  const updated = { ...note, ...patch, updatedAt: new Date().toISOString() };
  await saveLocalNote(updated, true);
  await enqueue("note", "update", note.id, patch);
  return updated;
}
export async function trashOfflineNote(note: Note) {
  const updated = {
    ...note,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveLocalNote(updated, true);
  await enqueue("note", "trash", note.id, {});
  return updated;
}
export async function createOfflineNotebook(payload: Partial<Notebook>) {
  const now = new Date().toISOString();
  const notebook: Notebook = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title ?? "Untitled notebook",
    description: payload.description ?? "",
    color: payload.color ?? "#3B82F6",
    icon: payload.icon ?? "book",
    position: payload.position ?? 0,
    createdAt: now,
    updatedAt: now,
    offlineOnly: true,
  };
  await saveLocalNotebook(notebook, true);
  await enqueue("notebook", "create", notebook.id, {
    title: notebook.title,
    description: notebook.description,
    color: notebook.color,
    icon: notebook.icon,
    position: notebook.position,
  });
  return notebook;
}
export async function updateOfflineNotebook(
  notebook: Notebook,
  patch: Partial<Notebook>,
) {
  const updated = {
    ...notebook,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveLocalNotebook(updated, true);
  await enqueue("notebook", "update", notebook.id, patch);
  return updated;
}
export async function trashOfflineNotebook(notebook: Notebook) {
  const updated = {
    ...notebook,
    isDeleted: true,
    updatedAt: new Date().toISOString(),
  };
  await saveLocalNotebook(updated, true);
  await enqueue("notebook", "trash", notebook.id, {});
  return updated;
}

export async function restoreOfflineNote(note: Note) {
  const updated = {
    ...note,
    isDeleted: false,
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  };
  await saveLocalNote(updated, true);
  await enqueue("note", "restore", note.id, {});
  return updated;
}
export async function restoreOfflineNotebook(notebook: Notebook) {
  const updated = {
    ...notebook,
    isDeleted: false,
    updatedAt: new Date().toISOString(),
  } as Notebook;
  await saveLocalNotebook(updated, true);
  await enqueue("notebook", "restore", notebook.id, {});
  return updated;
}
export async function permanentlyDeleteOffline(
  entity: "note" | "notebook",
  id: string,
) {
  if (entity === "note") {
    const { removeLocalNote } = await import("../storage/localDb");
    await removeLocalNote(id);
  } else {
    const { removeLocalNotebook } = await import("../storage/localDb");
    await removeLocalNotebook(id);
  }
  await enqueue(entity, "permanent-delete", id, {});
}

export async function queueNoteReorder(
  items: { id: string; position: number }[],
  notebookId: string | null,
) {
  const all = await getLocalNotes();
  for (const item of items) {
    const note = all.find((n) => n.id === item.id);
    if (note)
      await saveLocalNote(
        {
          ...note,
          position: item.position,
          updatedAt: new Date().toISOString(),
        },
        true,
      );
  }
  await enqueue("note", "reorder", "__notes_order__", { items, notebookId });
}
export async function queueNotebookReorder(
  book: Notebook,
  beforeId: string | null,
  afterId: string | null,
  reordered: Notebook[],
) {
  for (const item of reordered)
    await saveLocalNotebook({ ...item, position: item.position }, true);
  await enqueue("notebook", "reorder", book.id, { beforeId, afterId });
}
