/**
 * AppStateManager
 *
 * High-level state persistence coordinator that:
 * - Coordinates saving/loading of signals, bindings, and layout
 * - Provides methods for components to trigger saves
 * - Handles initial hydration on app load
 */

import { storage } from './Storage';
import {
  PersistedState,
  PersistedSignal,
  PersistedBinding,
  SimpleLayoutConfig,
  DEFAULT_STATE,
} from './types';
import { signalManager } from '../signals';

class AppStateManager {
  private simpleLayout: SimpleLayoutConfig | null = null;
  private initialized = false;

  /**
   * Initialize the app state from persistence.
   * Call this once on app startup before rendering.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const state = storage.load();
    await this.hydrateSignals(state.signals);
    this.hydrateBindings(state.bindings);
    this.simpleLayout = state.simpleLayout || null;
    this.initialized = true;

    // Subscribe to signal changes to auto-save
    signalManager.subscribe(() => this.saveState());
  }

  /**
   * Get the simple layout configuration
   */
  getSimpleLayout(): SimpleLayoutConfig | null {
    return this.simpleLayout;
  }

  /**
   * Save the simple layout configuration
   */
  saveSimpleLayout(layout: SimpleLayoutConfig): void {
    this.simpleLayout = layout;
    this.saveState();
  }

  /**
   * Trigger a state save
   */
  saveState(): void {
    const state = this.serializeState();
    storage.save(state);
  }

  /**
   * Force immediate save (use before page unload)
   */
  flush(): void {
    this.saveState();
    storage.flush();
  }

  /**
   * Clear all persisted state
   */
  clear(): void {
    storage.clear();
    this.simpleLayout = null;
  }

  /**
   * Serialize the current app state
   */
  private serializeState(): PersistedState {
    return {
      version: DEFAULT_STATE.version,
      signals: this.serializeSignals(),
      bindings: this.serializeBindings(),
      layout: null, // Legacy field, no longer used
      simpleLayout: this.simpleLayout,
    };
  }

  /**
   * Serialize all signals
   */
  private serializeSignals(): PersistedSignal[] {
    return signalManager.getAllSignals().map((signal) => {
      const persisted: PersistedSignal = {
        id: signal.id,
        type: signal.type,
        name: signal.name,
        config: signal.getConfig(),
      };

      // MIDI/Gamepad-specific: persist learned state
      if (signal.type === 'midi' || signal.type === 'gamepad') {
        persisted.isLearned = signal.isLearned();
      }

      return persisted;
    });
  }

  /**
   * Serialize all bindings
   */
  private serializeBindings(): PersistedBinding[] {
    return signalManager.getAllBindings().map((binding) => ({
      layerId: binding.layerId,
      controlName: binding.controlName,
      signalId: binding.signalId,
    }));
  }

  /**
   * Hydrate signals from persisted state
   */
  private async hydrateSignals(signals: PersistedSignal[]): Promise<void> {
    for (const persisted of signals) {
      try {
        const signal = await signalManager.createSignal(
          persisted.type,
          persisted.id,
          persisted.config
        );

        // Restore signal name
        if (signal) {
          signal.name = persisted.name;

          // MIDI/Gamepad-specific: restore learned state
          if ((signal.type === 'midi' || signal.type === 'gamepad') && persisted.isLearned) {
            signal.setLearned(true);
          }
        }
      } catch (error) {
        console.error(`Failed to restore signal ${persisted.id}:`, error);
      }
    }
  }

  /**
   * Hydrate bindings from persisted state
   */
  private hydrateBindings(bindings: PersistedBinding[]): void {
    for (const binding of bindings) {
      signalManager.bind(
        {
          layerId: binding.layerId,
          controlName: binding.controlName,
          min: 0, // These will be set correctly when the control is accessed
          max: 1,
        },
        binding.signalId
      );
    }
  }
}

// Singleton instance
export const appStateManager = new AppStateManager();
