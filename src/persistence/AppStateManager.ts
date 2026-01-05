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
  PersistedLayer,
  PersistedEffect,
  PersistedControls,
  SimpleLayoutConfig,
  TreeLayoutNode,
  DEFAULT_STATE,
} from './types';
import { signalManager } from '../signals';
import { Layer } from '../core/Layer';

class AppStateManager {
  private simpleLayout: SimpleLayoutConfig | null = null;
  private treeLayout: TreeLayoutNode | null = null;
  private initialized = false;
  private layers: Layer[] = [];
  private savedLayers: PersistedLayer[] = [];
  private layerEventCleanup: Map<string, () => void> = new Map();

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
    this.treeLayout = state.treeLayout || null;
    // Store saved layers for later hydration by App
    this.savedLayers = state.layers || [];
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
   * Get the tree layout configuration
   */
  getTreeLayout(): TreeLayoutNode | null {
    return this.treeLayout;
  }

  /**
   * Save the tree layout configuration
   */
  saveTreeLayout(layout: TreeLayoutNode): void {
    this.treeLayout = layout;
    this.saveState();
  }

  /**
   * Get saved layer data for hydration.
   * Call this after initialize() to get any saved layer state.
   */
  getSavedLayers(): PersistedLayer[] {
    return this.savedLayers;
  }

  /**
   * Register layers for persistence.
   * Call this when layers are created to enable automatic saving.
   */
  registerLayers(layers: Layer[]): void {
    // Unregister old layers
    this.unregisterLayers();

    this.layers = layers;

    // Subscribe to layer changes for auto-save
    for (const layer of layers) {
      const cleanup = this.subscribeToLayerChanges(layer);
      this.layerEventCleanup.set(layer.id, cleanup);
    }
  }

  /**
   * Register a single layer (for dynamically added layers)
   */
  registerLayer(layer: Layer): void {
    if (!this.layers.includes(layer)) {
      this.layers.push(layer);
      const cleanup = this.subscribeToLayerChanges(layer);
      this.layerEventCleanup.set(layer.id, cleanup);
    }
  }

  /**
   * Unregister a layer (for removed layers)
   */
  unregisterLayer(layerId: string): void {
    const cleanup = this.layerEventCleanup.get(layerId);
    if (cleanup) {
      cleanup();
      this.layerEventCleanup.delete(layerId);
    }
    this.layers = this.layers.filter((l) => l.id !== layerId);
  }

  /**
   * Unregister all layers
   */
  private unregisterLayers(): void {
    for (const cleanup of this.layerEventCleanup.values()) {
      cleanup();
    }
    this.layerEventCleanup.clear();
    this.layers = [];
  }

  /**
   * Subscribe to layer events for auto-saving
   */
  private subscribeToLayerChanges(layer: Layer): () => void {
    const cleanups: (() => void)[] = [];

    // Listen to property changes
    cleanups.push(layer.on('property:change', () => this.saveState()));

    // Listen to sketch changes
    cleanups.push(layer.on('sketch:load', () => this.saveState()));
    cleanups.push(layer.on('sketch:unload', () => this.saveState()));

    // Listen to effect changes
    cleanups.push(layer.on('effect:add', () => this.saveState()));
    cleanups.push(layer.on('effect:remove', () => this.saveState()));
    cleanups.push(layer.on('effects:reorder', () => this.saveState()));

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
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
      layers: this.serializeLayers(),
      layout: null, // Legacy field, no longer used
      simpleLayout: this.simpleLayout,
      treeLayout: this.treeLayout,
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
      effectId: binding.effectId,
    }));
  }

  /**
   * Serialize all layers
   */
  private serializeLayers(): PersistedLayer[] {
    return this.layers.map((layer) => {
      // Serialize sketch controls
      const sketchControls: PersistedControls = {};
      if (layer.sketch) {
        for (const control of layer.sketch.controls) {
          const value = layer.sketch.getControl(control.name);
          if (value !== undefined) {
            sketchControls[control.name] = value;
          }
        }
      }

      // Serialize effects
      const effects: PersistedEffect[] = layer.effects.map((effect) => {
        const controls: PersistedControls = {};
        for (const control of effect.controls) {
          const value = effect.getControl(control.name);
          if (value !== undefined) {
            controls[control.name] = value;
          }
        }

        // Extract factory ID from effect ID (e.g., 'zoom-blur-1' -> 'zoom-blur')
        const factoryId = effect.id.replace(/-\d+$/, '');

        return {
          factoryId,
          instanceId: effect.id,
          enabled: effect.enabled,
          controls,
        };
      });

      return {
        id: layer.id,
        sketchId: layer.sketch?.id.replace(/-\d+$/, '') || null,
        sketchControls,
        effects,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        visible: layer.visible,
      };
    });
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
          effectId: binding.effectId,
        },
        binding.signalId
      );
    }
  }
}

// Singleton instance
export const appStateManager = new AppStateManager();
