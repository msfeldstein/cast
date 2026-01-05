import './SignalPane.css';
import { Component } from '../ui/Component';
import { RenderLoop } from '../core/RenderLoop';
import {
  signalManager,
  Signal,
  LFOConfig,
  MicrophoneConfig,
  BeatConfig,
  MIDIConfig,
  MIDISignal,
  GamepadConfig,
  GamepadSignal,
} from '../signals';
import { appStateManager } from '../persistence';
import { Slider } from './Slider';

export interface SignalPaneOptions {
  signalId: string;
  renderLoop: RenderLoop;
}

/**
 * A pane that displays and controls a single signal.
 */
export class SignalPane extends Component {
  private signalId: string;
  private renderLoop: RenderLoop;
  private signal: Signal | undefined;
  private configSliders: Slider[] = [];
  private valueFill!: HTMLElement;
  private bindingCountEl!: HTMLElement;
  private configContainer!: HTMLElement;

  constructor(options: SignalPaneOptions) {
    super();
    this.signalId = options.signalId;
    this.renderLoop = options.renderLoop;
    this.signal = signalManager.getSignal(this.signalId);
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'signal-pane';

    if (!this.signal) {
      el.innerHTML = '<div class="signal-pane-error">Signal not found</div>';
      return el;
    }

    const bindingCount = signalManager.getBindingsForSignal(this.signalId).length;

    el.innerHTML = `
      <div class="signal-pane-header">
        <div class="signal-pane-value-bar">
          <div class="signal-pane-value-fill"></div>
        </div>
        <span class="signal-pane-binding-count" style="${bindingCount > 0 ? '' : 'display:none'}">${bindingCount} bound</span>
      </div>
      <div class="signal-pane-config"></div>
    `;

    this.valueFill = el.querySelector('.signal-pane-value-fill')!;
    this.bindingCountEl = el.querySelector('.signal-pane-binding-count')!;
    this.configContainer = el.querySelector('.signal-pane-config')!;

    return el;
  }

  protected onMount(): void {
    if (!this.signal) return;

    // Register for frame updates
    const unregister = this.renderLoop.registerUIUpdate(() => {
      this.updateValueDisplay();
    });
    this.onCleanup(unregister);

    // Build the config UI
    this.buildConfig();
  }

  private updateValueDisplay(): void {
    if (!this.signal) return;

    const value = this.signal.getValue();
    this.valueFill.style.width = `${value * 100}%`;

    const bindingCount = signalManager.getBindingsForSignal(this.signalId).length;
    this.bindingCountEl.textContent = `${bindingCount} bound`;
    this.bindingCountEl.style.display = bindingCount > 0 ? '' : 'none';
  }

  private buildConfig(): void {
    if (!this.signal) return;
    this.clearConfig();

    switch (this.signal.type) {
      case 'lfo':
        this.buildLFOConfig();
        break;
      case 'microphone':
        this.buildMicrophoneConfig();
        break;
      case 'beat':
        this.buildBeatConfig();
        break;
      case 'midi':
        this.buildMIDIConfig();
        break;
      case 'gamepad':
        this.buildGamepadConfig();
        break;
    }
  }

  private onConfigChange(
    config: Partial<LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig | GamepadConfig>
  ): void {
    if (this.signal) {
      this.signal.setConfig(config);
      appStateManager.saveState();
    }
  }

  private buildLFOConfig(): void {
    if (!this.signal) return;
    const config = this.signal.getConfig() as LFOConfig;

    // Waveform select
    const waveformRow = document.createElement('div');
    waveformRow.className = 'config-row';
    waveformRow.innerHTML = `
      <label>Waveform</label>
      <select>
        <option value="sine" ${config.waveform === 'sine' ? 'selected' : ''}>Sine</option>
        <option value="sawtooth" ${config.waveform === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
        <option value="square" ${config.waveform === 'square' ? 'selected' : ''}>Square</option>
        <option value="triangle" ${config.waveform === 'triangle' ? 'selected' : ''}>Triangle</option>
      </select>
    `;
    const select = waveformRow.querySelector('select')!;
    select.addEventListener('change', () => {
      this.onConfigChange({ waveform: select.value as LFOConfig['waveform'] });
    });
    this.configContainer.appendChild(waveformRow);

    // Frequency slider
    this.addConfigSlider('Frequency', config.frequency, 0.01, 10, 0.01, (v) => {
      this.onConfigChange({ frequency: v });
    });

    // Amplitude slider
    this.addConfigSlider('Amplitude', config.amplitude, 0, 1, 0.01, (v) => {
      this.onConfigChange({ amplitude: v });
    });

    // Offset slider
    this.addConfigSlider('Offset', config.offset, 0, 1, 0.01, (v) => {
      this.onConfigChange({ offset: v });
    });
  }

