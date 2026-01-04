import { GamepadSignalType, GamepadConfig } from '../types';

const DEFAULT_CONFIG: GamepadConfig = {
  type: 'gamepad',
  gamepadIndex: -1,
  inputType: 'axis',
  inputIndex: -1,
  invert: false,
  deadzone: 0.1,
};

// Threshold for detecting input during learn mode
const LEARN_THRESHOLD = 0.5;

export class GamepadSignal implements GamepadSignalType {
  type: 'gamepad' = 'gamepad';
  name: string;

  private config: GamepadConfig;
  private currentValue: number = 0;
  private _isListening: boolean = false;
  private _isLearned: boolean = false;
  private onLearnCallback: (() => void) | null = null;

  constructor(public id: string, config?: Partial<GamepadConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.name = `Gamepad ${id.split('-')[1]}`;
  }

  async init(): Promise<void> {
    // Gamepad API doesn't require permission, just poll in update()
    // Connection events are optional - we detect gamepads during polling
  }

  update(_time: number, _deltaTime: number): void {
    const gamepads = navigator.getGamepads();

    // Learning mode - scan all gamepads for input
    if (this._isListening) {
      for (let gpIndex = 0; gpIndex < gamepads.length; gpIndex++) {
        const gp = gamepads[gpIndex];
        if (!gp) continue;

        // Check axes
        for (let axisIndex = 0; axisIndex < gp.axes.length; axisIndex++) {
          const value = gp.axes[axisIndex];
          if (Math.abs(value) > LEARN_THRESHOLD) {
            this.config.gamepadIndex = gpIndex;
            this.config.inputType = 'axis';
            this.config.inputIndex = axisIndex;
            this._isListening = false;
            this._isLearned = true;
            this.name = `Axis ${axisIndex} (Gamepad ${gpIndex + 1})`;
            this.currentValue = this.normalizeAxis(value);
            this.onLearnCallback?.();
            return;
          }
        }

        // Check buttons
        for (let btnIndex = 0; btnIndex < gp.buttons.length; btnIndex++) {
          const button = gp.buttons[btnIndex];
          if (button.pressed || button.value > LEARN_THRESHOLD) {
            this.config.gamepadIndex = gpIndex;
            this.config.inputType = 'button';
            this.config.inputIndex = btnIndex;
            this._isListening = false;
            this._isLearned = true;
            this.name = `Button ${btnIndex} (Gamepad ${gpIndex + 1})`;
            this.currentValue = button.value;
            this.onLearnCallback?.();
            return;
          }
        }
      }
      return;
    }

    // Normal operation - only process if learned
    if (!this._isLearned) return;

    const gp = gamepads[this.config.gamepadIndex];
    if (!gp) {
      // Gamepad disconnected
      return;
    }

    if (this.config.inputType === 'axis') {
      const rawValue = gp.axes[this.config.inputIndex] ?? 0;
      this.currentValue = this.normalizeAxis(rawValue);
    } else {
      const button = gp.buttons[this.config.inputIndex];
      if (button) {
        this.currentValue = this.config.invert ? 1 - button.value : button.value;
      }
    }
  }

  private normalizeAxis(value: number): number {
    // Apply deadzone
    if (Math.abs(value) < this.config.deadzone) {
      return this.config.invert ? 1 : 0;
    }

    // Rescale after deadzone (so deadzone..1 maps to 0..1)
    const sign = Math.sign(value);
    const magnitude = (Math.abs(value) - this.config.deadzone) / (1 - this.config.deadzone);
    const rescaled = sign * magnitude;

    // Map -1..1 to 0..1
    let normalized = (rescaled + 1) / 2;

    // Apply invert
    if (this.config.invert) {
      normalized = 1 - normalized;
    }

    return normalized;
  }

  // Start listening for gamepad input to learn
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

  // Check if this signal has learned a gamepad input
  isLearned(): boolean {
    return this._isLearned;
  }

  // Clear the learned mapping
  clearLearning(): void {
    this._isLearned = false;
    this.config.gamepadIndex = -1;
    this.config.inputIndex = -1;
    this.currentValue = 0;
    this.name = `Gamepad ${this.id.split('-')[1]}`;
  }

  // Set learned state (for restoration from persistence)
  setLearned(learned: boolean): void {
    this._isLearned = learned;
    // Rebuild name if learned and config is valid
    if (learned && this.config.gamepadIndex >= 0 && this.config.inputIndex >= 0) {
      const inputTypeLabel = this.config.inputType === 'axis' ? 'Axis' : 'Button';
      this.name = `${inputTypeLabel} ${this.config.inputIndex} (Gamepad ${this.config.gamepadIndex + 1})`;
    }
  }

  getValue(): number {
    return this.currentValue;
  }

  getConfig(): GamepadConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<GamepadConfig>): void {
    // Only apply config properties that match this signal type
    const { type, ...rest } = config;
    this.config = { ...this.config, ...rest } as GamepadConfig;
  }

  dispose(): void {
    this._isListening = false;
    this.onLearnCallback = null;
  }
}
