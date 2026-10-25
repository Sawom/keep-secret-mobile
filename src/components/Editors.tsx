import React from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button, Field } from "./Controls";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";
export function NoteEditor({
  visible,
  theme,
  editing,
  title,
  setTitle,
  content,
  setContent,
  notebooks,
  notebookId,
  setNotebookId,
  busy,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: Theme;
  editing: Note | null;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  notebooks: Notebook[];
  notebookId: string | null;
  setNotebookId: (v: string | null) => void;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{
            height: 58,
            paddingHorizontal: 17,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.muted }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "900", color: theme.text }}>
            {editing ? "Edit note" : "New note"}
          </Text>
          <Pressable onPress={onSave} disabled={busy}>
            <Text style={{ fontWeight: "900", color: theme.brand }}>
              {busy ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 17, paddingBottom: 35 }}
        >
          <Field
            label="Title"
            value={title}
            onChangeText={setTitle}
            theme={theme}
            placeholder="Note title"
            autoCapitalize="sentences"
          />
          <Field
            label="Content"
            value={content}
            onChangeText={setContent}
            theme={theme}
            placeholder="Start writing…"
            multiline
            autoCapitalize="sentences"
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: theme.muted,
              marginTop: 18,
            }}
          >
            Notebook / chapter
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 9,
            }}
          >
            <Pressable
              onPress={() => setNotebookId(null)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: notebookId === null ? theme.brand : theme.border,
                backgroundColor: notebookId === null ? theme.brand : theme.card,
              }}
            >
              <Text
                style={{ color: notebookId === null ? "#fff" : theme.text }}
              >
                Standalone
              </Text>
            </Pressable>
            {notebooks.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setNotebookId(b.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: notebookId === b.id ? theme.brand : theme.border,
                  backgroundColor:
                    notebookId === b.id ? theme.brand : theme.card,
                }}
              >
                <Text
                  style={{ color: notebookId === b.id ? "#fff" : theme.text }}
                >
                  {b.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              fontSize: 11,
              lineHeight: 17,
              color: theme.muted,
              marginTop: 18,
            }}
          >
            Your note is saved to your KeepSecret account. The backend requires
            a title and content.
          </Text>
          <Button
            title={busy ? "Saving…" : "Save note"}
            onPress={onSave}
            theme={theme}
            loading={busy}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
export function NotebookEditor({
  visible,
  theme,
  editing,
  title,
  setTitle,
  description,
  setDescription,
  color,
  setColor,
  busy,
  onClose,
  onSave,
}: {
  visible: boolean;
  theme: Theme;
  editing: Notebook | null;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{
            height: 58,
            paddingHorizontal: 17,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.muted }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "900", color: theme.text }}>
            {editing ? "Edit notebook" : "New notebook"}
          </Text>
          <Pressable onPress={onSave} disabled={busy}>
            <Text style={{ fontWeight: "900", color: theme.brand }}>
              {busy ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 17 }}>
          <Field
            label="Title"
            value={title}
            onChangeText={setTitle}
            theme={theme}
            placeholder="e.g. Personal diary"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            theme={theme}
            placeholder="Optional description"
            multiline
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: theme.muted,
              marginTop: 18,
            }}
          >
            Notebook color
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 10,
            }}
          >
            {[
              "#3B82F6",
              "#6D5EF5",
              "#10B981",
              "#F59E0B",
              "#EC4899",
              "#EF4444",
            ].map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 1,
                  borderColor: color === c ? "#fff" : theme.border,
                }}
              />
            ))}
          </View>
          <Button
            title={busy ? "Saving…" : "Save notebook"}
            onPress={onSave}
            theme={theme}
            loading={busy}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
