import './SignalsPanel.css';
import { Component } from '../ui/Component';
import { RenderLoop } from '../core/RenderLoop';
import {
  signalManager,
  SignalManagerEvents,
  Signal,
  SignalType,
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

export interface SignalsPanelOptions {
  renderLoop: RenderLoop;
}

/**
 * Panel for managing signals (LFO, Microphone, Beat, MIDI).
 */
export class SignalsPanel extends Component {
  private renderLoop: RenderLoop;
  private signalItems: Map<string, SignalItem> = new Map();
  private listContainer!: HTMLElement;
  private expandedId: string | null = null;

  constructor(options: SignalsPanelOptions) {
    super();
    this.renderLoop = options.renderLoop;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'signals-panel';
    el.innerHTML = `
      <div class="signals-header">
        <div class="add-signal-buttons">
          <button data-type="lfo" title="Add LFO oscillator">+ LFO</button>
          <button data-type="microphone" title="Add Microphone input">+ Mic</button>
          <button data-type="beat" title="Add Beat detection">+ Beat</button>
          <button data-type="midi" title="Add MIDI input">+ MIDI</button>
          <button data-type="gamepad" title="Add Gamepad input">+ Gamepad</button>
        </div>
      </div>
      <div class="signals-list"></div>
    `;

    this.listContainer = el.querySelector('.signals-list')!;
    return el;
  }

  protected onMount(): void {
    // Add button handlers
    const buttons = this.element.querySelectorAll('[data-type]');
    for (const btn of buttons) {
      this.listen(btn, 'click', async () => {
        const type = btn.getAttribute('data-type') as SignalType;
        try {
          await signalManager.createSignal(type);
        } catch (error) {
          console.error(`Failed to create ${type} signal:`, error);
        }
      });
    }

    // Subscribe to signal manager events
    this.subscribe<SignalManagerEvents, 'signal:add'>(signalManager, 'signal:add', (data) => {
      const { signal } = data as SignalManagerEvents['signal:add'];
      this.addSignalItem(signal);
    });
    this.subscribe<SignalManagerEvents, 'signal:remove'>(signalManager, 'signal:remove', (data) => {
      const { signalId } = data as SignalManagerEvents['signal:remove'];
      this.removeSignalItem(signalId);
    });

    // Build initial list
    const signals = signalManager.getAllSignals();
    if (signals.length === 0) {
      this.showEmptyState();
    } else {
      for (const signal of signals) {
        this.addSignalItem(signal);
      }
    }
  }

  private showEmptyState(): void {
    this.listContainer.innerHTML = '<div class="signals-empty">No signals. Add one above.</div>';
  }

  private clearEmptyState(): void {
    const empty = this.listContainer.querySelector('.signals-empty');
    if (empty) empty.remove();
  }

  private addSignalItem(signal: Signal): void {
    this.clearEmptyState();

    const item = new SignalItem({
      signal,
      renderLoop: this.renderLoop,
      expanded: this.expandedId === signal.id,
      onToggleExpand: () => {
        this.expandedId = this.expandedId === signal.id ? null : signal.id;
        // Update all items' expanded state
        for (const [id, signalItem] of this.signalItems) {
          signalItem.setExpanded(id === this.expandedId);
        }
      },
      onRemove: () => {
        signalManager.removeSignal(signal.id);
      },
      onConfigChange: (config) => {
        signal.setConfig(config);
        appStateManager.saveState();
      },
    });

    item.mount(this.listContainer);
    this.signalItems.set(signal.id, item);
  }

  private removeSignalItem(signalId: string): void {
    const item = this.signalItems.get(signalId);
    if (item) {
      item.dispose();
      this.signalItems.delete(signalId);
    }

    if (this.signalItems.size === 0) {
      this.showEmptyState();
    }
  }

  protected onDispose(): void {
    for (const item of this.signalItems.values()) {
      item.dispose();
    }
    this.signalItems.clear();
  }
}

interface SignalItemOptions {
  signal: Signal;
  renderLoop: RenderLoop;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onConfigChange: (config: Partial<LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig | GamepadConfig>) => void;
}

/**
 * Individual signal item in the list.
 */
class SignalItem extends Component {
  private signal: Signal;
  private renderLoop: RenderLoop;
  private expanded: boolean;
  private onToggleExpand: () => void;
  private onRemove: () => void;
  private onConfigChange: (config: Partial<LFOConfig | MicrophoneConfig | BeatConfig | MIDIConfig | GamepadConfig>) => void;

  private valueFill!: HTMLElement;
  private bindingCountEl!: HTMLElement;
  private configContainer!: HTMLElement;
  private configSliders: Slider[] = [];

  constructor(options: SignalItemOptions) {
    super();
    this.signal = options.signal;
    this.renderLoop = options.renderLoop;
    this.expanded = options.expanded;
    this.onToggleExpand = options.onToggleExpand;
    this.onRemove = options.onRemove;
    this.onConfigChange = options.onConfigChange;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = `signal-item signal-type-${this.signal.type}`;

    const bindingCount = signalManager.getBindingsForSignal(this.signal.id).length;

    el.innerHTML = `
      <div class="signal-header">
        <div class="signal-info">
          <span class="signal-type-badge">${this.signal.type.toUpperCase()}</span>
          <span class="signal-name">${this.signal.name}</span>
          <span class="signal-binding-count" style="${bindingCount > 0 ? '' : 'display:none'}">${bindingCount} bound</span>
        </div>
        <div class="signal-value-bar">
          <div class="signal-value-fill"></div>
        </div>
        <button class="signal-remove">x</button>
      </div>
      <div class="signal-config" style="${this.expanded ? '' : 'display:none'}"></div>
    `;

    this.valueFill = el.querySelector('.signal-value-fill')!;
    this.bindingCountEl = el.querySelector('.signal-binding-count')!;
    this.configContainer = el.querySelector('.signal-config')!;

    return el;
  }

  protected onMount(): void {
    // Header click to expand/collapse
    const header = this.element.querySelector('.signal-header')!;
    this.listen(header, 'click', (e) => {
      // Don't toggle if clicking remove button
      if ((e.target as HTMLElement).classList.contains('signal-remove')) return;
      this.onToggleExpand();
    });

    // Remove button
    const removeBtn = this.element.querySelector('.signal-remove')!;
    this.listen(removeBtn, 'click', (e) => {
      e.stopPropagation();
      this.onRemove();
    });

    // Register for frame updates
    const unregister = this.renderLoop.registerUIUpdate(() => {
      this.updateValueDisplay();
    });
    this.onCleanup(unregister);

    // Build config if expanded
    if (this.expanded) {
      this.buildConfig();
    }
  }

  private updateValueDisplay(): void {
    const value = this.signal.getValue();
    this.valueFill.style.width = `${value * 100}%`;

    const bindingCount = signalManager.getBindingsForSignal(this.signal.id).length;
    this.bindingCountEl.textContent = `${bindingCount} bound`;
    this.bindingCountEl.style.display = bindingCount > 0 ? '' : 'none';
  }

  setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    this.configContainer.style.display = expanded ? '' : 'none';

    if (expanded && this.configContainer.children.length === 0) {
      this.buildConfig();
    }
  }

  private buildConfig(): void {
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

  private buildLFOConfig(): void {
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
    const config = this.signal.getConfig() as MicrophoneConfig;

    this.addConfigSlider('Smoothing', config.smoothing, 0, 0.99, 0.01, (v) => {
      this.onConfigChange({ smoothing: v });
    });

    this.addConfigSlider('Gain', config.gain, 0.1, 5, 0.1, (v) => {
      this.onConfigChange({ gain: v });
    }, 1);

    this.addConfigSlider('Noise Floor', config.noiseFloor, 0, 0.2, 0.01, (v) => {
      this.onConfigChange({ noiseFloor: v });
    });
  }

  private buildBeatConfig(): void {
    const config = this.signal.getConfig() as BeatConfig;

    this.addConfigSlider('Sensitivity', config.sensitivity, 0.1, 2, 0.1, (v) => {
      this.onConfigChange({ sensitivity: v });
    }, 1);

    this.addConfigSlider('Decay', config.decay, 0.05, 1, 0.01, (v) => {
      this.onConfigChange({ decay: v });
    });

    this.addConfigSlider('Min Interval', config.minInterval, 50, 500, 10, (v) => {
      this.onConfigChange({ minInterval: v });
    }, 0);
  }

  private buildMIDIConfig(): void {
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