  private buildMicrophoneConfig(): void {
    if (!this.signal) return;
    const config = this.signal.getConfig() as MicrophoneConfig;

    this.addConfigSlider('Attack', config.attack, 0, 0.99, 0.01, (v) => {
      this.onConfigChange({ attack: v });
    });

    this.addConfigSlider('Release', config.release, 0, 0.99, 0.01, (v) => {
      this.onConfigChange({ release: v });
    });

    this.addConfigSlider(
      'Gain',
      config.gain,
      0.1,
      5,
      0.1,
      (v) => {
        this.onConfigChange({ gain: v });
      },
      1
    );

    this.addConfigSlider('Noise Floor', config.noiseFloor, 0, 0.2, 0.01, (v) => {
      this.onConfigChange({ noiseFloor: v });
    });
  }

  private buildBeatConfig(): void {
    if (!this.signal) return;
    const config = this.signal.getConfig() as BeatConfig;

    this.addConfigSlider(
      'Sensitivity',
      config.sensitivity,
      0.1,
      2,
      0.1,
      (v) => {
        this.onConfigChange({ sensitivity: v });
      },
      1
    );

    this.addConfigSlider('Decay', config.decay, 0.05, 1, 0.01, (v) => {
      this.onConfigChange({ decay: v });
    });

    this.addConfigSlider(
      'Min Interval',
      config.minInterval,
      50,
      500,
      10,
      (v) => {
        this.onConfigChange({ minInterval: v });
      },
      0
    );
  }

  private buildMIDIConfig(): void {
    if (!this.signal) return;
    const midiSignal = this.signal as MIDISignal;
    const config = this.signal.getConfig() as MIDIConfig;
    const isListening = midiSignal.isListening();
    const isLearned = midiSignal.isLearned();

    this.configContainer.innerHTML = '';

    if (isListening) {
      const learnContainer = document.createElement('div');
      learnContainer.className = 'midi-learn-container';
      learnContainer.innerHTML = `
        <div class="midi-learn-message">Move a knob, fader, or press a key...</div>
        <button class="midi-cancel-btn">Cancel</button>
      `;
      learnContainer.querySelector('.midi-cancel-btn')!.addEventListener('click', () => {
        midiSignal.stopListening();
        this.buildMIDIConfig();
      });
      this.configContainer.appendChild(learnContainer);
      return;
    }

    if (!isLearned) {
      const learnContainer = document.createElement('div');
      learnContainer.className = 'midi-learn-container';
      learnContainer.innerHTML = `
        <button class="midi-learn-btn">Learn MIDI</button>
        <div class="midi-learn-hint">Click to detect CC or Note</div>
      `;
      learnContainer.querySelector('.midi-learn-btn')!.addEventListener('click', () => {
        midiSignal.startListening(() => {
          appStateManager.saveState();
          this.buildMIDIConfig();
        });
        this.buildMIDIConfig();
      });
      this.configContainer.appendChild(learnContainer);
      return;
    }

    // Learned state
    const infoDiv = document.createElement('div');
    infoDiv.className = 'midi-learned-info';
    infoDiv.innerHTML = `
      <span class="midi-learned-label">${config.mode === 'cc' ? 'CC' : 'Note'} ${config.noteOrCC}</span>
      <span class="midi-learned-channel">Channel ${config.channel}</span>
    `;
    this.configContainer.appendChild(infoDiv);

    if (config.mode === 'note') {
      const velocityRow = document.createElement('div');
      velocityRow.className = 'config-row checkbox';
      velocityRow.innerHTML = `
        <label>
          <input type="checkbox" ${config.velocityMode ? 'checked' : ''}>
          Use Velocity
        </label>
      `;
      velocityRow.querySelector('input')!.addEventListener('change', (e) => {
        this.onConfigChange({ velocityMode: (e.target as HTMLInputElement).checked });
      });
      this.configContainer.appendChild(velocityRow);
    }

    const relearnBtn = document.createElement('button');
    relearnBtn.className = 'midi-relearn-btn';
    relearnBtn.textContent = 'Re-learn';
    relearnBtn.addEventListener('click', () => {
      midiSignal.clearLearning();
      midiSignal.startListening(() => {
        appStateManager.saveState();
        this.buildMIDIConfig();
      });
      this.buildMIDIConfig();
    });
    this.configContainer.appendChild(relearnBtn);
  }

