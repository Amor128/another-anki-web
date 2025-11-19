import type { Route } from "./+types/browser";
import { useCallback, useState } from "react";
import { Box, Flex, Heading, Text, Callout, Switch } from "@radix-ui/themes";
import { useAnkiConnect, useCardInfo } from "../lib/useAnkiConnect";
import BrowserSearchBar from "../components/browser/SearchBar";
import BrowserCardList from "../components/browser/CardList";
import BrowserNoteList from "../components/browser/NoteList";
import BrowserNoteDetail from "../components/browser/NoteDetail";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export const meta: Route.MetaFunction = () => [
  { title: "Browser - Anki Web" },
  { name: "description", content: "Browse and manage Anki cards" },
];

// Helper component to convert card ID to note ID and display NoteDetail
function CardDetailToNoteDetail({ cardId }: { cardId: number }) {
  const { data: card, isLoading, error } = useCardInfo(cardId);

  if (isLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        height="100%"
        direction="column"
        gap="3"
      >
        <Text>Loading card...</Text>
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
          Error loading card
        </Text>
        <Text size="2" color="gray">
          {error.message}
        </Text>
      </Flex>
    );
  }

  if (!card) {
    return (
      <Flex align="center" justify="center" height="100%">
        <Text color="gray">Card not found</Text>
      </Flex>
    );
  }

  // Extract note ID from card and render NoteDetail
  return <BrowserNoteDetail noteId={card.note} />;
}

export default function BrowserPage() {
  const { isConnected, error: connectionError } = useAnkiConnect();

  // Local component state (previously Redux)
  const [searchQuery, setSearchQuery] = useState("");
  const [queryMode, setQueryMode] = useState<"cards" | "notes">("cards");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<Record<number, boolean>>({});
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Record<number, boolean>>({});
  const [cardListWidth, setCardListWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Handler functions using local state
  const handleSelectCard = useCallback((cardId: number) => {
    setSelectedCardId(cardId);
  }, []);

  const handleToggleCardSelection = useCallback((cardId: number) => {
    setSelectedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);

  const handleSelectAll = useCallback((cardIds: number[]) => {
    const newSelected: Record<number, boolean> = {};
    cardIds.forEach((id) => {
      newSelected[id] = true;
    });
    setSelectedCards(newSelected);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchComplete = useCallback(() => {
    // CardList/NoteList will handle its own loading state
  }, []);

  const handleSelectNote = useCallback((noteId: number) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleToggleNoteSelection = useCallback((noteId: number) => {
    setSelectedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  }, []);

  const handleSelectAllNotes = useCallback((noteIds: number[]) => {
    const newSelected: Record<number, boolean> = {};
    noteIds.forEach((id) => {
      newSelected[id] = true;
    });
    setSelectedNotes(newSelected);
  }, []);

  // Handle resizing panels
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

    // Constrain between 30% and 70%
    if (newWidth >= 30 && newWidth <= 70) {
      setCardListWidth(newWidth);
    }
  }, [isDragging]);

  // Now we can do conditional rendering
  if (!isConnected) {
    return (
      <Box p="6">
        <Heading size="8" mb="4">
          Browser
        </Heading>
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text weight="bold">AnkiConnect not connected</Callout.Text>
          <Text size="2" mt="2" as="p">
            {connectionError?.message ||
              "Make sure Anki is running with the AnkiConnect plugin enabled."}
          </Text>
        </Callout.Root>
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      height="100vh"
      style={{
        background: "var(--color-page)",
        userSelect: isDragging ? "none" : "auto",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Main Content Area */}
      <Flex overflow="hidden" position="relative" style={{ flex: 1 }}>
        {/* Left Panel - Card/Note List */}
        <Flex
          className="flex-7"
          direction="column"
          style={{
            width: `${cardListWidth}%`,
            background: "var(--color-surface)",
            overflow: "hidden",
            transition: isDragging ? "none" : "width 0.2s ease",
          }}
        >
          {/* Search Bar */}
          <Box p="4" style={{ borderBottom: "1px solid var(--gray-6)" }}>
            <Flex direction="row" gap="3">
              {/* Query Mode Toggle */}
              <Flex align="center" gap="2">
                <Text size="2" weight="medium">
                  {queryMode === "cards" ? "Cards" : "Notes"}
                </Text>
                <Switch
                  checked={queryMode === "notes"}
                  onCheckedChange={(checked) => {
                    setQueryMode(checked ? "notes" : "cards");
                  }}
                />
              </Flex>
              <BrowserSearchBar onSearch={handleSearch} />
            </Flex>
          </Box>

          {/* Card/Note List */}
          {queryMode === "cards" ? (
            <BrowserCardList
              query={searchQuery}
              selectedCardId={selectedCardId}
              onSelectCard={handleSelectCard}
              onSearchComplete={handleSearchComplete}
            />
          ) : (
            <BrowserNoteList
              query={searchQuery}
              selectedNoteId={selectedNoteId}
              selectedNotes={selectedNotes}
              onSelectNote={handleSelectNote}
              onToggleSelection={handleToggleNoteSelection}
              onSelectAll={handleSelectAllNotes}
              onSearchComplete={handleSearchComplete}
            />
          )}
        </Flex>

        {/* Right Panel - Note Detail */}
        <Flex
          className="flex-3"
          direction="column"
          style={{
            width: `${100 - cardListWidth}%`,
            background: "var(--color-surface)",
            borderLeft: "1px solid var(--gray-6)",
            overflow: "hidden",
            transition: isDragging ? "none" : "width 0.2s ease",
          }}
        >
          {queryMode === "cards" ? (
            selectedCardId ? (
              <CardDetailToNoteDetail cardId={selectedCardId} />
            ) : (
              <Flex
                align="center"
                justify="center"
                height="100%"
                style={{ color: "var(--gray-11)" }}
              >
                <Text>Select a card to view details</Text>
              </Flex>
            )
          ) : selectedNoteId ? (
            <BrowserNoteDetail noteId={selectedNoteId} />
          ) : (
            <Flex
              align="center"
              justify="center"
              height="100%"
              style={{ color: "var(--gray-11)" }}
            >
              <Text>Select a note to view details</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
