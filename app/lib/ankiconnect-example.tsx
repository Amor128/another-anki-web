/**
 * Example usage of AnkiConnect utilities
 * This file demonstrates how to use the ankiconnect module in your components
 */

import React from "react";
import {
  useAnkiConnect,
  useDeckNames,
  useDeckStats,
  useCardSearch,
  useCardInfo,
  useNoteInfo,
} from "./useAnkiConnect";

// ============================================================================
// Example 1: Basic Connection Check
// ============================================================================

export function AnkiConnectStatusExample() {
  const { isConnected, isLoading, error, checkConnection } = useAnkiConnect({
    autoCheck: true,
  });

  if (isLoading) {
    return <div>Checking AnkiConnect connection...</div>;
  }

  if (!isConnected) {
    return (
      <div>
        <p>AnkiConnect is not connected</p>
        {error && <p className="text-red-600">{error.message}</p>}
        <button onClick={checkConnection}>Retry</button>
      </div>
    );
  }

  return <div className="text-green-600">AnkiConnect is connected!</div>;
}

// ============================================================================
// Example 2: Display Deck Names
// ============================================================================

export function DeckListExample() {
  const { data: decks, isLoading, error, refresh } = useDeckNames();

  if (isLoading) {
    return <div>Loading decks...</div>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-600">Error: {error.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Decks</h2>
      <ul>
        {decks?.map((deck) => (
          <li key={deck}>{deck}</li>
        ))}
      </ul>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

// ============================================================================
// Example 3: Display Deck Statistics
// ============================================================================

export function DeckStatsExample() {
  const { data: stats, isLoading, error, refresh } = useDeckStats();

  if (isLoading) {
    return <div>Loading deck statistics...</div>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-600">Error: {error.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Deck Statistics</h2>
      {stats &&
        Object.entries(stats).map(([deckName, stat]) => (
          <div key={deckName}>
            <p>
              <strong>{deckName}</strong>
            </p>
            <ul>
              <li>New: {stat.new}</li>
              <li>Learning: {stat.lrn}</li>
              <li>Review: {stat.rev}</li>
            </ul>
          </div>
        ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

// ============================================================================
// Example 4: Search Cards
// ============================================================================

export function CardSearchExample() {
  const [query, setQuery] = React.useState("");
  const { data: cardIds, isLoading, error, refresh } = useCardSearch(query);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("query") as string;
    setQuery(q);
  };

  return (
    <div>
      <h2>Search Cards</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          name="query"
          placeholder='e.g., "deck:Default"'
          className="border p-2"
        />
        <button type="submit">Search</button>
      </form>

      {isLoading && <p>Searching...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {cardIds && (
        <div>
          <p>Found {cardIds.length} cards</p>
          <ul>
            {cardIds.slice(0, 10).map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          {cardIds.length > 10 && (
            <p>... and {cardIds.length - 10} more</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Display Card Info
// ============================================================================

export function CardInfoExample({ cardId }: { cardId: number }) {
  const { data: card, isLoading, error } = useCardInfo(cardId);

  if (isLoading) {
    return <div>Loading card info...</div>;
  }

  if (error) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  if (!card) {
    return <p>No card found</p>;
  }

  return (
    <div className="border p-4">
      <h3>{card.modelName}</h3>
      <p>Template: {card.templateName}</p>
      <p>Interval: {card.interval} days</p>
      <p>Ease: {card.ease}%</p>
      <p>Reviews: {card.reviews}</p>
      <div className="mt-4">
        <p className="font-semibold">Question:</p>
        <div dangerouslySetInnerHTML={{ __html: card.question }} />
      </div>
      <div className="mt-4">
        <p className="font-semibold">Answer:</p>
        <div dangerouslySetInnerHTML={{ __html: card.answer }} />
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Display Note Info
// ============================================================================

export function NoteInfoExample({ noteId }: { noteId: number }) {
  const { data: note, isLoading, error } = useNoteInfo(noteId);

  if (isLoading) {
    return <div>Loading note info...</div>;
  }

  if (error) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  if (!note) {
    return <p>No note found</p>;
  }

  return (
    <div className="border p-4">
      <h3>{note.modelName}</h3>
      <p>Tags: {note.tags.join(", ")}</p>
      <div className="mt-4">
        {Object.entries(note.fields).map(([name, field]) => (
          <div key={name}>
            <p className="font-semibold">{name}:</p>
            <p>{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Using the Client Directly
// ============================================================================

export function DirectClientExample() {
  const { client, isConnected } = useAnkiConnect();
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const handleAddNote = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const noteId = await client.addNote(
        "Default",
        "Basic",
        {
          Front: "What is the capital of France?",
          Back: "Paris",
        },
        {
          tags: ["geography"],
        }
      );
      setResult({ noteId, success: true });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Add Note Example</h2>
      <button onClick={handleAddNote} disabled={!isConnected || loading}>
        {loading ? "Adding..." : "Add Note"}
      </button>
      {result && (
        <div className="mt-4">
          {result.success ? (
            <p className="text-green-600">
              Note added! ID: {result.noteId}
            </p>
          ) : (
            <p className="text-red-600">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
