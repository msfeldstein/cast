export type SignalType = 'lfo' | 'microphone' | 'beat' | 'midi' | 'gamepad';

// Base signal interface with common properties
export interface BaseSignal {
  id: string;
  name: string;

  // Current value always normalized 0-1
  getValue(): number;

  // Called each frame to update internal state
  update(time: number, deltaTime: number): void;

  // Lifecycle
  init(): Promise<void>;
  dispose(): void;

  // Configuration - accepts any config, returns specific config via discriminated union
  getConfig(): SignalConfig;
  setConfig(config: Partial<SignalConfig>): void;
}

// Specific signal interfaces for discriminated union
export interface LFOSignal extends BaseSignal {
  type: 'lfo';
  getConfig(): LFOConfig;
}

export interface MicrophoneSignal extends BaseSignal {
  type: 'microphone';
  getConfig(): MicrophoneConfig;
}

export interface BeatSignal extends BaseSignal {
  type: 'beat';
  getConfig(): BeatConfig;
}

export interface MIDISignalType extends BaseSignal {
  type: 'midi';
  getConfig(): MIDIConfig;
  isLearned(): boolean;
  setLearned(learned: boolean): void;
  isListening(): boolean;
  startListening(onLearn?: () => void): void;
  stopListening(): void;
  clearLearning(): void;
}

export interface GamepadSignalType extends BaseSignal {
  type: 'gamepad';
  getConfig(): GamepadConfig;
  isLearned(): boolean;
  setLearned(learned: boolean): void;
  isListening(): boolean;
  startListening(onLearn?: () => void): void;
  stopListening(): void;
  clearLearning(): void;
}

// Discriminated union of all signal types
export type Signal = LFOSignal | MicrophoneSignal | BeatSignal | MIDISignalType | GamepadSignalType;

// LFO Configuration
export interface LFOConfig {
  type: 'lfo';
  waveform: 'sine' | 'sawtooth' | 'square' | 'triangle';
  frequency: number;  // Hz
  phase: number;      // 0-1
  amplitude: number;  // 0-1 (scales output)
  offset: number;     // 0-1 (shifts output)
}

// Microphone Configuration
export interface MicrophoneConfig {
  type: 'microphone';
  smoothing: number;   // 0-1, how much to smooth input
  gain: number;        // Amplification factor
  noiseFloor: number;  // Threshold below which output is 0
}

// Beat Detection Configuration
export interface BeatConfig {
  type: 'beat';
  sensitivity: number;  // How easily beats are detected
  decay: number;        // How fast the pulse decays (seconds)
  minInterval: number;  // Minimum ms between beats
}

// MIDI Configuration
export interface MIDIConfig {
  type: 'midi';
  mode: 'note' | 'cc';
  channel: number;       // 1-16, or 0 for all
  noteOrCC: number;      // Note number or CC number
  velocityMode: boolean; // For notes: use velocity vs on/off
}

// Gamepad Configuration
export interface GamepadConfig {
  type: 'gamepad';
  gamepadIndex: number;        // Which gamepad (0-3)
  inputType: 'axis' | 'button';
  inputIndex: number;          // Which axis or button
  invert: boolean;             // Invert axis direction
  deadzone: number;            // Deadzone for analog sticks (0-0.5)
}

// Union type for all signal configs
export type SignalConfig = LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig | GamepadConfig;

// Binding: maps a control to a signal
export interface ControlBinding {
  layerId: string;
  controlName: string;
  signalId: string;
}

// Control target identifier for binding
export interface ControlTarget {
  layerId: string;
  controlName: string;
  min: number;
  max: number;
}
