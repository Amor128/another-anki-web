import { useState } from "react";
import { Flex, Box, Text, Spinner, Button, Badge } from "@radix-ui/themes";
import { useNoteInfo } from "../../lib/useAnkiConnect";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

interface NoteDetailProps {
  noteId: number;
}

export default function BrowserNoteDetail({ noteId }: NoteDetailProps) {
  const { data: note, isLoading, error } = useNoteInfo(noteId);
  const [expandedSections, setExpandedSections] = useState({
    fields: true,
    tags: true,
    info: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        height="100%"
        direction="column"
        gap="3"
      >
        <Spinner />
        <Text>Loading note...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        align="center"
        justify="center"
        height="100%"
        direction="column"
        gap="2"
      >
        <Text weight="bold" color="red">
          Error loading note
        </Text>
        <Text size="2" color="gray">
          {error.message}
        </Text>
      </Flex>
    );
  }

  if (!note) {
    return (
      <Flex align="center" justify="center" height="100%">
        <Text color="gray">Note not found</Text>
      </Flex>
    );
  }

  const Section = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: keyof typeof expandedSections;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[section];

    return (
      <Box style={{ borderBottom: "1px solid var(--gray-6)" }}>
        <button
          onClick={() => toggleSection(section)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--gray-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Text weight="bold" color="gray">
            {title}
          </Text>
          {isExpanded ? (
            <ChevronUpIcon
              className="w-4 h-4"
              style={{ color: "var(--gray-9)" }}
            />
          ) : (
            <ChevronDownIcon
              className="w-4 h-4"
              style={{ color: "var(--gray-9)" }}
            />
          )}
        </button>
        {isExpanded && (
          <Box
            px="4"
            py="3"
            style={{ background: "var(--gray-2)", fontSize: "14px" }}
          >
            {children}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Flex direction="column" height="100%" style={{ overflow: "hidden" }}>
      <Box style={{ overflowY: "auto" }}>
        {/* Info Section */}
        <Section title="Info" section="info">
          <Flex direction="column" gap="3">
            <Box>
              <Text size="1" weight="bold" color="gray" mb="1" as="p">
                Model
              </Text>
              <Text size="2" style={{ fontFamily: "monospace" }}>
                {note.modelName}
              </Text>
            </Box>
            <Box>
              <Text size="1" weight="bold" color="gray" mb="1" as="p">
                Note ID
              </Text>
              <Text size="2" style={{ fontFamily: "monospace" }}>
                {note.noteId}
              </Text>
            </Box>
          </Flex>
        </Section>

        {/* Fields */}
        <Section title="Fields" section="fields">
          <Flex direction="column" gap="3">
            {Object.entries(note.fields).map(([name, value]) => (
              <Box key={name}>
                <Text size="1" weight="bold" color="gray" mb="1" as="p">
                  {name}
                </Text>
                <Box
                  className="max-h-100"
                  style={{
                    background: "var(--color-surface)",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid var(--gray-6)",
                    fontSize: "12px",
                    color: "var(--gray-11)",
                    wordBreak: "break-word",
                    overflowY: "auto",
                    maxHeight: "200px",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      value.value ||
                      '<span style="color: var(--gray-8)">(empty)</span>',
                  }}
                />
              </Box>
            ))}
          </Flex>
        </Section>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <Section title="Tags" section="tags">
            <Flex gap="2" wrap="wrap">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="soft">
                  {tag}
                </Badge>
              ))}
            </Flex>
          </Section>
        )}
      </Box>

      {/* Actions Footer */}
      <Flex
        direction="column"
        gap="2"
        p="3"
        style={{
          borderTop: "1px solid var(--gray-6)",
          background: "var(--color-surface)",
        }}
      >
        <Button style={{ width: "100%" }} size="2">
          Edit
        </Button>
        <Button
          variant="outline"
          color="red"
          style={{ width: "100%" }}
          size="2"
        >
          Delete
        </Button>
      </Flex>
    </Flex>
  );
}
