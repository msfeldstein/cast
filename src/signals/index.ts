export { SignalManager, signalManager, type SignalManagerEvents } from './SignalManager';
export type {
  Signal,
  SignalType,
  SignalConfig,
  LFOConfig,
  MicrophoneConfig,
  BeatConfig,
  MIDIConfig,
  ControlBinding,
  ControlTarget,
} from './types';
export { LFOSignal } from './signals/LFOSignal';
export { MicrophoneSignal } from './signals/MicrophoneSignal';
export { BeatSignal } from './signals/BeatSignal';
export { MIDISignal } from './signals/MIDISignal';
