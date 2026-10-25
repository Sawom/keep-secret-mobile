import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Button, EmptyState, ScreenHeader } from "../components/Controls";
import { NoteCard } from "../components/Cards";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";
export function NotesScreen({
  theme,
  notes,
  notebooks,
  online,
  syncing,
  onCreate,
  onOpen,
  onTrash,
  onPin,
  selectedNotebook,
  onClearNotebook,
  onBulkDelete,
}: {
  theme: Theme;
  notes: Note[];
  notebooks: Notebook[];
  online: boolean;
  syncing: boolean;
  onCreate: () => void;
  onOpen: (n: Note) => void;
  onTrash: (n: Note) => void;
  onPin: (n: Note) => void;
  selectedNotebook: string | null;
  onClearNotebook: () => void;
  onBulkDelete: (ids: string[]) => void;
}) {
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  React.useEffect(() => {
    setSelected([]);
    setSelectMode(false);
  }, [selectedNotebook]);
  const filtered = notes;
  const toggle = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        theme={theme}
        eyebrow={selectedNotebook ? "Notebook" : "Private workspace"}
        title={
          selectedNotebook
            ? notebooks.find((b) => b.id === selectedNotebook)?.title ||
              "Notebook"
            : "Your notes"
        }
        subtitle={`${filtered.length} notes · ${online ? "Online" : "Offline"}${syncing ? " · Syncing…" : ""}`}
        right={
          <Pressable
            onPress={onCreate}
            style={{
              backgroundColor: theme.brand,
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>+ New</Text>
          </Pressable>
        }
      />
      {selectedNotebook && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Pressable onPress={onClearNotebook}>
            <Text style={{ color: theme.brand, fontWeight: "800" }}>
              ← All notes
            </Text>
          </Pressable>
        </View>
      )}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          alignItems: "flex-end",
        }}
      >
        <Button
          title={selectMode ? "Cancel selection" : "Select notes"}
          theme={theme}
          secondary
          onPress={() => {
            setSelectMode(!selectMode);
            setSelected([]);
          }}
        />
      </View>
      {selectMode && (
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: theme.muted, flex: 1, fontSize: 12 }}>
            {selected.length} selected
          </Text>
          <Pressable
            onPress={() =>
              setSelected(
                selected.length === filtered.length
                  ? []
                  : filtered.map((n) => n.id),
              )
            }
          >
            <Text
              style={{
                color: theme.brand,
                fontWeight: "800",
                marginHorizontal: 15,
              }}
            >
              Select all
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onBulkDelete(selected)}
            disabled={!selected.length}
            style={{
              backgroundColor: selected.length ? theme.danger : theme.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 9,
              marginVertical: 9,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              Move to trash
            </Text>
          </Pressable>
        </View>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          theme={theme}
          title="No notes yet"
          body="Create your first note to get started."
          action="Create note"
          onAction={onCreate}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 13,
            paddingBottom: 24,
          }}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              theme={theme}
              selected={selected.includes(item.id)}
              onSelect={selectMode ? () => toggle(item.id) : undefined}
              onOpen={() => onOpen(item)}
              onTrash={() => onTrash(item)}
              onPin={() => onPin(item)}
            />
          )}
        />
      )}
    </View>
  );
}
