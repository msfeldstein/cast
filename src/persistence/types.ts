/**
 * Persistence Types
 *
 * These types represent the serializable state of the application.
 * They're separate from runtime types to ensure only serializable data is persisted.
 */

import { SignalType, LFOConfig, MicrophoneConfig, BeatConfig, MIDIConfig, GamepadConfig } from '../signals';

// Version for schema migrations
export const SCHEMA_VERSION = 2;

// Serializable signal state
export interface PersistedSignal {
  id: string;
  type: SignalType;
  name: string;
  config: LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig | GamepadConfig;
  // MIDI/Gamepad-specific persisted state
  isLearned?: boolean;
}

// Serializable binding (includes optional effectId)
export interface PersistedBinding {
  layerId: string;
  controlName: string;
  signalId: string;
  effectId?: string;
}

// Serializable control value (name -> value mapping)
export type PersistedControlValue = number | string | boolean;
export type PersistedControls = Record<string, PersistedControlValue>;

// Serializable effect state
export interface PersistedEffect {
  factoryId: string;  // The effect factory ID (e.g., 'zoom-blur')
  instanceId: string; // Unique instance ID
  enabled: boolean;
  controls: PersistedControls;
}

// Serializable layer state
export interface PersistedLayer {
  id: string;
  sketchId: string | null;    // The sketch factory ID, or null if no sketch
  sketchControls: PersistedControls;  // Sketch control values
  effects: PersistedEffect[];
  opacity: number;
  blendMode: string;
  visible: boolean;
}

// Simple layout config (legacy - used by old PanelManager)
export interface SimpleLayoutConfig {
  /** Main horizontal split position as percentage (0-100) */
  mainSplit: number;
  /** Right column splits as percentages [layer1, layer2, bottom] */
  rightSplits: [number, number, number];
}

// Tree layout config (used by new WindowManager)
export interface TreeTabConfig {
  id: string;
  title: string;
}

export interface TreePanelNode {
  type: 'panel';
  id: string;
  tabs: TreeTabConfig[];
  activeTabId: string;
}

export interface TreeSplitNode {
  type: 'split';
  id: string;
  direction: 'horizontal' | 'vertical';
  ratio: number;
  first: TreeLayoutNode;
  second: TreeLayoutNode;
}

export type TreeLayoutNode = TreeSplitNode | TreePanelNode;

// Legacy: Serializable layout (rc-dock compatible structure without React elements)
// Kept for potential migration from old format
export interface PersistedLayout {
  dockbox: PersistedBox;
  floatbox?: PersistedBox;
}

export interface PersistedBox {
  mode?: 'horizontal' | 'vertical' | 'float';
  size?: number;
  children?: (PersistedBox | PersistedPanel)[];
}

export interface PersistedPanel {
  size?: number;
  tabs: PersistedTab[];
  activeId?: string;
}

export interface PersistedTab {
  id: string;
}

// Complete persisted state
export interface PersistedState {
  version: number;
  signals: PersistedSignal[];
  bindings: PersistedBinding[];
  layers: PersistedLayer[];
  layout: PersistedLayout | null;
  /** Legacy simple layout format */
  simpleLayout?: SimpleLayoutConfig | null;
  /** New tree-based layout format */
  treeLayout?: TreeLayoutNode | null;
}

// Default empty state
export const DEFAULT_STATE: PersistedState = {
  version: SCHEMA_VERSION,
  signals: [],
  bindings: [],
  layers: [],
  layout: null,
};
