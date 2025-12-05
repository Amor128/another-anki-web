/**
 * AnkiConnect API Client
 * Provides typed utilities for communicating with AnkiConnect plugin
 *
 * API Documentation: https://git.sr.ht/~foosoft/anki-connect
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: Record<string, any>;
  key?: string;
}

export interface AnkiConnectResponse<T = any> {
  result: T;
  error: string | null;
}

export interface Field {
  order: number;
  value: string;
}

export interface Note {
  noteId: number;
  profile: string;
  modelName: string;
  tags: string[];
  fields: Record<string, Field>;
  mod : number;
  cards: number[];
}

export interface DeckStats {
  [deckName: string]: {
    new: number;
    lrn: number;
    rev: number;
  };
}

export interface CardInfo {
  cardId: number;
  note: number;
  fields: Record<string, { value: string; order: number }>;
  frontSide: string;
  backSide: string;
  modelName: string;
  modelId: number;
  noteTags?: string[];
  question: string;
  answer: string;
  templateName: string;
  css: string;
  cardRank: number;
  interval: number;
  ease: number;
  reviews: number;
  lapses: number;
  leftToday: number;
  suspended: boolean;
  started: boolean;
  reps: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_ANKICONNECT_URL = "http://localhost:8765";
const PROXY_ANKICONNECT_URL = "/api/anki";
const API_VERSION = 6;

/**
 * Determine the AnkiConnect URL based on environment
 * In browser: use /api/anki proxy to avoid CORS
 * In server: use direct connection
 */
function getDefaultAnkiConnectUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    console.log("Using proxy AnkiConnect URL:", PROXY_ANKICONNECT_URL);
    return PROXY_ANKICONNECT_URL;
  }
  // Server-side or other environment
  return DEFAULT_ANKICONNECT_URL;
}

export interface AnkiConnectConfig {
  url?: string;
  version?: number;
  apiKey?: string;
  timeout?: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class AnkiConnectError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = "AnkiConnectError";
  }
}

export class AnkiConnectConnectionError extends AnkiConnectError {
  constructor(message: string, originalError?: any) {
    super("CONNECTION_ERROR", message, originalError);
    this.name = "AnkiConnectConnectionError";
  }
}

export class AnkiConnectAPIError extends AnkiConnectError {
  constructor(message: string) {
    super("API_ERROR", message);
    this.name = "AnkiConnectAPIError";
  }
}

// ============================================================================
// AnkiConnect Client
// ============================================================================

export class AnkiConnectClient {
  private url: string;
  private apiVersion: number;
  private apiKey?: string;
  private timeout: number;

