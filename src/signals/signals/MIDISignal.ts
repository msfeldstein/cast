import { Signal, MIDIConfig } from '../types';

const DEFAULT_CONFIG: MIDIConfig = {
  type: 'midi',
  mode: 'cc',
  channel: 0, // 0 = all channels
  noteOrCC: -1, // -1 = not yet learned
  velocityMode: true,
};

export class MIDISignal implements Signal {
  type: 'midi' = 'midi';
  name: string;

  private config: MIDIConfig;
  private currentValue: number = 0;
  private _isListening: boolean = false;
  private _isLearned: boolean = false;
  private onLearnCallback: (() => void) | null = null;

  private midiAccess: MIDIAccess | null = null;
  private activeNotes: Map<number, number> = new Map(); // note -> velocity

  constructor(public id: string, config?: Partial<MIDIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.name = `MIDI ${id.split('-')[1]}`;
  }

  async init(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();

      // Listen on all inputs
      for (const input of this.midiAccess.inputs.values()) {
        input.onmidimessage = this.handleMIDIMessage;
      }

      // Handle new devices
      this.midiAccess.onstatechange = (e: Event) => {
        const port = (e as MIDIConnectionEvent).port;
        if (port && port.type === 'input' && port.state === 'connected') {
          (port as MIDIInput).onmidimessage = this.handleMIDIMessage;
        }
      };
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
    }
  }

  private handleMIDIMessage = (event: MIDIMessageEvent): void => {
    if (!event.data || event.data.length < 2) return;

    const [status, data1, data2] = event.data;
    const command = status >> 4;
    const channel = (status & 0x0f) + 1;

    // Learning mode - capture the first meaningful MIDI message
    if (this._isListening) {
      // CC message
      if (command === 11) {
        this.config.mode = 'cc';
        this.config.channel = channel;
        this.config.noteOrCC = data1;
        this._isListening = false;
        this._isLearned = true;
        this.name = `CC ${data1} (Ch ${channel})`;
        this.currentValue = data2 / 127;
        this.onLearnCallback?.();
        return;
      }
      // Note On
      if (command === 9 && data2 > 0) {
        this.config.mode = 'note';
        this.config.channel = channel;
        this.config.noteOrCC = data1;
        this._isListening = false;
        this._isLearned = true;
        this.name = `Note ${this.noteToName(data1)} (Ch ${channel})`;
        this.currentValue = this.config.velocityMode ? data2 / 127 : 1;
        this.activeNotes.set(data1, data2);
        this.onLearnCallback?.();
        return;
      }
      return; // Ignore other messages while learning
    }

    // Normal operation - only process if learned
    if (!this._isLearned) return;

    // Check channel filter
    if (this.config.channel !== 0 && channel !== this.config.channel) {
      return;
    }

    if (this.config.mode === 'note') {
      // Note On
      if (command === 9 && data2 > 0) {
        if (data1 === this.config.noteOrCC) {
          this.activeNotes.set(data1, data2);
          this.currentValue = this.config.velocityMode ? data2 / 127 : 1;
        }
      }
      // Note Off
      else if (command === 8 || (command === 9 && data2 === 0)) {
        if (data1 === this.config.noteOrCC) {
          this.activeNotes.delete(data1);
          if (this.activeNotes.size === 0) {
            this.currentValue = 0;
          }
        }
      }
    } else if (this.config.mode === 'cc') {
      // Control Change
      if (command === 11 && data1 === this.config.noteOrCC) {
        this.currentValue = data2 / 127;
      }
    }
  };

  private noteToName(note: number): string {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const name = names[note % 12];
    return `${name}${octave}`;
  }

  // Start listening for MIDI input to learn
  startListening(onLearn?: () => void): void {
    this._isListening = true;
    this.onLearnCallback = onLearn || null;
  }

  // Stop listening without learning
  stopListening(): void {
    this._isListening = false;
    this.onLearnCallback = null;
  }

  // Check if currently in learn mode
  isListening(): boolean {
    return this._isListening;
  }

  // Check if this signal has learned a MIDI source
  isLearned(): boolean {
    return this._isLearned;
  }

  // Clear the learned mapping
  clearLearning(): void {
    this._isLearned = false;
    this.config.noteOrCC = -1;
    this.currentValue = 0;
    this.activeNotes.clear();
    this.name = `MIDI ${this.id.split('-')[1]}`;
  }

  // Set learned state (for restoration from persistence)
  setLearned(learned: boolean): void {
    this._isLearned = learned;
  }

  update(_time: number, _deltaTime: number): void {
    // MIDI values are updated via callbacks, nothing to do here
  }

  getValue(): number {
    return this.currentValue;
  }

  getConfig(): MIDIConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<MIDIConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset value when config changes
    this.currentValue = 0;
    this.activeNotes.clear();
  }

  dispose(): void {
    if (this.midiAccess) {
      for (const input of this.midiAccess.inputs.values()) {
        input.onmidimessage = null;
      }
      this.midiAccess = null;
    }
    this.activeNotes.clear();
    this._isListening = false;
    this.onLearnCallback = null;
  }
}
