import { api } from "./client";
import type { Note, Notebook, User } from "../types";

export type HealthReport = {
  generatedAt: string;
  counts: Record<string, number>;
  api: {
    windowHours: number;
    sampleCount: number;
    totalRequests: number;
    averageResponseTimeMs: number;
    errorRequests: number;
    errorRatePercent: number;
    endpoints: {
      endpoint: string;
      requests: number;
      averageResponseTimeMs: number;
      errors: number;
      statuses: Record<string, number>;
    }[];
    note: string;
  };
};

type PageResult<T> = {
  items: T[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Normalize the common NestJS pagination/envelope shapes used by the web API.
 * The native Axios adapter already unwraps AxiosResponse.data, so this function
 * handles the response body itself (array, {data: []}, or nested {data:{data:[]}}).
 */
function extractPage<T>(body: unknown): PageResult<T> {
  if (Array.isArray(body)) return { items: body as T[] };

  const roots: Record<string, any>[] = [];
  let current: unknown = body;
  for (let depth = 0; depth < 4 && isRecord(current); depth++) {
    roots.push(current);
    current =
      (current as any).data && !Array.isArray((current as any).data)
        ? (current as any).data
        : null;
  }

  for (const root of roots) {
    const candidate =
      (Array.isArray(root.data) && root.data) ||
      (Array.isArray(root.items) && root.items) ||
      (Array.isArray(root.results) && root.results) ||
      (Array.isArray(root.notes) && root.notes) ||
      (Array.isArray(root.notebooks) && root.notebooks) ||
      (Array.isArray(root.records) && root.records);
    if (candidate) {
      // Pagination metadata may live outside a nested `data` envelope.
      const metadata = roots.flatMap((entry) => [
        entry,
        ...(isRecord(entry.meta) ? [entry.meta] : []),
        ...(isRecord(entry.pagination) ? [entry.pagination] : []),
        ...(isRecord(entry.pageInfo) ? [entry.pageInfo] : []),
      ]);
      const firstDefined = (keys: string[]) => {
        for (const entry of metadata) {
          for (const key of keys) {
            if (entry[key] !== undefined && entry[key] !== null)
              return entry[key];
          }
        }
        return undefined;
      };
      return {
        items: candidate as T[],
        nextCursor:
          firstDefined(["nextCursor", "next_cursor", "cursor"]) ?? null,
        hasMore: firstDefined(["hasMore", "has_more", "hasNextPage"]),
      };
    }
  }

  return { items: [] };
}

/** Unwrap an entity response without assuming whether the controller returns
 * the entity directly or wraps it in {data}, {note}, or {notebook}. */
function unwrapEntity<T>(body: unknown, keys: string[] = []): T {
  let value: any = body;
  for (let depth = 0; depth < 3 && isRecord(value); depth++) {
    const keyed = keys.map((key) => value[key]).find((item) => item != null);
    if (keyed != null) {
      value = keyed;
      continue;
    }
    if (value.data != null && !Array.isArray(value.data)) {
      value = value.data;
      continue;
    }
    break;
  }
  return value as T;
}

async function getPaged<T>(path: string, maxPages = 100): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;

  // Cursor pagination is used when the API provides a cursor. If the API returns
  // a plain array or a single-page envelope, use that page and stop immediately.
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);

    const body = await api.get(`${path}?${params.toString()}`);
    const result = extractPage<T>(body);
    all.push(...result.items);

    const nextCursor = result.nextCursor || undefined;
    const explicitlyHasMore = result.hasMore;
    if (!nextCursor || explicitlyHasMore === false) break;
    if (explicitlyHasMore === undefined && !nextCursor) break;
    if (nextCursor === cursor) break;
    cursor = nextCursor;
  }

  return all;
}

export const dataService = {
  // First-page methods are used to paint the screen quickly. The full paginated
  // methods still load every page in the background so older records are not lost.
  getNotesFirstPage: () => getPaged<Note>("/notes", 1),
  getNotebooksFirstPage: () => getPaged<Notebook>("/notebooks", 1),
  getNotes: () => getPaged<Note>("/notes"),
  getNotebooks: () => getPaged<Notebook>("/notebooks"),

  searchNotes: async (q: string) => {
    const body = await api.get(
      `/notes/search?q=${encodeURIComponent(q)}&limit=100`,
    );
    return extractPage<Note>(body).items;
  },

  createNote: async (payload: Partial<Note>) =>
    unwrapEntity<Note>(await api.post("/notes", payload), ["note"]),
  updateNote: async (id: string, payload: Partial<Note>) =>
    unwrapEntity<Note>(await api.patch(`/notes/${id}`, payload), ["note"]),
  trashNote: (id: string) => api.patch(`/notes/${id}/trash`),
  restoreNote: (id: string) => api.patch(`/notes/${id}/restore`),
  permanentDeleteNote: (id: string) => api.delete(`/notes/${id}`),
  bulkTrashNotes: (ids: string[]) =>
    api.delete("/notes/bulk", { data: { ids } }),
  reorderNotes: (
    items: { id: string; position: number }[],
    notebookId?: string | null,
  ) => api.patch("/notes/reorder", { items, notebookId }),

  reorderNotebook: (
    id: string,
    beforeId?: string | null,
    afterId?: string | null,
  ) => api.patch("/notebooks/reorder", { id, beforeId, afterId }),
  createNotebook: async (payload: Partial<Notebook>) =>
    unwrapEntity<Notebook>(await api.post("/notebooks", payload), ["notebook"]),
  updateNotebook: async (id: string, payload: Partial<Notebook>) =>
    unwrapEntity<Notebook>(await api.patch(`/notebooks/${id}`, payload), [
      "notebook",
    ]),
  trashNotebook: (id: string) => api.patch(`/notebooks/${id}/trash`),
  restoreNotebook: (id: string) => api.patch(`/notebooks/${id}/restore`),
  permanentDeleteNotebook: (id: string) => api.delete(`/notebooks/${id}`),

  getTrash: async () => {
    const body = await api.get("/trash");
    const value = unwrapEntity<any>(body);
    return {
      notes: extractPage<Note>(value.notes ?? value.data?.notes ?? []).items,
      notebooks: extractPage<Notebook>(
        value.notebooks ?? value.data?.notebooks ?? [],
      ).items,
    };
  },
  emptyTrash: () => api.delete("/trash/empty"),
  getProfile: () => api.get("/users/me") as unknown as Promise<User>,
  updateProfile: (fullName: string) =>
    api.patch("/users/me", { fullName }) as unknown as Promise<User>,
  getAdminHealth: () =>
    api.get("/admin/health") as unknown as Promise<HealthReport>,
};
