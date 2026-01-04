import { EventEmitter } from '../ui/EventEmitter';
import {
  Signal,
  SignalType,
  SignalConfig,
  ControlBinding,
  ControlTarget,
  LFOConfig,
  MicrophoneConfig,
  BeatConfig,
  MIDIConfig,
  GamepadConfig,
} from './types';
import { LFOSignal } from './signals/LFOSignal';
import { MicrophoneSignal } from './signals/MicrophoneSignal';
import { BeatSignal } from './signals/BeatSignal';
import { MIDISignal } from './signals/MIDISignal';
import { GamepadSignal } from './signals/GamepadSignal';

export interface SignalManagerEvents {
  [key: string]: unknown;
  'signal:add': { signal: Signal };
  'signal:remove': { signalId: string };
  'signal:config': { signal: Signal };
  'binding:add': { binding: ControlBinding };
  'binding:remove': { layerId: string; controlName: string };
  /** Generic change event for backward compatibility */
  'change': void;
}

export class SignalManager extends EventEmitter<SignalManagerEvents> {
  private signals: Map<string, Signal> = new Map();
  private bindings: ControlBinding[] = [];
  private nextId: Map<SignalType, number> = new Map();

  constructor() {
    super();
    this.nextId.set('lfo', 1);
    this.nextId.set('microphone', 1);
    this.nextId.set('beat', 1);
    this.nextId.set('midi', 1);
    this.nextId.set('gamepad', 1);
  }

  // ===== Signal Management =====

  /**
   * Create a new signal. If restoreId is provided, uses that ID (for restoration).
   * Otherwise generates a new ID.
   */
  async createSignal(
    type: SignalType,
    restoreId?: string,
    config?: Partial<SignalConfig>
  ): Promise<Signal> {
    let id: string;

    if (restoreId) {
      // Use provided ID for restoration
      id = restoreId;
      // Update nextId counter to avoid collisions
      const match = restoreId.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const currentNext = this.nextId.get(type) || 1;
        if (num >= currentNext) {
          this.nextId.set(type, num + 1);
        }
      }
    } else {
      // Generate new ID
      const num = this.nextId.get(type) || 1;
      id = `${type}-${num}`;
      this.nextId.set(type, num + 1);
    }

    let signal: Signal;
    switch (type) {
      case 'lfo':
        signal = new LFOSignal(id, config as Partial<LFOConfig>);
        break;
      case 'microphone':
        signal = new MicrophoneSignal(id, config as Partial<MicrophoneConfig>);
        break;
      case 'beat':
        signal = new BeatSignal(id, config as Partial<BeatConfig>);
        break;
      case 'midi':
        signal = new MIDISignal(id, config as Partial<MIDIConfig>);
        break;
      case 'gamepad':
        signal = new GamepadSignal(id, config as Partial<GamepadConfig>);
        break;
      default:
        throw new Error(`Unknown signal type: ${type}`);
    }

    await signal.init();
    this.signals.set(id, signal);
    this.emit('signal:add', { signal });
    this.emit('change', undefined);
    return signal;
  }

  removeSignal(signalId: string): void {
    const signal = this.signals.get(signalId);
    if (signal) {
      signal.dispose();
      this.signals.delete(signalId);
      // Remove all bindings to this signal
      const removedBindings = this.bindings.filter((b) => b.signalId === signalId);
      this.bindings = this.bindings.filter((b) => b.signalId !== signalId);

      // Emit binding removal events
      for (const binding of removedBindings) {
        this.emit('binding:remove', {
          layerId: binding.layerId,
          controlName: binding.controlName,
        });
      }

      this.emit('signal:remove', { signalId });
      this.emit('change', undefined);
    }
  }

  getSignal(id: string): Signal | undefined {
    return this.signals.get(id);
  }

  getAllSignals(): Signal[] {
    return Array.from(this.signals.values());
  }

  /**
   * Notify that a signal's configuration has changed.
   * Call this after updating signal config to trigger UI updates.
   */
  notifyConfigChange(signal: Signal): void {
    this.emit('signal:config', { signal });
    this.emit('change', undefined);
  }

  // ===== Binding Management =====

  bind(target: ControlTarget, signalId: string): void {
    // Remove existing binding for this control
    this.unbind(target.layerId, target.controlName);

    const binding: ControlBinding = {
      layerId: target.layerId,
      controlName: target.controlName,
      signalId,
    };
    this.bindings.push(binding);
    this.emit('binding:add', { binding });
    this.emit('change', undefined);
  }

  unbind(layerId: string, controlName: string): void {
    const index = this.bindings.findIndex(
      (b) => b.layerId === layerId && b.controlName === controlName
    );
    if (index !== -1) {
      this.bindings.splice(index, 1);
      this.emit('binding:remove', { layerId, controlName });
      this.emit('change', undefined);
    }
  }

  getBinding(layerId: string, controlName: string): ControlBinding | undefined {
    return this.bindings.find(
      (b) => b.layerId === layerId && b.controlName === controlName
    );
  }

  getBindingsForSignal(signalId: string): ControlBinding[] {
    return this.bindings.filter((b) => b.signalId === signalId);
  }

  getAllBindings(): ControlBinding[] {
    return [...this.bindings];
  }

  // ===== Frame Update =====

  update(time: number, deltaTime: number): void {
    for (const signal of this.signals.values()) {
      signal.update(time, deltaTime);
    }
  }

  // Get mapped value for a bound control
  getMappedValue(
    layerId: string,
    controlName: string,
    min: number,
    max: number
  ): number | undefined {
    const binding = this.getBinding(layerId, controlName);
    if (!binding) return undefined;

    const signal = this.signals.get(binding.signalId);
    if (!signal) return undefined;

    // Map 0-1 signal value to control's min-max range
    const normalizedValue = signal.getValue();
    return min + normalizedValue * (max - min);
  }

  // ===== Backward Compatibility =====

  /**
   * @deprecated Use `on('change', callback)` instead
   */
  subscribe(callback: () => void): () => void {
    return this.on('change', callback);
  }

  // ===== Cleanup =====

  dispose(): void {
    for (const signal of this.signals.values()) {
      signal.dispose();
    }
    this.signals.clear();
    this.bindings = [];
    this.clearAllListeners();
  }
}

// Singleton instance for global access
export const signalManager = new SignalManager();
