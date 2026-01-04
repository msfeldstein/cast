import { BeatSignal as IBeatSignal, BeatConfig } from '../types';

const DEFAULT_CONFIG: BeatConfig = {
  type: 'beat',
  sensitivity: 1.0,
  decay: 0.2,
  minInterval: 100,
};

export class BeatSignal implements IBeatSignal {
  type: 'beat' = 'beat';
  name: string;

  private config: BeatConfig;
  private currentValue: number = 0;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;

  private energyHistory: number[] = [];
  private lastBeatTime: number = 0;
  private beatPulse: number = 0;

  constructor(public id: string, config?: Partial<BeatConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.name = `Beat ${id.split('-')[1]}`;
  }

  async init(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;

      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.energyHistory = new Array(43).fill(0); // ~1 second of history at 60fps
    } catch (error) {
      console.error('Failed to initialize beat detection:', error);
      throw error;
    }
  }

  update(time: number, deltaTime: number): void {
    if (!this.analyser || !this.dataArray) {
      this.currentValue = 0;
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate energy in bass frequencies (first ~10 bins, roughly 0-860Hz)
    let bassEnergy = 0;
    const bassBins = Math.min(10, this.dataArray.length);
    for (let i = 0; i < bassBins; i++) {
      bassEnergy += this.dataArray[i] / 255;
    }
    bassEnergy /= bassBins;

    // Update energy history
    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > 43) {
      this.energyHistory.shift();
    }

    // Calculate average energy
    const avgEnergy =
      this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Beat detection: current energy significantly above average
    const threshold = avgEnergy * (1.2 + (1 - this.config.sensitivity) * 0.8);
    const timeSinceLastBeat = time * 1000 - this.lastBeatTime;

    if (bassEnergy > threshold && timeSinceLastBeat > this.config.minInterval) {
      this.beatPulse = 1.0;
      this.lastBeatTime = time * 1000;
    }

    // Decay the pulse
    this.beatPulse = Math.max(0, this.beatPulse - deltaTime / this.config.decay);

    this.currentValue = this.beatPulse;
  }

  getValue(): number {
    return this.currentValue;
  }

  getConfig(): BeatConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<BeatConfig>): void {
    // Only apply config properties that match this signal type
    const { type, ...rest } = config;
    this.config = { ...this.config, ...rest } as BeatConfig;
  }

  dispose(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }
}
