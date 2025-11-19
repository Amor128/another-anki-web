/**
 * React Hook for AnkiConnect
 * Provides a convenient way to use AnkiConnect in React components
 */

import { useState, useCallback, useEffect } from "react";
import {
  AnkiConnectClient,
  AnkiConnectError,
  getAnkiConnectClient,
  type AnkiConnectConfig,
  type CardInfo,
  type Note,
  type DeckStats,
} from "./ankiconnect";

export interface Model {
  id: number;
  name: string;
  [key: string]: any;
}

interface ModelsState {
  models: Model[];
  modelNameToId: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface UseAnkiConnectOptions {
  config?: AnkiConnectConfig;
  autoCheck?: boolean; // Check connection on mount
}

export interface UseAnkiConnectReturn {
  client: AnkiConnectClient;
  isConnected: boolean;
  isLoading: boolean;
  error: AnkiConnectError | null;
  checkConnection: () => Promise<void>;
}

/**
 * Hook to access AnkiConnect client
 * Optionally checks connection status on mount
 */
export function useAnkiConnect(
  options: UseAnkiConnectOptions = {}
): UseAnkiConnectReturn {
  const { config, autoCheck = true } = options;

  const client = getAnkiConnectClient(config);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(autoCheck);
  const [error, setError] = useState<AnkiConnectError | null>(null);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await client.version();
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      if (err instanceof AnkiConnectError) {
        setError(err);
      } else {
        setError(
          new AnkiConnectError(
            "UNKNOWN_ERROR",
            "An unknown error occurred while checking connection"
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (autoCheck) {
      checkConnection();
    }
  }, [autoCheck, checkConnection]);

  return {
    client,
    isConnected,
    isLoading,
    error,
    checkConnection,
  };
}

// ============================================================================
// Specialized Hooks for Common Operations
// ============================================================================

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: AnkiConnectError | null;
}

/**
 * Hook to fetch deck names
 */
export function useDeckNames() {
  const { client } = useAnkiConnect();
  const [state, setState] = useState<UseAsyncState<string[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await client.deckNames();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof AnkiConnectError ? err : new AnkiConnectError("UNKNOWN_ERROR", String(err));
      setState({ data: null, isLoading: false, error });
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook to fetch deck statistics
 */
export function useDeckStats() {
  const { client } = useAnkiConnect();
  const [state, setState] = useState<UseAsyncState<DeckStats>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await client.deckStats();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof AnkiConnectError ? err : new AnkiConnectError("UNKNOWN_ERROR", String(err));
      setState({ data: null, isLoading: false, error });
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook to search cards
 */
export function useCardSearch(query: string, enabled: boolean = true) {
  const { client } = useAnkiConnect();
  const [state, setState] = useState<UseAsyncState<number[]>>({
    data: null,
    isLoading: enabled && !!query,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!query) {
      setState({ data: [], isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await client.findCards(query);
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof AnkiConnectError ? err : new AnkiConnectError("UNKNOWN_ERROR", String(err));
      setState({ data: null, isLoading: false, error });
    }
  }, [client, query]);

  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  return { ...state, refresh };
}

/**
 * Hook to fetch card information
 */
export function useCardInfo(cardId: number | null) {
  const { client } = useAnkiConnect();
  const [state, setState] = useState<UseAsyncState<CardInfo>>({
    data: null,
    isLoading: !!cardId,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!cardId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await client.cardInfo(cardId);
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof AnkiConnectError ? err : new AnkiConnectError("UNKNOWN_ERROR", String(err));
      setState({ data: null, isLoading: false, error });
    }
  }, [client, cardId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

/**
 * Hook to fetch note information
 */
export function useNoteInfo(noteId: number | null) {
  const { client } = useAnkiConnect();
  const [state, setState] = useState<UseAsyncState<Note>>({
    data: null,
    isLoading: !!noteId,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!noteId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await client.noteInfo(noteId);
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof AnkiConnectError ? err : new AnkiConnectError("UNKNOWN_ERROR", String(err));
      setState({ data: null, isLoading: false, error });
    }
  }, [client, noteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

// Global models cache to avoid refetching
let modelsCache: ModelsState | null = null;
const modelsCacheListeners = new Set<() => void>();

/**
 * Hook to fetch and store all models
 * Fetches model names/ids and detailed model information on app startup
 */
export function useInitializeModels() {
  const { client } = useAnkiConnect({ autoCheck: false });
  const [modelsState, setModelsState] = useState<ModelsState>(
    modelsCache || {
      models: [],
      modelNameToId: {},
      isLoading: false,
      error: null,
      initialized: false,
    }
  );

  const loadModels = useCallback(async () => {
    // Skip if already initialized
    if (modelsState.initialized || modelsCache?.initialized) {
      return;
    }

    setModelsState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Fetch model names and IDs
      const modelNameToId = await client.modelNamesAndIds();

      // Extract model IDs
      const modelIds = Object.values(modelNameToId);

      // Fetch detailed model information
      let detailedModels: Record<string, any>[] = [];
      if (modelIds.length > 0) {
        detailedModels = await client.findModelsById(modelIds);
      }

      // Transform models to include id and name
      const models: Model[] = detailedModels.map((model) => ({
        ...model,
        id: model.id,
        name: model.name,
      }));

      const newState = {
        models,
        modelNameToId,
        isLoading: false,
        error: null,
        initialized: true,
      };

      modelsCache = newState;
      setModelsState(newState);
      modelsCacheListeners.forEach((listener) => listener());
    } catch (err) {
      const errorMessage =
        err instanceof AnkiConnectError
          ? err.message
          : "Failed to load models";
      setModelsState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [client, modelsState.initialized]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return modelsState;
}

/**
 * Hook to access models
 * Use this in components to get all models and metadata
 */
export function useModels() {
  const [modelsState, setModelsState] = useState<ModelsState>(
    modelsCache || {
      models: [],
      modelNameToId: {},
      isLoading: false,
      error: null,
      initialized: false,
    }
  );

  useEffect(() => {
    const listener = () => {
      if (modelsCache) {
        setModelsState(modelsCache);
      }
    };

    modelsCacheListeners.add(listener);
    return () => {
      modelsCacheListeners.delete(listener);
    };
  }, []);

  return modelsState;
}