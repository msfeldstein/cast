import { Signal, MicrophoneConfig } from '../types';

const DEFAULT_CONFIG: MicrophoneConfig = {
  type: 'microphone',
  smoothing: 0.8,
  gain: 1.0,
  noiseFloor: 0.01,
};

export class MicrophoneSignal implements Signal {
  type: 'microphone' = 'microphone';
  name: string;

  private config: MicrophoneConfig;
  private currentValue: number = 0;
  private smoothedValue: number = 0;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;

  constructor(public id: string, config?: Partial<MicrophoneConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.name = `Mic ${id.split('-')[1]}`;
  }

  async init(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (error) {
      console.error('Failed to initialize microphone:', error);
      throw error;
    }
  }

  update(_time: number, _deltaTime: number): void {
    if (!this.analyser || !this.dataArray) {
      this.currentValue = 0;
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate RMS (root mean square) for loudness
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = this.dataArray[i] / 255;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);

    // Apply gain
    let value = rms * this.config.gain;

    // Apply noise floor
    if (value < this.config.noiseFloor) {
      value = 0;
    }

    // Clamp to 0-1
    value = Math.min(1, value);

    // Apply smoothing
    this.smoothedValue =
      this.smoothedValue * this.config.smoothing +
      value * (1 - this.config.smoothing);

    this.currentValue = this.smoothedValue;
  }

  getValue(): number {
    return this.currentValue;
  }

  getConfig(): MicrophoneConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<MicrophoneConfig>): void {
    this.config = { ...this.config, ...config };
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
