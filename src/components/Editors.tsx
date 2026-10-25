import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Field } from "./Controls";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";

function EditorHeader({
  title,
  theme,
  busy,
  onClose,
  onSave,
}: {
  title: string;
  theme: Theme;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <View
      style={{
        minHeight: 58,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.bg,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={onClose}
        hitSlop={8}
        style={{
          minWidth: 76,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Text style={{ color: theme.muted, fontSize: 15, fontWeight: "700" }}>
          Cancel
        </Text>
      </Pressable>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 16,
          fontWeight: "900",
          color: theme.text,
        }}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save"
        onPress={onSave}
        disabled={busy}
        hitSlop={8}
        style={{
          minWidth: 76,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "flex-end",
          opacity: busy ? 0.55 : 1,
        }}
      >
        <Text style={{ color: theme.brand, fontSize: 15, fontWeight: "900" }}>
          {busy ? "Saving…" : "Save"}
        </Text>
      </Pressable>
    </View>
  );
}

export function NoteEditor({
  visible,
  theme,
  editing,
  title,
  setTitle,
  content,
  setContent,
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
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
        <SafeAreaView
          edges={["top", "right", "bottom", "left"]}
          style={{ flex: 1, backgroundColor: theme.bg }}
        >
          <EditorHeader
            title={editing ? "Edit note" : "New note"}
            theme={theme}
            busy={busy}
            onClose={onClose}
            onSave={onSave}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 17, paddingBottom: 40 }}
          >
            <Field
              label="Title"
              value={title}
              onChangeText={setTitle}
              theme={theme}
              placeholder="Note title"
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            <Field
              label="Content"
              value={content}
              onChangeText={setContent}
              theme={theme}
              placeholder="Start writing…"
              multiline
              autoCapitalize="sentences"
              textAlignVertical="top"
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 18,
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={theme.muted}
              />
              <Text style={{ color: theme.muted, fontSize: 12, flex: 1 }}>
                Your note is saved to your KeepSecret account and cached
                securely on this device.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
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
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
        <SafeAreaView
          edges={["top", "right", "bottom", "left"]}
          style={{ flex: 1, backgroundColor: theme.bg }}
        >
          <EditorHeader
            title={editing ? "Edit notebook" : "New notebook"}
            theme={theme}
            busy={busy}
            onClose={onClose}
            onSave={onSave}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 17, paddingBottom: 40 }}
          >
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
                  accessibilityRole="button"
                  accessibilityLabel={`Choose notebook color ${c}`}
                  onPress={() => setColor(c)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 1,
                    borderColor: color === c ? theme.text : theme.border,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
