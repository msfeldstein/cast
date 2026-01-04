/**
 * Storage
 *
 * Low-level storage abstraction with:
 * - localStorage persistence
 * - Schema versioning for migrations
 * - Debounced writes to prevent excessive saves
 * - Type-safe serialization/deserialization
 */

import { PersistedState, DEFAULT_STATE, SCHEMA_VERSION } from './types';

const STORAGE_KEY = 'cast-app-state';
const DEBOUNCE_MS = 1000;

class Storage {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingState: PersistedState | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Load state from localStorage
   */
  load(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATE;

      const parsed = JSON.parse(raw) as PersistedState;
      return this.migrate(parsed);
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      return DEFAULT_STATE;
    }
  }

  /**
   * Save state to localStorage (debounced)
   */
  save(state: PersistedState): void {
    this.pendingState = { ...state, version: SCHEMA_VERSION };

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.flush();
    }, DEBOUNCE_MS);
  }

  /**
   * Immediately write pending state to localStorage
   */
  flush(): void {
    if (this.pendingState) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pendingState));
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to save state:', error);
      }
      this.pendingState = null;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Clear all persisted state
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.pendingState = null;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.notifyListeners();
  }

  /**
   * Subscribe to save events
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Migrate state from older schema versions
   */
  private migrate(state: PersistedState): PersistedState {
    let current = state;

    // No version field = version 0
    if (!current.version) {
      current = { ...DEFAULT_STATE, ...current, version: 0 };
    }

    // Migration from version 0 to 1
    if (current.version < 1) {
      // Ensure all required fields exist
      current = {
        version: 1,
        signals: current.signals || [],
        bindings: current.bindings || [],
        layout: current.layout || null,
      };
    }

    // Future migrations would go here:
    // if (current.version < 2) { ... }

    return current;
  }
}

// Singleton instance
export const storage = new Storage();
