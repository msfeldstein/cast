/**
 * Persistence Types
 *
 * These types represent the serializable state of the application.
 * They're separate from runtime types to ensure only serializable data is persisted.
 */

import { SignalType, LFOConfig, MicrophoneConfig, BeatConfig, MIDIConfig } from '../signals';

// Version for schema migrations
export const SCHEMA_VERSION = 1;

// Serializable signal state
export interface PersistedSignal {
  id: string;
  type: SignalType;
  name: string;
  config: LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig;
  // MIDI-specific persisted state
  isLearned?: boolean;
}

// Serializable binding
export interface PersistedBinding {
  layerId: string;
  controlName: string;
  signalId: string;
}

// Simple layout config (used by new vanilla JS UI)
export interface SimpleLayoutConfig {
  /** Main horizontal split position as percentage (0-100) */
  mainSplit: number;
  /** Right column splits as percentages [layer1, layer2, bottom] */
  rightSplits: [number, number, number];
}

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
  layout: PersistedLayout | null;
  /** New simple layout format */
  simpleLayout?: SimpleLayoutConfig | null;
}

// Default empty state
export const DEFAULT_STATE: PersistedState = {
  version: SCHEMA_VERSION,
  signals: [],
  bindings: [],
  layout: null,
};
