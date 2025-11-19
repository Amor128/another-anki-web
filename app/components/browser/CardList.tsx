import { useState, useEffect, useCallback } from "react";
import { Flex, Box, Text, Spinner, Table } from "@radix-ui/themes";
import { getAnkiConnectClient, AnkiConnectError } from "../../lib/ankiconnect";

interface CardListProps {
  query: string;
  selectedCardId: number | null;
  onSelectCard: (cardId: number) => void;
  onSearchComplete: () => void;
}

interface CardRow {
  id: number;
  sortField: string;
  modelName: string;
  due: number;
  interval: number;
  ease: number;
  reps: number;
}

const CARD_LIST_FIELDS = [
  { name: "SortField", key: "sortField", width: "200px" },
  // { name: "Due", key: "due", width: "80px", align: "right" },
  { name: "Interval", key: "interval", width: "96px", align: "left" },
  { name: "Reps", key: "reps", width: "96px", align: "left" },
];

export default function BrowserCardList({
  query,
  selectedCardId,
  onSelectCard,
  onSearchComplete,
}: CardListProps) {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = getAnkiConnectClient();

  // Search for cards
  useEffect(() => {
    const searchCards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cardIds = await client.findCards(query || "");
        console.log(`Found ${cardIds.length} cards`);

        if (cardIds.length === 0) {
          setCards([]);
          onSearchComplete();
          setIsLoading(false);
          return;
        }

        // Get card info for all cards (limit to 1000 at a time for performance)
        const batchSize = 500;
        const allCardsInfo: CardRow[] = [];

        for (let i = 0; i < cardIds.length; i += batchSize) {
          const batch = cardIds.slice(
            i,
            Math.min(i + batchSize, cardIds.length)
          );
          const cardsInfo = await client.cardsInfo(batch);

          cardsInfo.forEach((card, index) => {
            // Get sort field (field with order 0)
            const sortFieldEntry = Object.entries(card.fields).find(
              ([_, field]) => field.order === 0
            );
            const sortFieldValue = sortFieldEntry
              ? sortFieldEntry[1].value
                  .replace(/<[^>]*>/g, "")
                  .substring(0, 100)
              : card.question.replace(/<[^>]*>/g, "").substring(0, 100);
            allCardsInfo.push({
              id: batch[index],
              sortField: sortFieldValue,
              modelName: card.modelName,
              due: card.leftToday,
              interval: card.interval,
              ease: card.ease,
              reps: card.reps,
            });
          });
        }

        setCards(allCardsInfo);
        onSearchComplete();
      } catch (err) {
        const message =
          err instanceof AnkiConnectError
            ? err.message
            : "Failed to search cards";
        setError(message);
        onSearchComplete();
      } finally {
        setIsLoading(false);
      }
    };

    searchCards();
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
          Error searching cards
        </Text>
        <Text>{error}</Text>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        direction="column"
        gap="3"
        style={{ flex: 1 }}
      >
        <Spinner />
        <Text>Loading cards...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column">
      {/* Table Container */}
      <Box style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        {cards.length === 0 ? (
          <Flex align="center" justify="center" direction="column">
            <Text weight="bold" mb="1">
              No cards found
            </Text>
            <Text size="2">Try adjusting your search query</Text>
          </Flex>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                {CARD_LIST_FIELDS.map((field) => (
                  <Table.ColumnHeaderCell
                    key={field.key}
                    style={{
                      width: field.width === "auto" ? undefined : field.width,
                      minWidth: field.width === "auto" ? "200px" : undefined,
                      textAlign: field.align as any,
                    }}
                  >
                    {field.name}
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {cards.map((card) => {
                const isSelectedCard = selectedCardId === card.id;

                return (
                  <Table.Row
                    key={card.id}
                    onClick={() => onSelectCard(card.id)}
                    style={{
                      cursor: "pointer",
                      background: isSelectedCard
                        ? "var(--accent-3)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelectedCard) {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--gray-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        isSelectedCard ? "var(--accent-3)" : "transparent";
                    }}
                  >
                    {CARD_LIST_FIELDS.map((field) => {
                      const value = card[field.key as keyof CardRow];
                      let displayValue: React.ReactNode = value;

                      if (field.key === "sortField") {
                        displayValue = <Text truncate>{value as string}</Text>;
                      } else if (field.key === "due") {
                        displayValue = (value as number) > 0 ? value : "-";
                      } else if (field.key === "interval") {
                        displayValue = `${value}d`;
                      }

                      return (
                        <Table.Cell
                          key={field.key}
                          style={{
                            textAlign: field.align as any,
                            overflow:
                              field.key === "sortField" ? "hidden" : undefined,
                          }}
                        >
                          {displayValue}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Footer with count */}
      <Box
        px="4"
        py="3"
        style={{
          borderTop: "1px solid var(--gray-6)",
          background: "var(--gray-2)",
        }}
      >
        <Text size="2">{cards.length} cards</Text>
      </Box>
    </Flex>
  );
}