  private buildGamepadConfig(): void {
    if (!this.signal) return;
    const gamepadSignal = this.signal as GamepadSignal;
    const config = this.signal.getConfig() as GamepadConfig;
    const isListening = gamepadSignal.isListening();
    const isLearned = gamepadSignal.isLearned();

    this.configContainer.innerHTML = '';

    if (isListening) {
      const learnContainer = document.createElement('div');
      learnContainer.className = 'gamepad-learn-container';
      learnContainer.innerHTML = `
        <div class="gamepad-learn-message">Move an axis or press a button...</div>
        <button class="gamepad-cancel-btn">Cancel</button>
      `;
      learnContainer.querySelector('.gamepad-cancel-btn')!.addEventListener('click', () => {
        gamepadSignal.stopListening();
        this.buildGamepadConfig();
      });
      this.configContainer.appendChild(learnContainer);
      return;
    }

    if (!isLearned) {
      const learnContainer = document.createElement('div');
      learnContainer.className = 'gamepad-learn-container';
      learnContainer.innerHTML = `
        <button class="gamepad-learn-btn">Learn Gamepad</button>
        <div class="gamepad-learn-hint">Click then move an axis or press a button</div>
      `;
      learnContainer.querySelector('.gamepad-learn-btn')!.addEventListener('click', () => {
        gamepadSignal.startListening(() => {
          appStateManager.saveState();
          this.buildGamepadConfig();
        });
        this.buildGamepadConfig();
      });
      this.configContainer.appendChild(learnContainer);
      return;
    }

    // Learned state
    const infoDiv = document.createElement('div');
    infoDiv.className = 'gamepad-learned-info';
    infoDiv.innerHTML = `
      <span class="gamepad-learned-label">${config.inputType === 'axis' ? 'Axis' : 'Button'} ${config.inputIndex}</span>
      <span class="gamepad-learned-device">Gamepad ${config.gamepadIndex + 1}</span>
    `;
    this.configContainer.appendChild(infoDiv);

    // Axis-specific controls
    if (config.inputType === 'axis') {
      // Deadzone slider
      this.addConfigSlider('Deadzone', config.deadzone, 0, 0.5, 0.01, (v) => {
        this.onConfigChange({ deadzone: v });
      });

      // Invert checkbox
      const invertRow = document.createElement('div');
      invertRow.className = 'config-row checkbox';
      invertRow.innerHTML = `
        <label>
          <input type="checkbox" ${config.invert ? 'checked' : ''}>
          Invert
        </label>
      `;
      invertRow.querySelector('input')!.addEventListener('change', (e) => {
        this.onConfigChange({ invert: (e.target as HTMLInputElement).checked });
      });
      this.configContainer.appendChild(invertRow);
    }

    const relearnBtn = document.createElement('button');
    relearnBtn.className = 'gamepad-relearn-btn';
    relearnBtn.textContent = 'Re-learn';
    relearnBtn.addEventListener('click', () => {
      gamepadSignal.clearLearning();
      gamepadSignal.startListening(() => {
        appStateManager.saveState();
        this.buildGamepadConfig();
      });
      this.buildGamepadConfig();
    });
    this.configContainer.appendChild(relearnBtn);
  }

  private addConfigSlider(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    decimals = 2
  ): void {
    const slider = new Slider({
      label,
      value,
      min,
      max,
      step,
      decimals,
      onChange,
    });
    slider.mount(this.configContainer);
    this.configSliders.push(slider);
  }

  private clearConfig(): void {
    for (const slider of this.configSliders) {
      slider.dispose();
    }
    this.configSliders = [];
    this.configContainer.innerHTML = '';
  }

  protected onDispose(): void {
    this.clearConfig();
  }
}
