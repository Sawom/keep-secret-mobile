import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { signInWithGoogle } from "./src/auth/googleSignIn";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { authService } from "./src/auth/authService";
import { dataService, type HealthReport } from "./src/api/dataService";
import {
  cacheSignedInUser,
  clearLocalPrivateData,
  getCachedSignedInUser,
  getLocalNotes,
  getLocalNotebooks,
  initLocalDb,
  getThemePreference,
  setThemePreference,
  clearLocalTrash,
  removeLocalNote,
  removeLocalNotebook,
  resolveRemoteId,
  saveLocalNote,
  saveLocalNotebook,
  pendingOps,
} from "./src/storage/localDb";
import {
  createOfflineNote,
  createOfflineNotebook,
  permanentlyDeleteOffline,
  restoreOfflineNote,
  restoreOfflineNotebook,
  syncNow,
  queueNoteReorder,
  queueNotebookReorder,
  trashOfflineNote,
  trashOfflineNotebook,
  updateOfflineNote,
  updateOfflineNotebook,
} from "./src/sync/syncService";
import type { Note, Notebook, User } from "./src/types";
import { palette } from "./src/theme/theme";
import { NoteEditor, NotebookEditor } from "./src/components/Editors";
import {
  AuthScreen,
  type AuthMode,
  type AuthValues,
} from "./src/screens/AuthScreen";
import { NotesScreen } from "./src/screens/NotesScreen";
import { NotebooksScreen } from "./src/screens/NotebooksScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { TrashScreen } from "./src/screens/TrashScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AdminHealthScreen } from "./src/screens/AdminHealthScreen";
import { Ionicons } from "@expo/vector-icons";

type Tab = "Notes" | "Notebooks" | "Trash" | "Profile" | "Health";
const emptyAuth: AuthValues = {
  email: "",
  name: "",
  password: "",
  confirm: "",
  resetToken: "",
};