  constructor(config: AnkiConnectConfig = {}) {
    this.url = config.url || getDefaultAnkiConnectUrl();
    this.apiVersion = config.version || API_VERSION;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make a request to AnkiConnect
   */
  private async request<T = any>(
    action: string,
    params?: Record<string, any>
  ): Promise<T> {
    const payload: AnkiConnectRequest = {
      action,
      version: this.apiVersion,
      params: params || {},
    };

    if (this.apiKey) {
      payload.key = this.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AnkiConnectConnectionError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: AnkiConnectResponse<T> = await response.json();

      if (data.error) {
        throw new AnkiConnectAPIError(data.error);
      }

      return data.result;
    } catch (error) {
      if (error instanceof AnkiConnectError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new AnkiConnectConnectionError(
          "Failed to connect to AnkiConnect. Make sure AnkiConnect is running.",
          error
        );
      }

      throw new AnkiConnectConnectionError(
        "Unknown error occurred while communicating with AnkiConnect",
        error
      );
    }
  }

  // ========================================================================
  // Deck Operations
  // ========================================================================

  /**
   * Get names of all decks
   */
  async deckNames(): Promise<string[]> {
    return this.request("deckNames");
  }

  /**
   * Get the id for a deck by name
   */
  async deckNameToId(name: string): Promise<number> {
    const result = await this.request<Record<string, number>>(
      "deckNamesAndIds"
    );
    return result[name] || 0;
  }

  /**
   * Get all deck names and their ids
   */
  async deckNamesAndIds(): Promise<Record<string, number>> {
    return this.request("deckNamesAndIds");
  }

  /**
   * Get deck statistics
   */
  async deckStats(): Promise<DeckStats> {
    return this.request("deckStats");
  }

  /**
   * Get number of cards due in deck
   */
  async deckDueStats(name: string): Promise<{ new: number; lrn: number; rev: number }> {
    const stats = await this.deckStats();
    return stats[name] || { new: 0, lrn: 0, rev: 0 };
  }

  // ========================================================================
  // Card Operations
  // ========================================================================

  /**
   * Get card IDs for a given query
   */
  async findCards(query: string): Promise<number[]> {
    return this.request("findCards", { query });
  }

  /**
   * Get information for specific cards
   */
  async cardsInfo(cardIds: number[]): Promise<CardInfo[]> {
    return this.request("cardsInfo", { cards: cardIds });
  }

  /**
   * Get information for a single card
   */
  async cardInfo(cardId: number): Promise<CardInfo> {
    const infos = await this.cardsInfo([cardId]);
    return infos[0];
  }

  /**
   * Suspend cards
   */
  async suspendCards(cardIds: number[]): Promise<null> {
    return this.request("suspendCards", { cards: cardIds });
  }

  /**
   * Resume suspended cards
   */
  async unsuspendCards(cardIds: number[]): Promise<null> {
    return this.request("unsuspendCards", { cards: cardIds });
  }

  /**
   * Add tags to cards
   */
  async addTagsToCards(cardIds: number[], tags: string): Promise<null> {
    return this.request("addTagsToCards", { cards: cardIds, tags });
  }

  /**
   * Remove tags from cards
   */
  async removeTagsFromCards(
    cardIds: number[],
    tags: string
  ): Promise<null> {
    return this.request("removeTagsFromCards", { cards: cardIds, tags });
  }

  /**
   * Delete cards
   */
  async deleteCards(cardIds: number[]): Promise<null> {
    return this.request("deleteCards", { cards: cardIds });
  }

  /**
   * Answer cards with ease ratings
   * @param answers Array of {cardId, ease} where ease is 1-4 (Again/Hard/Good/Easy)
   */
  async answerCards(answers: Array<{ cardId: number; ease: number }>): Promise<boolean[]> {
    return this.request("answerCards", { answers });
  }

  /**
   * Check if cards are due for review
   */
  async areDue(cardIds: number[]): Promise<boolean[]> {
    return this.request("areDue", { cards: cardIds });
  }

  /**
   * Check if cards are suspended
   */
  async areSuspended(cardIds: number[]): Promise<boolean[]> {
    return this.request("areSuspended", { cards: cardIds });
  }

  /**
   * Bury cards (hide until next day)
   */
  async buryCards(cardIds: number[]): Promise<null> {
    return this.request("buryCards", { cards: cardIds });
  }

  /**
   * Set flag for cards (0: no flag, 1: red, 2: orange, 3: green, 4: blue)
   */
  async setSpecificValueOfCard(cardId: number, keys: string[], newValues: string[]): Promise<null> {
    return this.request("setSpecificValueOfCard", { card: cardId, keys, newValues });
  }

  /**
   * Set flag for cards (0-4: none/red/orange/green/blue)
   */
  async setCardFlag(cardId: number, flag: number): Promise<null> {
    // 使用专门的 API（AnkiConnect 2.1.56+）
    try {
      return await this.request("setCardFlag", { cards: [cardId], flag });
    } catch (error) {
      // 如果不支持，回退到 setSpecificValueOfCard
      console.warn("setCardFlag not supported, using setSpecificValueOfCard");
      return this.setSpecificValueOfCard(cardId, ["flags"], [flag.toString()]);
    }
  }

  /**
   * Get intervals for a card based on different ease ratings
   */
  async getIntervals(cardIds: number[], complete: boolean = false): Promise<number[][]> {
    return this.request("getIntervals", { cards: cardIds, complete });
  }

  // ========================================================================
  // Note Operations
  // ========================================================================

  /**
   * Get note IDs for a given query
   */
  async findNotes(query: string): Promise<number[]> {
    return this.request("findNotes", { query });
  }

  /**
   * Get notes by IDs
   */
  async notesInfo(noteIds: number[]): Promise<Note[]> {
    return this.request("notesInfo", { notes: noteIds });
  }

  /**
   * Get note by ID
   */
  async noteInfo(noteId: number): Promise<Note> {
    const notes = await this.notesInfo([noteId]);
    return notes[0];
  }

  /**
   * Add a note to a specific deck
   */
  async addNote(
    deckName: string,
    modelName: string,
    fields: Record<string, string>,
    options?: {
      tags?: string[];
      duplicateScope?: string;
      duplicateScopeOptions?: {
        deckName?: string;
        checkChildren?: boolean;
        checkAllModels?: boolean;
      };
    }
  ): Promise<number> {
    return this.request("addNote", {
      note: {
        deckName,
        modelName,
        fields,
        options: options || {},
        tags: options?.tags || [],
      },
    });
  }

  /**
   * Update a note
   */
  async updateNote(noteId: number, fields: Record<string, string>, tags?: string[]): Promise<null> {
    return this.request("updateNote", {
      note: {
        id: noteId,
        fields,
        tags: tags || [],
      },
    });
  }

  /**
   * Delete notes
   */
  async deleteNotes(noteIds: number[]): Promise<null> {
    return this.request("deleteNotes", { notes: noteIds });
  }

  // ========================================================================
  // Model Operations
  // ========================================================================

  /**
   * Get model names
   */
  async modelNames(): Promise<string[]> {
    return this.request("modelNames");
  }

  /**
   * Get all model names and their ids
   */
  async modelNamesAndIds(): Promise<Record<string, number>> {
    return this.request("modelNamesAndIds");
  }

  /**
   * Get field names for a model
   */
  async modelFieldNames(modelName: string): Promise<string[]> {
    return this.request("modelFieldNames", { modelName });
  }

  /**
   * Get models by ids
   */
  async findModelsById(ids: number[]): Promise<Record<string, any>[]> {
    return this.request("findModelsById", { modelIds: ids });
  }

  // ========================================================================
  // Miscellaneous
  // ========================================================================

  /**
   * Check if AnkiConnect is reachable
   */
  async version(): Promise<number> {
    try {
      return await this.request("version");
    } catch {
      throw new AnkiConnectConnectionError(
        "AnkiConnect is not reachable. Make sure the AnkiConnect plugin is installed and Anki is running."
      );
    }
  }

  /**
   * Sync collection with AnkiWeb
   */
  async sync(): Promise<null> {
    return this.request("sync");
  }

  /**
   * Get multi-line string from clipboard
   */
  async getClipboard(): Promise<string> {
    return this.request("getClipboard");
  }

  /**
   * Set clipboard to a multi-line string
   */
  async setClipboard(text: string): Promise<null> {
    return this.request("setClipboard", { text });
  }

  /**
   * Retrieve media file as base64
   */
  async retrieveMediaFile(filename: string): Promise<string | null> {
    return this.request("retrieveMediaFile", { filename });
  }

  /**
   * Get the names of media files matching a pattern
   */
  async getMediaFilesNames(pattern: string): Promise<string[]> {
    return this.request("getMediaFilesNames", { pattern });
  }

  /**
   * Get the directory path where Anki stores media files
   */
  async getMediaDirPath(): Promise<string> {
    return this.request("getMediaDirPath");
  }
}

// ============================================================================
// Singleton Instance (for browser/client-side use)
// ============================================================================

let defaultClient: AnkiConnectClient | null = null;

/**
 * Get the default AnkiConnect client instance
 * Use this in components for convenience
 */
export function getAnkiConnectClient(config?: AnkiConnectConfig): AnkiConnectClient {
  if (!defaultClient) {
    defaultClient = new AnkiConnectClient(config);
  }
  return defaultClient;
}

/**
 * Reset the default client (useful for testing or changing configuration)
 */
export function resetAnkiConnectClient(): void {
  defaultClient = null;
}
