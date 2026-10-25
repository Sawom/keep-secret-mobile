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
async function getPaged<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);
    const result = (await api.get(
      `${path}?${params.toString()}`,
    )) as unknown as {
      data: T[];
      nextCursor?: string | null;
      hasMore?: boolean;
    };
    all.push(...(result.data ?? []));
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return all;
}
export const dataService = {
  getNotes: () => getPaged<Note>("/notes"),
  getNotebooks: () => getPaged<Notebook>("/notebooks"),
  searchNotes: async (q: string) => {
    const result = (await api.get(
      `/notes/search?q=${encodeURIComponent(q)}&limit=100`,
    )) as unknown as { data: Note[] };
    return result.data ?? [];
  },
  createNote: (payload: Partial<Note>) =>
    api.post("/notes", payload) as unknown as Promise<Note>,
  updateNote: (id: string, payload: Partial<Note>) =>
    api.patch(`/notes/${id}`, payload) as unknown as Promise<Note>,
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
  createNotebook: (payload: Partial<Notebook>) =>
    api.post("/notebooks", payload) as unknown as Promise<Notebook>,
  updateNotebook: (id: string, payload: Partial<Notebook>) =>
    api.patch(`/notebooks/${id}`, payload) as unknown as Promise<Notebook>,
  trashNotebook: (id: string) => api.patch(`/notebooks/${id}/trash`),
  restoreNotebook: (id: string) => api.patch(`/notebooks/${id}/restore`),
  permanentDeleteNotebook: (id: string) => api.delete(`/notebooks/${id}`),
  getTrash: () =>
    api.get("/trash") as unknown as Promise<{
      notes: Note[];
      notebooks: Notebook[];
    }>,
  emptyTrash: () => api.delete("/trash/empty"),
  getProfile: () => api.get("/users/me") as unknown as Promise<User>,
  updateProfile: (fullName: string) =>
    api.patch("/users/me", { fullName }) as unknown as Promise<User>,
  getAdminHealth: () =>
    api.get("/admin/health") as unknown as Promise<HealthReport>,
};
