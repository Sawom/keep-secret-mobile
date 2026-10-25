import { SectionList, Text, View } from "react-native";
import { EmptyState } from "../components/Controls";
import { NoteCard, NotebookCard } from "../components/Cards";
import type { Note, Notebook } from "../types";
import type { Theme } from "../theme/theme";

type SearchRow =
  | { kind: "note"; item: Note }
  | { kind: "book"; item: Notebook };

type SearchSection = {
  title: string;
  data: SearchRow[];
};

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

  const sections: SearchSection[] = [];
  if (foundNotes.length) {
    sections.push({
      title: `Notes (${foundNotes.length})`,
      data: foundNotes.map((item): SearchRow => ({ kind: "note", item })),
    });
  }
  if (foundBooks.length) {
    sections.push({
      title: `Notebooks (${foundBooks.length})`,
      data: foundBooks.map((item): SearchRow => ({ kind: "book", item })),
    });
  }

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
        <SectionList<SearchRow, SearchSection>
          sections={sections}
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
                note={item.item}
                theme={theme}
                onOpen={() => onOpenNote(item.item)}
                onTrash={() => onTrashNote(item.item)}
                onPin={() => onPinNote(item.item)}
              />
            ) : (
              <NotebookCard
                notebook={item.item}
                theme={theme}
                onOpen={() => onOpenNotebook(item.item)}
                onEdit={() => onEditNotebook(item.item)}
                onTrash={() => onTrashNotebook(item.item)}
              />
            )
          }
        />
      )}
    </View>
  );
}
