export { SignalManager, signalManager, type SignalManagerEvents } from './SignalManager';
export type {
  Signal,
  BaseSignal,
  SignalType,
  SignalConfig,
  LFOConfig,
  MicrophoneConfig,
  BeatConfig,
  MIDIConfig,
  GamepadConfig,
  ControlBinding,
  ControlTarget,
  // Individual signal type interfaces
  LFOSignal as LFOSignalType,
  MicrophoneSignal as MicrophoneSignalType,
  BeatSignal as BeatSignalType,
  MIDISignalType,
  GamepadSignalType,
} from './types';
export { LFOSignal } from './signals/LFOSignal';
export { MicrophoneSignal } from './signals/MicrophoneSignal';
export { BeatSignal } from './signals/BeatSignal';
export { MIDISignal } from './signals/MIDISignal';
export { GamepadSignal } from './signals/GamepadSignal';
