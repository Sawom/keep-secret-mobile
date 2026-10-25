import { SectionList, Text, View } from "react-native";
import { EmptyState } from "../components/Controls";
import { NoteCard, NotebookCard } from "../components/Cards";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";
export function SearchScreen({
  theme,
  notes,
  notebooks,
  query,
  onOpenNote,
  onTrashNote,
  onPinNote,
  onOpenNotebook,
  onEditNotebook,
  onTrashNotebook,
}: {
  theme: Theme;
  notes: Note[];
  notebooks: Notebook[];
  query: string;
  onOpenNote: (n: Note) => void;
  onTrashNote: (n: Note) => void;
  onPinNote: (n: Note) => void;
  onOpenNotebook: (n: Notebook) => void;
  onEditNotebook: (n: Notebook) => void;
  onTrashNotebook: (n: Notebook) => void;
}) {
  const q = query.toLowerCase().trim();
  const foundNotes = notes.filter((n) =>
    `${n.title} ${n.content}`.toLowerCase().includes(q),
  );
  const foundBooks = notebooks.filter((b) =>
    `${b.title} ${b.description || ""}`.toLowerCase().includes(q),
  );
  return (
    <View style={{ flex: 1 }}>
      {!q ? (
        <EmptyState
          theme={theme}
          title="Search your workspace"
          body="Search matches note titles, note content, notebook titles and descriptions."
        />
      ) : foundNotes.length + foundBooks.length === 0 ? (
        <EmptyState
          theme={theme}
          title="Nothing found"
          body="Try a different keyword."
        />
      ) : (
        <SectionList
          sections={[
            ...(foundNotes.length
              ? [
                  {
                    title: `Notes (${foundNotes.length})`,
                    data: foundNotes.map((item) => ({
                      kind: "note" as const,
                      item,
                    })),
                  },
                ]
              : []),
            ...(foundBooks.length
              ? [
                  {
                    title: `Notebooks (${foundBooks.length})`,
                    data: foundBooks.map((item) => ({
                      kind: "book" as const,
                      item,
                    })),
                  },
                ]
              : []),
          ]}
          keyExtractor={(row) => `${row.kind}-${row.item.id}`}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 20,
          }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              style={{
                color: theme.text,
                fontSize: 16,
                fontWeight: "900",
                marginTop: 10,
                marginBottom: 8,
              }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) =>
            item.kind === "note" ? (
              <NoteCard
                note={item.item as Note}
                theme={theme}
                onOpen={() => onOpenNote(item.item as Note)}
                onTrash={() => onTrashNote(item.item as Note)}
                onPin={() => onPinNote(item.item as Note)}
              />
            ) : (
              <NotebookCard
                notebook={item.item as Notebook}
                theme={theme}
                onOpen={() => onOpenNotebook(item.item as Notebook)}
                onEdit={() => onEditNotebook(item.item as Notebook)}
                onTrash={() => onTrashNotebook(item.item as Notebook)}
              />
            )
          }
        />
      )}
    </View>
  );
}
