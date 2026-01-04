import { LFOSignal as ILFOSignal, LFOConfig } from '../types';

const DEFAULT_CONFIG: LFOConfig = {
  type: 'lfo',
  waveform: 'sine',
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0,
  offset: 0.5,
};

export class LFOSignal implements ILFOSignal {
  type: 'lfo' = 'lfo';
  name: string;

  private config: LFOConfig;
  private currentValue: number = 0.5;
  private internalPhase: number = 0;

  constructor(public id: string, config?: Partial<LFOConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.name = `LFO ${id.split('-')[1]}`;
    this.internalPhase = this.config.phase;
  }

  async init(): Promise<void> {
    // LFO needs no async initialization
  }

  update(_time: number, deltaTime: number): void {
    // Advance phase based on frequency
    this.internalPhase += this.config.frequency * deltaTime;
    this.internalPhase %= 1.0;

    // Calculate raw waveform value (-1 to 1)
    let raw: number;
    const phase = this.internalPhase * Math.PI * 2;

    switch (this.config.waveform) {
      case 'sine':
        raw = Math.sin(phase);
        break;
      case 'sawtooth':
        raw = 2 * this.internalPhase - 1;
        break;
      case 'square':
        raw = this.internalPhase < 0.5 ? 1 : -1;
        break;
      case 'triangle':
        raw = 1 - 4 * Math.abs(this.internalPhase - 0.5);
        break;
      default:
        raw = 0;
    }

    // Apply amplitude and offset, clamp to 0-1
    this.currentValue = Math.max(
      0,
      Math.min(1, this.config.offset + raw * this.config.amplitude * 0.5)
    );
  }

  getValue(): number {
    return this.currentValue;
  }

  getConfig(): LFOConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<LFOConfig>): void {
    // Only apply config properties that match this signal type
    const { type, ...rest } = config;
    this.config = { ...this.config, ...rest } as LFOConfig;
  }

  dispose(): void {
    // Nothing to clean up
  }
}
