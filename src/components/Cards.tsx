import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";

function IconAction({
  label,
  color,
  name,
  onPress,
}: {
  label: string;
  color: string;
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      hitSlop={8}
      style={{
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
      }}
    >
      <Ionicons name={name} size={21} color={color} />
    </Pressable>
  );
}

export function NoteCard({
  note,
  theme,
  onOpen,
  onTrash,
  onPin,
  selected,
  onSelect,
  showActions = true,
}: {
  note: Note;
  theme: Theme;
  onOpen: () => void;
  onTrash: () => void;
  onPin: () => void;
  selected?: boolean;
  onSelect?: () => void;
  showActions?: boolean;
}) {
  return (
    <Pressable
      onPress={onSelect ?? onOpen}
      style={{
        backgroundColor: theme.card,
        borderColor: selected ? theme.brand : theme.border,
        borderWidth: selected ? 2 : 1,
        borderRadius: 17,
        padding: 15,
        marginBottom: 11,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{ fontSize: 15, fontWeight: "800", color: theme.text }}
          >
            {note.title || "Untitled note"}
          </Text>
          <Text
            numberOfLines={4}
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: theme.muted,
              marginTop: 7,
            }}
          >
            {note.content || "No content yet"}
          </Text>
        </View>
        {onSelect && (
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={21}
            color={selected ? theme.brand : theme.muted}
          />
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 11,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 10, color: theme.muted, flex: 1 }}>
          {note.offlineOnly
            ? "Saved offline · waiting to sync"
            : note.updatedAt
              ? new Date(note.updatedAt).toLocaleDateString()
              : ""}
        </Text>
        {showActions && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <IconAction
              label={note.isPinned ? "Unpin note" : "Pin note"}
              color={note.isPinned ? theme.brand : theme.muted}
              name={note.isPinned ? "pin" : "pin-outline"}
              onPress={onPin}
            />
            <IconAction
              label="Move note to trash"
              color={theme.danger}
              name="trash-outline"
              onPress={onTrash}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function NotebookCard({
  notebook,
  theme,
  onOpen,
  onEdit,
  onTrash,
}: {
  notebook: Notebook;
  theme: Theme;
  onOpen: () => void;
  onEdit: () => void;
  onTrash: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 17,
        padding: 13,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 45,
          height: 45,
          borderRadius: 14,
          backgroundColor: notebook.color || theme.brand,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="book-outline" size={23} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: theme.text }}>
          {notebook.title}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}
        >
          {notebook.description || "Notebook"}
          {notebook.offlineOnly ? " · Offline" : ""}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <IconAction
          label="Edit notebook"
          color={theme.brand}
          name="create-outline"
          onPress={onEdit}
        />
        <IconAction
          label="Move notebook to trash"
          color={theme.danger}
          name="trash-outline"
          onPress={onTrash}
        />
      </View>
    </Pressable>
  );
}
