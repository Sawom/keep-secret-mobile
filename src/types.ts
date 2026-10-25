export type User = { id: string; email: string; name?: string; fullName?: string; role?: 'USER' | 'ADMIN' };

export type Note = {
  id: string; title: string; content: string; color?: string | null; isPinned: boolean;
  position?: number; notebookId?: string | null; isDeleted?: boolean; deletedAt?: string | null;
  createdAt?: string; updatedAt?: string; version?: number; tags?: string[]; offlineOnly?: boolean;
};

export type Notebook = {
  id: string; title: string; description?: string | null; color?: string | null; icon?: string | null;
  position?: number; createdAt?: string; updatedAt?: string; deletedAt?: string | null; isDeleted?: boolean; _count?: { notes: number }; offlineOnly?: boolean;
};
