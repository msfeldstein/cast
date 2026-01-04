import './Slider.css';
import { Component } from '../ui/Component';

export interface SliderOptions {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
  onChange: (value: number) => void;
  onContextMenu?: (e: MouseEvent) => void;
}

/**
 * A draggable slider control with optional signal binding display.
 */
export class Slider extends Component {
  private trackEl!: HTMLElement;
  private fillEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private valueEl!: HTMLElement;

  private label: string;
  private value: number;
  private min: number;
  private max: number;
  private step: number;
  private decimals: number;
  private onChange: (value: number) => void;
  private onContextMenuHandler?: (e: MouseEvent) => void;

  private isDragging = false;
  private isBound = false;
  private boundSignalName?: string;

  constructor(options: SliderOptions) {
    super();
    this.label = options.label;
    this.value = options.value;
    this.min = options.min;
    this.max = options.max;
    this.step = options.step ?? 0.01;
    this.decimals = options.decimals ?? 2;
    this.onChange = options.onChange;
    this.onContextMenuHandler = options.onContextMenu;

    // Ensure element is created before updating display
    this.ensureElement();
    this.updateDisplay();
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'slider';
    el.innerHTML = `
      <div class="slider-fill"></div>
      <div class="slider-label"></div>
      <div class="slider-value"></div>
    `;

    this.trackEl = el;
    this.fillEl = el.querySelector('.slider-fill')!;
    this.labelEl = el.querySelector('.slider-label')!;
    this.valueEl = el.querySelector('.slider-value')!;

    return el;
  }

  protected onMount(): void {
    this.listen(this.element, 'mousedown', this.handleMouseDown.bind(this));
    this.listen(this.element, 'contextmenu', this.handleContextMenu.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    // Only respond to left-click (button 0)
    if (e.button !== 0) return;
    if (this.isBound) return;
    e.preventDefault();
    this.isDragging = true;
    this.element.classList.add('dragging');
    this.updateFromMouse(e.clientX);

    const handleMove = (e: MouseEvent) => {
      if (this.isDragging) {
        this.updateFromMouse(e.clientX);
      }
    };

    const handleUp = () => {
      this.isDragging = false;
      this.element.classList.remove('dragging');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    this.onContextMenuHandler?.(e);
  }

  private updateFromMouse(clientX: number): void {
    const rect = this.trackEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newValue = this.min + ratio * (this.max - this.min);

    // Snap to step
    newValue = Math.round(newValue / this.step) * this.step;
    // Clamp to range
    newValue = Math.max(this.min, Math.min(this.max, newValue));

    if (newValue !== this.value) {
      this.value = newValue;
      this.updateDisplay();
      this.onChange(newValue);
    }
  }

  private updateDisplay(): void {
    const percent = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.fillEl.style.width = `${percent}%`;

    // Format value
    const displayValue =
      Number.isInteger(this.step) && this.step >= 1
        ? this.value.toFixed(0)
        : this.value.toFixed(this.decimals);
    this.valueEl.textContent = displayValue;

    // Update label with binding indicator
    if (this.isBound && this.boundSignalName) {
      this.labelEl.innerHTML = `${this.label}<span class="slider-binding-indicator" title="Bound to ${this.boundSignalName}"> ~ ${this.boundSignalName}</span>`;
    } else {
      this.labelEl.textContent = this.label;
    }
  }

  /**
   * Set the slider value (from external source like signal).
   */
  setValue(value: number): void {
    this.value = Math.max(this.min, Math.min(this.max, value));
    this.updateDisplay();
  }

  /**
   * Get the current value.
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Set bound state and signal name.
   */
  setBound(bound: boolean, signalName?: string): void {
    this.isBound = bound;
    this.boundSignalName = signalName;
    this.element.classList.toggle('bound', bound);
    this.updateDisplay();
  }

  /**
   * Check if slider is bound to a signal.
   */
  getIsBound(): boolean {
    return this.isBound;
  }

  /**
   * Update slider configuration.
   */
  setConfig(config: { min?: number; max?: number; step?: number; decimals?: number }): void {
    if (config.min !== undefined) this.min = config.min;
    if (config.max !== undefined) this.max = config.max;
    if (config.step !== undefined) this.step = config.step;
    if (config.decimals !== undefined) this.decimals = config.decimals;
    this.updateDisplay();
  }
}
