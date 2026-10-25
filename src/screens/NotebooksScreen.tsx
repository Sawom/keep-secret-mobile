import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { EmptyState, ScreenHeader } from "../components/Controls";
import { NotebookCard } from "../components/Cards";
import type { Notebook } from "../types";
import type { Theme } from "../theme/theme";
export function NotebooksScreen({
  theme,
  notebooks,
  onCreate,
  onEdit,
  onOpen,
  onTrash,
  onMoveUp,
  onMoveDown,
}: {
  theme: Theme;
  notebooks: Notebook[];
  onCreate: () => void;
  onEdit: (n: Notebook) => void;
  onOpen: (n: Notebook) => void;
  onTrash: (n: Notebook) => void;
  onMoveUp: (n: Notebook) => void;
  onMoveDown: (n: Notebook) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        theme={theme}
        eyebrow="Organize"
        title="Your notebooks"
        subtitle={`${notebooks.length} notebooks`}
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
      {notebooks.length === 0 ? (
        <EmptyState
          theme={theme}
          title="No notebooks yet"
          body="Create notebooks to group related notes into chapters or projects."
          action="Create notebook"
          onAction={onCreate}
        />
      ) : (
        <FlatList
          data={notebooks}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <NotebookCard
              notebook={item}
              theme={theme}
              onOpen={() => onOpen(item)}
              onEdit={() => onEdit(item)}
              onTrash={() => onTrash(item)}
              onMoveUp={() => onMoveUp(item)}
              onMoveDown={() => onMoveDown(item)}
            />
          )}
        />
      )}
    </View>
  );
}