function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  danger = true,
) {
  if (Platform.OS === "web") {
    const yes =
      typeof window !== "undefined"
        ? window.confirm(`${title}\n\n${message}`)
        : true;
    if (yes) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmLabel,
      style: danger ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>("Notes");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authValues, setAuthValues] = useState<AuthValues>(emptyAuth);
  const [isDark, setIsDark] = useState(false);
  const [online, setOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [trashNotebooks, setTrashNotebooks] = useState<Notebook[]>([]);
  const [search, setSearch] = useState("");
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteNotebookId, setNoteNotebookId] = useState<string | null>(null);
  const [notebookEditorVisible, setNotebookEditorVisible] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [notebookTitle, setNotebookTitle] = useState("");
  const [notebookDescription, setNotebookDescription] = useState("");
  const [notebookColor, setNotebookColor] = useState("#3B82F6");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState("");
  const theme = useMemo(() => palette(isDark), [isDark]);
  const changeTheme = (value: boolean) => {
    setIsDark(value);
    void setThemePreference(value);
  };
  const refreshLocal = useCallback(async () => {
    const [n, b, t] = await Promise.all([
      getLocalNotes(),
      getLocalNotebooks(),
      getLocalNotes(true),
    ]);
    setNotes(n);
    setNotebooks(b.filter((x) => !(x as any).isDeleted));
    setTrashNotes(t);
    setTrashNotebooks(b.filter((x) => !!(x as any).isDeleted));
  }, []);
  const pullTrash = useCallback(async () => {
    if (!online) return;
    try {
      const result = await dataService.getTrash();
      const remoteNotes = result.notes ?? [];
      const remoteBooks = result.notebooks ?? [];
      const noteIds = new Set(remoteNotes.map((n) => n.id));
      const bookIds = new Set(remoteBooks.map((b) => b.id));
      for (const cached of await getLocalNotes(true)) {
        if (
          !cached.id.startsWith("local-") &&
          !noteIds.has(cached.id) &&
          !(await import("./src/storage/localDb")).hasPendingFor(
            "note",
            cached.id,
          )
        )
          await removeLocalNote(cached.id);
      }
      for (const cached of await getLocalNotebooks()) {
        if (
          cached.isDeleted &&
          !cached.id.startsWith("local-") &&
          !bookIds.has(cached.id) &&
          !(await import("./src/storage/localDb")).hasPendingFor(
            "notebook",
            cached.id,
          )
        )
          await removeLocalNotebook(cached.id);
      }
      setTrashNotes(remoteNotes);
      setTrashNotebooks(remoteBooks);
      for (const n of remoteNotes)
        await saveLocalNote({ ...n, isDeleted: true }, false);
      for (const b of remoteBooks)
        await saveLocalNotebook({ ...b, isDeleted: true } as Notebook, false);
    } catch {
      /* Keep encrypted cache available if network fails. */
    }
  }, [online]);
  const sync = useCallback(async () => {
    if (!user || !online || syncing) return;
    setSyncing(true);
    try {
      await syncNow();
      await refreshLocal();
      await pullTrash();
    } catch (e) {
      console.warn("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  }, [user, online, syncing, refreshLocal, pullTrash]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initLocalDb();
        const savedTheme = await getThemePreference();
        if (alive) setIsDark(savedTheme);
        const state = await NetInfo.fetch();
        if (alive)
          setOnline(!!state.isConnected && state.isInternetReachable !== false);
        await refreshLocal();
        try {
          const result = await authService.profile();
          if (alive) {
            setUser(result.user);
            setShowHome(false);
            await cacheSignedInUser(result.user);
          }
        } catch {
          const cached = await getCachedSignedInUser();
          if (alive && cached) {
            setUser(cached);
            setShowHome(false);
          }
        }
      } catch (e) {
        console.warn("App bootstrap failed", e);
      } finally {
        if (alive) setBooting(false);
      }
    })();
    const unsub = NetInfo.addEventListener((s: NetInfoState) =>
      setOnline(!!s.isConnected && s.isInternetReachable !== false),
    );
    return () => {
      alive = false;
      unsub();
    };
  }, [refreshLocal]);
  useEffect(() => {
    const applyResetLink = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        if (
          parsed.protocol === "keepsecret:" &&
          parsed.hostname === "reset-password"
        ) {
          const token = parsed.searchParams.get("token") || "";
          if (token) {
            setAuthMode("reset");
            setAuthValues((v) => ({ ...v, resetToken: token }));
            setMessage(
              "Reset token loaded from your email link. Choose a new password.",
            );
          }
        }
      } catch {}
    };
    void Linking.getInitialURL().then(applyResetLink);
    const sub = Linking.addEventListener("url", (event) =>
      applyResetLink(event.url),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (user && online) void sync();
  }, [user, online]);
  // Pull changes made on the web while the mobile app stays open, and sync again
  // when Android brings the app back to the foreground.
  useEffect(() => {
    if (!user || !online) return;
    const refreshFromServer = () => {
      void syncNow()
        .then(() => refreshLocal())
        .catch((error) => console.warn("Background sync failed", error));
    };
    const interval = setInterval(refreshFromServer, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshFromServer();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id, online, refreshLocal]);
  useEffect(() => {
    if (!user) return;
    void pullTrash();
  }, [user, online, pullTrash]);
  const loadHealthReport = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setHealthLoading(true);
    setHealthError("");
    try {
      const report = await dataService.getAdminHealth();
      setHealthReport(report);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setHealthError(
        (Array.isArray(message) ? message.join(", ") : message) ||
          (error?.response?.status === 403
            ? "Your account does not have admin permission on the backend."
            : error?.response?.status
              ? `Health API returned HTTP ${error.response.status}.`
              : error?.message ||
                "Please check your internet connection and try again."),
      );
    } finally {
      setHealthLoading(false);
    }
  }, [user?.role]);
  useEffect(() => {
    if (user?.role === "ADMIN" && tab === "Health") void loadHealthReport();
  }, [user?.role, tab, loadHealthReport]);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editorVisible) {
        setEditorVisible(false);
        return true;
      }
      if (notebookEditorVisible) {
        setNotebookEditorVisible(false);
        return true;
      }
      if (selectedNotebook) {
        setSelectedNotebook(null);
        return true;
      }
      if (tab !== "Notes") {
        setTab("Notes");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [editorVisible, notebookEditorVisible, selectedNotebook, tab]);
  const openNewNote = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setNoteNotebookId(selectedNotebook);
    setEditorVisible(true);
  };
  const openEditNote = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteNotebookId(note.notebookId || null);
    setEditorVisible(true);
  };
  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a title.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Content required", "Please enter some note content.");
      return;
    }
    setBusy(true);
    try {
      let savedId: string;
      if (editing) {
        const patch = {
          title: title.trim(),
          content,
          notebookId: noteNotebookId,
        };
        await updateOfflineNote(editing, patch);
        savedId = editing.id;
      } else {
        const payload = {
          title: title.trim(),
          content,
          isPinned: false,
          notebookId: noteNotebookId,
        };
        const created = await createOfflineNote(payload);
        savedId = created.id;
      }
      setEditorVisible(false);
      await refreshLocal();
      if (online) {
        let result = await syncNow();
        let stillPending = (await pendingOps()).some(
          (op) => op.entity === "note" && op.entityId === savedId,
        );
        if (stillPending) {
          result = await syncNow();
          stillPending = (await pendingOps()).some(
            (op) => op.entity === "note" && op.entityId === savedId,
          );
        }
        await refreshLocal();
        if (stillPending) {
          const detail = (result as any)?.error;
          Alert.alert(
            "Saved on this device",
            detail
              ? `Server sync is pending: ${detail}`
              : "Your note is saved locally. It will sync when the server connection is available.",
          );
        }
      } else {
        Alert.alert(
          "Saved offline",
          "Your note is encrypted on this device and will sync when you are online.",
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Could not save note",
        e?.response?.data?.message ||
          e?.message ||
          "Local save failed. Check device storage and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const moveNoteToTrash = async (note: Note) => {
    try {
      if (online && !note.id.startsWith("local-")) {
        await dataService.trashNote(await resolveRemoteId(note.id));
        await saveLocalNote(
          { ...note, isDeleted: true, deletedAt: new Date().toISOString() },
          false,
        );
      } else await trashOfflineNote(note);
      await refreshLocal();
      await pullTrash();
      if (online) void sync();
    } catch {
      Alert.alert("Error", "Could not move note to Trash.");
    }
  };
  const deleteNote = (note: Note) =>
    confirmAction(
      "Move to Trash?",
      "This note will be moved to Trash.",
      "Move to Trash",
      () => void moveNoteToTrash(note),
    );
  const bulkDelete = async (ids: string[]) => {
    if (!ids.length) return;
    confirmAction(
      "Move selected notes to Trash?",
      `${ids.length} note(s) will be moved to Trash.`,
      "Move to Trash",
      () => {
        void (async () => {
          try {
            const selected = notes.filter((n) => ids.includes(n.id));
            const remote = selected.filter((n) => !n.id.startsWith("local-"));
            const local = selected.filter((n) => n.id.startsWith("local-"));
            if (online && remote.length)
              await dataService.bulkTrashNotes(
                await Promise.all(remote.map((n) => resolveRemoteId(n.id))),
              );
            for (const n of remote)
              await saveLocalNote(
                { ...n, isDeleted: true, deletedAt: new Date().toISOString() },
                false,
              );
            for (const n of local) await trashOfflineNote(n);
            await refreshLocal();
            await pullTrash();
            if (online) void sync();
          } catch (e: any) {
            Alert.alert(
              "Bulk delete failed",
              e?.response?.data?.message ||
                "Try again after checking the connection.",
            );
          }
        })();
      },
    );
  };
  const togglePin = async (note: Note) => {
    try {
      const patch = { isPinned: !note.isPinned };
      if (online && !note.id.startsWith("local-"))
        await saveLocalNote(
          await dataService.updateNote(await resolveRemoteId(note.id), patch),
          false,
        );
      else await updateOfflineNote(note, patch);
      await refreshLocal();
      if (online) void sync();
    } catch {
      Alert.alert("Error", "Could not update pin state.");
    }
  };
  const moveNote = async (note: Note, direction: -1 | 1) => {
    const group = notes
      .filter((n) => (n.notebookId || null) === (note.notebookId || null))
      .sort(
        (a, b) =>
          Number(!!b.isPinned) - Number(!!a.isPinned) ||
          (a.position ?? 0) - (b.position ?? 0),
      );
    const index = group.findIndex((n) => n.id === note.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= group.length) return;
    const reordered = [...group];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const items = reordered.map((n, i) => ({ id: n.id, position: i }));
    try {
      if (
        online &&
        items.every((x) => !x.id.startsWith("local-")) &&
        !(note.notebookId || "").startsWith("local-")
      ) {
        await dataService.reorderNotes(items, note.notebookId || null);
        for (const item of items) {
          const n = notes.find((x) => x.id === item.id);
          if (n) await saveLocalNote({ ...n, position: item.position }, false);
        }
      } else await queueNoteReorder(items, note.notebookId || null);
      await refreshLocal();
      if (online) void sync();
    } catch {
      Alert.alert("Reorder failed", "Could not save note order.");
    }
  };
  const openNewNotebook = () => {
    setEditingNotebook(null);
    setNotebookTitle("");
    setNotebookDescription("");
    setNotebookColor("#3B82F6");
    setNotebookEditorVisible(true);
  };
  const openEditNotebook = (book: Notebook) => {
    setEditingNotebook(book);
    setNotebookTitle(book.title);
    setNotebookDescription(book.description || "");
    setNotebookColor(book.color || "#3B82F6");
    setNotebookEditorVisible(true);
  };
  const saveNotebook = async () => {
    if (!notebookTitle.trim()) {
      Alert.alert("Title required", "Enter a notebook title.");
      return;
    }
    setBusy(true);
    try {
      let savedId: string;
      if (editingNotebook) {
        const patch = {
          title: notebookTitle.trim(),
          description: notebookDescription,
          color: notebookColor,
        };
        await updateOfflineNotebook(editingNotebook, patch);
        savedId = editingNotebook.id;
      } else {
        const payload = {
          title: notebookTitle.trim(),
          description: notebookDescription,
          color: notebookColor,
          icon: "book",
        };
        const created = await createOfflineNotebook(payload);
        savedId = created.id;
      }
      setNotebookEditorVisible(false);
      await refreshLocal();
      if (online) {
        let result = await syncNow();
        let stillPending = (await pendingOps()).some(
          (op) => op.entity === "notebook" && op.entityId === savedId,
        );
        if (stillPending) {
          result = await syncNow();
          stillPending = (await pendingOps()).some(
            (op) => op.entity === "notebook" && op.entityId === savedId,
          );
        }
        await refreshLocal();
        if (stillPending) {
          const detail = (result as any)?.error;
          Alert.alert(
            "Saved on this device",
            detail
              ? `Notebook sync is pending: ${detail}`
              : "Your notebook is saved locally and will sync when the server connection is available.",
          );
        }
      } else
        Alert.alert(
          "Saved offline",
          "Your notebook will sync when you are online.",
        );
    } catch (e: any) {
      Alert.alert(
        "Could not save notebook",
        e?.response?.data?.message || e?.message || "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const moveNotebookToTrash = async (book: Notebook) => {
    try {
      if (online && !book.id.startsWith("local-")) {
        await dataService.trashNotebook(await resolveRemoteId(book.id));
        await saveLocalNotebook(
          { ...book, isDeleted: true } as Notebook,
          false,
        );
      } else await trashOfflineNotebook(book);
      if (selectedNotebook === book.id) setSelectedNotebook(null);
      await refreshLocal();
      await pullTrash();
      if (online) void sync();
    } catch {
      Alert.alert("Error", "Could not move notebook to Trash.");
    }
  };
  const deleteNotebook = (book: Notebook) =>
    confirmAction(
      "Move notebook to Trash?",
      "The notebook and its related notes follow the backend trash rules.",
      "Move to Trash",
      () => void moveNotebookToTrash(book),
    );
  const moveNotebook = async (book: Notebook, direction: -1 | 1) => {
    const group = [...notebooks].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    const index = group.findIndex((b) => b.id === book.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= group.length) return;
    const reordered = [...group];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const before = direction === 1 ? reordered[index].id : null;
    const after = direction === -1 ? reordered[index].id : null;
    try {
      if (
        online &&
        !book.id.startsWith("local-") &&
        !reordered.some((b) => b.id.startsWith("local-"))
      ) {
        await dataService.reorderNotebook(
          await resolveRemoteId(book.id),
          before ? await resolveRemoteId(before) : null,
          after ? await resolveRemoteId(after) : null,
        );
        for (let i = 0; i < reordered.length; i++)
          await saveLocalNotebook({ ...reordered[i], position: i }, false);
      } else
        await queueNotebookReorder(
          book,
          before,
          after,
          reordered.map((b, i) => ({ ...b, position: i })),
        );
      await refreshLocal();
      if (online) void sync();
    } catch {
      Alert.alert("Reorder failed", "Could not save notebook order.");
    }
  };
  const restoreNote = async (note: Note) => {
    try {
      if (online && !note.id.startsWith("local-")) {
        await dataService.restoreNote(await resolveRemoteId(note.id));
        await saveLocalNote(
          { ...note, isDeleted: false, deletedAt: null },
          false,
        );
      } else await restoreOfflineNote(note);
      await refreshLocal();
      await pullTrash();
      if (online) void sync();
    } catch {
      Alert.alert("Error", "Could not restore note.");
    }
  };
  const restoreNotebook = async (book: Notebook) => {
    try {
      if (online && !book.id.startsWith("local-")) {
        await dataService.restoreNotebook(await resolveRemoteId(book.id));
        await saveLocalNotebook(
          { ...book, isDeleted: false } as Notebook,
          false,
        );
      } else await restoreOfflineNotebook(book);
      await refreshLocal();
      await pullTrash();
      if (online) void sync();
    } catch {
      Alert.alert("Error", "Could not restore notebook.");
    }
  };
  const permanentlyDeleteNote = (note: Note) =>
    confirmAction(
      "Delete note permanently?",
      "This cannot be undone.",
      "Delete forever",
      () =>
        void (async () => {
          try {
            if (online && !note.id.startsWith("local-"))
              await dataService.permanentDeleteNote(
                await resolveRemoteId(note.id),
              );
            await removeLocalNote(note.id);
            await refreshLocal();
            await pullTrash();
          } catch {
            Alert.alert("Error", "Could not permanently delete note.");
          }
        })(),
    );
  const permanentlyDeleteNotebook = (book: Notebook) =>
    confirmAction(
      "Delete notebook permanently?",
      "This cannot be undone.",
      "Delete forever",
      () =>
        void (async () => {
          try {
            if (online && !book.id.startsWith("local-"))
              await dataService.permanentDeleteNotebook(
                await resolveRemoteId(book.id),
              );
            await removeLocalNotebook(book.id);
            await refreshLocal();
            await pullTrash();
          } catch {
            Alert.alert("Error", "Could not permanently delete notebook.");
          }
        })(),
    );
  const emptyTrash = () =>
    confirmAction(
      "Empty Trash?",
      "All notes and notebooks in Trash will be permanently deleted.",
      "Empty Trash",
      () =>
        void (async () => {
          try {
            if (online) await dataService.emptyTrash();
            else {
              for (const n of trashNotes)
                await permanentlyDeleteOffline("note", n.id);
              for (const b of trashNotebooks)
                await permanentlyDeleteOffline("notebook", b.id);
            }
            await clearLocalTrash();
            await refreshLocal();
            await pullTrash();
            if (online) void sync();
          } catch {
            Alert.alert("Error", "Could not empty Trash.");
          }
        })(),
    );
  const submitAuth = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (authMode === "login") {
        const result = await authService.login(
          authValues.email.trim(),
          authValues.password,
        );
        setUser(result.user);
        setShowHome(false);
        await cacheSignedInUser(result.user);
        setTab("Notes");
        setAuthValues(emptyAuth);
        if (online) {
          await syncNow();
          await refreshLocal();
        }
      } else if (authMode === "register") {
        if (authValues.password !== authValues.confirm)
          throw new Error("Passwords do not match.");
        await authService.register(
          authValues.name.trim(),
          authValues.email.trim(),
          authValues.password,
          authValues.confirm,
        );
        setMessage("Registration successful. You can now sign in.");
        setAuthMode("login");
        setShowHome(false);
      } else if (authMode === "forgot") {
        await authService.forgotPassword(authValues.email.trim());
        setMessage(
          "If this email exists, a reset link has been sent. Check your email.",
        );
      } else {
        await authService.resetPassword(
          authValues.resetToken.trim(),
          authValues.password,
        );
        setMessage("Password reset successful. Please sign in.");
        setAuthMode("login");
      }
    } catch (e: any) {
      setMessage(
        e?.response?.data?.message ||
          e?.message ||
          "Request failed. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const logout = () =>
    confirmAction(
      "Log out?",
      "Your private offline cache and pending local changes will be cleared from this device. Sync pending changes before logging out if you need them.",
      "Log out",
      () =>
        void (async () => {
          try {
            await authService.logout();
          } catch {}
          setUser(null);
          setShowHome(true);
          setSearch("");
          setTab("Notes");
          setSelectedNotebook(null);
          await clearLocalPrivateData();
          await refreshLocal();
        })(),
    );
  const googleLogin = async () => {
    setBusy(true);
    setMessage("");
    try {
      const idToken = await signInWithGoogle();
      const result = await authService.googleMobile(idToken);
      setUser(result.user);
      setShowHome(false);
      await cacheSignedInUser(result.user);
      setTab("Notes");
      setMessage("");
      if (online) {
        await syncNow();
        await refreshLocal();
      }
    } catch (e: any) {
      const code = String(e?.code ?? "");
      const status = e?.response?.status;
      const serverMessage = Array.isArray(e?.response?.data?.message)
        ? e.response.data.message.join(", ")
        : e?.response?.data?.message;
      if (code === "SIGN_IN_CANCELLED" || code === "12501") return;
      if (/DEVELOPER_ERROR|(^|\D)10($|\D)/.test(code)) {
        setMessage(
          "Google Sign-In configuration mismatch. Recheck Android package com.keepsecret.mobile, the EAS SHA-1 for this build, and that webClientId is the Web OAuth Client ID. Then rebuild the development APK.",
        );
      } else if (status === 404) {
        setMessage(
          "Google sign-in endpoint was not found. Confirm /auth/google/mobile is registered in auth.module.ts and the patched backend has been deployed to Vercel.",
        );
      } else if (status === 401) {
        setMessage(
          `Backend rejected the Google ID token${serverMessage ? `: ${serverMessage}` : ". Check that backend GOOGLE_CLIENT_ID matches the Web OAuth Client ID in the mobile .env."}`,
        );
      } else {
        setMessage(
          serverMessage ||
            e?.message ||
            `Google sign-in failed${status ? ` (HTTP ${status})` : ""}. Please retry and check the configuration.`,
        );
      }
    } finally {
      setBusy(false);
    }
  };
  const openNotebook = (book: Notebook) => {
    setSearch("");
    setSelectedNotebook(book.id);
    setTab("Notes");
  };
  const renderScreen = () => {
    // Shared workspace search: notes first, then matching notebooks on this page.
    if (search.trim() && (tab === "Notes" || tab === "Notebooks")) {
      return (
        <SearchScreen
          theme={theme}
          notes={notes}
          notebooks={notebooks}
          query={search}
          onOpenNote={openEditNote}
          onTrashNote={deleteNote}
          onPinNote={togglePin}
          onOpenNotebook={openNotebook}
          onEditNotebook={openEditNotebook}
          onTrashNotebook={deleteNotebook}
        />
      );
    }

    switch (tab) {
      case "Notes":
        return (
          <NotesScreen
            theme={theme}
            notes={notes.filter(
              (n) => !selectedNotebook || n.notebookId === selectedNotebook,
            )}
            notebooks={notebooks}
            online={online}
            syncing={syncing}
            onCreate={openNewNote}
            onOpen={openEditNote}
            onTrash={deleteNote}
            onPin={togglePin}
            selectedNotebook={selectedNotebook}
            onClearNotebook={() => setSelectedNotebook(null)}
            onBulkDelete={bulkDelete}
            onMoveUp={(n) => void moveNote(n, -1)}
            onMoveDown={(n) => void moveNote(n, 1)}
          />
        );
      case "Notebooks":
        return (
          <NotebooksScreen
            theme={theme}
            notebooks={notebooks}
            onCreate={openNewNotebook}
            onEdit={openEditNotebook}
            onOpen={openNotebook}
            onTrash={deleteNotebook}
            onMoveUp={(b) => void moveNotebook(b, -1)}
            onMoveDown={(b) => void moveNotebook(b, 1)}
          />
        );
      case "Trash":
        return (
          <TrashScreen
            theme={theme}
            notes={trashNotes}
            notebooks={trashNotebooks}
            onRestoreNote={restoreNote}
            onDeleteNote={permanentlyDeleteNote}
            onRestoreNotebook={restoreNotebook}
            onDeleteNotebook={permanentlyDeleteNotebook}
            onEmptyTrash={emptyTrash}
          />
        );
      case "Profile":
        return (
          <ProfileScreen
            theme={theme}
            user={user!}
            isDark={isDark}
            onToggleTheme={() => changeTheme(!isDark)}
            onLogout={logout}
          />
        );
      case "Health":
        return user?.role === "ADMIN" ? (
          <AdminHealthScreen
            theme={theme}
            report={healthReport}
            loading={healthLoading}
            error={healthError}
            onRefresh={() => void loadHealthReport()}
          />
        ) : null;
    }
  };
  if (booting)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.brand} />
        <Text style={{ color: theme.muted, marginTop: 12 }}>
          Opening your private workspace…
        </Text>
      </SafeAreaView>
    );
  if (!user && showHome)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        <HomeScreen
          theme={theme}
          isDark={isDark}
          onToggleTheme={() => changeTheme(!isDark)}
          onSignIn={() => {
            setAuthMode("login");
            setMessage("");
            setShowHome(false);
          }}
          onGetStarted={() => {
            setAuthMode("register");
            setMessage("");
            setShowHome(false);
          }}
        />
      </SafeAreaView>
    );
  if (!user)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        <AuthScreen
          theme={theme}
          mode={authMode}
          setMode={(m) => {
            setAuthMode(m);
            setMessage("");
          }}
          values={authValues}
          setValues={setAuthValues}
          onSubmit={() => void submitAuth()}
          busy={busy}
          message={message}
          onGoogle={googleLogin}
          onBackHome={() => {
            setShowHome(true);
            setMessage("");
          }}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      <View style={{ flex: 1 }}>
        {(tab === "Notes" || tab === "Notebooks") && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginHorizontal: 16,
              marginTop: 10,
              marginBottom: 5,
              paddingHorizontal: 13,
              minHeight: 46,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 14,
              backgroundColor: theme.card,
            }}
          >
            <Ionicons name="search-outline" size={20} color={theme.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search notes and notebooks…"
              placeholderTextColor={theme.muted}
              returnKeyType="search"
              style={{
                flex: 1,
                color: theme.text,
                minHeight: 44,
                paddingVertical: 0,
              }}
            />
            {!!search && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch("")}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={theme.muted} />
              </Pressable>
            )}
          </View>
        )}
        <View style={{ flex: 1 }}>{renderScreen()}</View>
      </View>
      <View
        style={{
          height: 67,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: theme.card,
          flexDirection: "row",
          paddingBottom: 4,
          paddingTop: 6,
        }}
      >
        {[
          {
            key: "Notes" as Tab,
            label: "Notes",
            icon: "document-text-outline" as const,
          },
          {
            key: "Notebooks" as Tab,
            label: "Notebooks",
            icon: "book-outline" as const,
          },
          {
            key: "Trash" as Tab,
            label: "Trash",
            icon: "trash-outline" as const,
          },
          {
            key: "Profile" as Tab,
            label: "Profile",
            icon: "person-circle-outline" as const,
          },
          ...(user?.role === "ADMIN"
            ? [
                {
                  key: "Health" as Tab,
                  label: "Health",
                  icon: "pulse-outline" as const,
                },
              ]
            : []),
        ].map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              setTab(item.key);
              if (item.key !== "Notes") setSelectedNotebook(null);
              if (item.key === "Trash" || item.key === "Profile") setSearch("");
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 3,
            }}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={tab === item.key ? theme.brand : theme.muted}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: tab === item.key ? "900" : "600",
                color: tab === item.key ? theme.brand : theme.muted,
                marginTop: 3,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <NoteEditor
        visible={editorVisible}
        theme={theme}
        editing={editing}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        notebooks={notebooks}
        notebookId={noteNotebookId}
        setNotebookId={setNoteNotebookId}
        busy={busy}
        onClose={() => setEditorVisible(false)}
        onSave={() => void saveNote()}
      />
      <NotebookEditor
        visible={notebookEditorVisible}
        theme={theme}
        editing={editingNotebook}
        title={notebookTitle}
        setTitle={setNotebookTitle}
        description={notebookDescription}
        setDescription={setNotebookDescription}
        color={notebookColor}
        setColor={setNotebookColor}
        busy={busy}
        onClose={() => setNotebookEditorVisible(false)}
        onSave={() => void saveNotebook()}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
