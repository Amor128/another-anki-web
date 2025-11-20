import { useState, useEffect } from "react";
import { Flex, Box, Text, Table } from "@radix-ui/themes";
import { getAnkiConnectClient, AnkiConnectError } from "../../lib/ankiconnect";

interface NoteListProps {
  query: string;
  selectedNoteId: number | null;
  selectedNotes: { [noteId: number]: boolean };
  onSelectNote: (noteId: number) => void;
  onToggleSelection: (noteId: number) => void;
  onSelectAll: (noteIds: number[]) => void;
  onSearchComplete: () => void;
}

interface NoteRow {
  id: number;
  sortField: string;
  modelName: string;
  tags: string;
  tagCount: number;
}

export default function BrowserNoteList({
  query,
  selectedNoteId,
  selectedNotes,
  onSelectNote,
  onSearchComplete,
}: NoteListProps) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = getAnkiConnectClient();

  // Search for notes
  useEffect(() => {
    const searchNotes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const modelNameAndIds: Record<string, number> =
          await client.modelNamesAndIds();
        const modelIds = Object.values(modelNameAndIds);
        const models = await client.findModelsById(modelIds);
        const noteIds = await client.findNotes(query || "");
        console.log(`Found ${noteIds.length} notes`);
        if (noteIds.length === 0) {
          setNotes([]);
          onSearchComplete();
          setIsLoading(false);
          return;
        }
        const notesInfo = await client.notesInfo(noteIds);
        const allNotesInfo: NoteRow[] = notesInfo.map((note, index) => {
          const model = models.find((m) => m.name === note.modelName);
          const sortf: number = model?.sortf;
          const fields = Object.entries(note.fields);
          let sortFieldValue = "";
          for (const [fieldName, fieldData] of fields) {
            if (fieldData.order === sortf) {
              sortFieldValue = fieldData.value
                .replace(/<[^>]*>/g, "")
                .substring(0, 100);
              break;
            }
          }
          const tagsString = note.tags.join(", ");
          return {
            id: noteIds[index],
            sortField: sortFieldValue,
            modelName: note.modelName,
            tags: tagsString,
            tagCount: note.tags.length,
          };
        });

        setNotes(allNotesInfo);
        onSearchComplete();
      } catch (err) {
        const message =
          err instanceof AnkiConnectError
            ? err.message
            : "Failed to search notes";
        setError(message);
        onSearchComplete();
      } finally {
        setIsLoading(false);
      }
    };

    searchNotes();
  }, [query, client, onSearchComplete]);

  if (error) {
    return (
      <Flex
        align="center"
        justify="center"
        direction="column"
        style={{ flex: 1 }}
      >
        <Text weight="bold" color="red" mb="2">
          Error searching notes
        </Text>
        <Text>{error}</Text>
      </Flex>
    );
  }

  return (
    <Table.Root variant="surface" className="overflow-y-auto h-full">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>SortField</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Tags</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {notes.map((note) => {
          return (
            <Table.Row key={note.id} onClick={() => onSelectNote(note.id)}>
              <Table.Cell>
                <Text truncate>{note.sortField}</Text>
              </Table.Cell>
              <Table.Cell>{note.modelName}</Table.Cell>
              <Table.Cell>
                {note.tagCount > 0 ? `${note.tagCount}` : "-"}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
