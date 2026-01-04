import './LayerPanel.css';
import { Component } from '../ui/Component';
import { Layer, BlendMode, LayerEvents } from '../core/Layer';
import { RenderLoop } from '../core/RenderLoop';
import { ControlDefinition } from '../types/sketch';
import { signalManager, SignalManagerEvents } from '../signals/SignalManager';
import { ControlTarget } from '../signals/types';
import { Slider } from './Slider';
import { showContextMenu } from './ContextMenu';

const BLEND_MODES: BlendMode[] = ['normal', 'additive', 'multiply', 'screen', 'overlay'];

export interface LayerPanelOptions {
  layer: Layer;
  renderLoop: RenderLoop;
  onDrop?: (factoryId: string) => void;
}

/**
 * Panel for controlling a single layer.
 * Displays preview canvas, visibility/blend/opacity controls, and sketch controls.
 */
export class LayerPanel extends Component {
  private layer: Layer;
  private renderLoop: RenderLoop;
  private onDropCallback?: (factoryId: string) => void;

  private previewCanvas!: HTMLCanvasElement;
  private previewCtx!: CanvasRenderingContext2D;
  private emptyLabel!: HTMLElement;
  private visibilityCheckbox!: HTMLInputElement;
  private blendSelect!: HTMLSelectElement;
  private opacitySlider!: Slider;
  private sketchControlsContainer!: HTMLElement;
  private controlSliders: Map<string, Slider> = new Map();

  private isDragOver = false;
  private canvasSize = { width: 320, height: 180 };

  constructor(options: LayerPanelOptions) {
    super();
    this.layer = options.layer;
    this.renderLoop = options.renderLoop;
    this.onDropCallback = options.onDrop;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'layer-panel';
    el.innerHTML = `
      <div class="layer-preview">
        <canvas class="layer-preview-canvas"></canvas>
        <span class="layer-preview-empty">Drop sketch here</span>
      </div>
      <div class="layer-controls">
        <div class="layer-controls-row">
          <label class="layer-visibility">
            <input type="checkbox" checked>
            Visible
          </label>
          <div class="blend-select">
            <select></select>
          </div>
        </div>
        <div class="opacity-slider-container"></div>
      </div>
      <div class="sketch-controls"></div>
    `;

    // Cache element references
    this.previewCanvas = el.querySelector('.layer-preview-canvas')!;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this.emptyLabel = el.querySelector('.layer-preview-empty')!;

    // Set initial canvas dimensions to avoid huge default sizes
    this.previewCanvas.width = this.canvasSize.width;
    this.previewCanvas.height = this.canvasSize.height;
    this.visibilityCheckbox = el.querySelector('input[type="checkbox"]')!;
    this.blendSelect = el.querySelector('select')!;
    this.sketchControlsContainer = el.querySelector('.sketch-controls')!;

    // Populate blend mode select
    for (const mode of BLEND_MODES) {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      this.blendSelect.appendChild(option);
    }

    // Set initial values
    this.visibilityCheckbox.checked = this.layer.visible;
    this.blendSelect.value = this.layer.blendMode;

    // Create opacity slider
    const opacityContainer = el.querySelector('.opacity-slider-container')!;
    this.opacitySlider = new Slider({
      label: 'Opacity',
      value: this.layer.opacity,
      min: 0,
      max: 1,
      step: 0.01,
      decimals: 0,
      onChange: (v) => {
        this.layer.opacity = v;
      },
    });
    this.opacitySlider.mount(opacityContainer as HTMLElement);

    // Set preview canvas aspect ratio
    this.previewCanvas.style.aspectRatio = `${this.layer.width} / ${this.layer.height}`;

    return el;
  }

  protected onMount(): void {
    // DOM event listeners
    this.listen(this.visibilityCheckbox, 'change', () => {
      this.layer.visible = this.visibilityCheckbox.checked;
    });

    this.listen(this.blendSelect, 'change', () => {
      this.layer.blendMode = this.blendSelect.value as BlendMode;
    });

    // Drag and drop
    this.listen(this.element, 'dragover', this.handleDragOver.bind(this));
    this.listen(this.element, 'dragleave', this.handleDragLeave.bind(this));
    this.listen(this.element, 'drop', this.handleDrop.bind(this));

    // Subscribe to layer events
    this.subscribe<LayerEvents, 'property:change'>(this.layer, 'property:change', (e) => {
      const event = e as LayerEvents['property:change'];
      this.handlePropertyChange(event.property, event.value);
    });
    this.subscribe<LayerEvents, 'sketch:load'>(this.layer, 'sketch:load', () => {
      this.rebuildSketchControls();
      this.updateEmptyState();
    });
    this.subscribe<LayerEvents, 'sketch:unload'>(this.layer, 'sketch:unload', () => {
      this.clearSketchControls();
      this.updateEmptyState();
    });

    // Subscribe to signal binding changes
    this.subscribe<SignalManagerEvents, 'binding:add'>(signalManager, 'binding:add', (data) => {
      const { binding } = data as SignalManagerEvents['binding:add'];
      if (binding.layerId === this.layer.id) {
        this.updateControlBinding(binding.controlName);
      }
    });
    this.subscribe<SignalManagerEvents, 'binding:remove'>(signalManager, 'binding:remove', (data) => {
      const { layerId, controlName } = data as SignalManagerEvents['binding:remove'];
      if (layerId === this.layer.id) {
        this.updateControlBinding(controlName);
      }
    });

    // Register for frame updates (preview canvas)
    const unregister = this.renderLoop.registerUIUpdate(() => {
      this.updatePreview();
      this.updateBoundControls();
    });
    this.onCleanup(unregister);

    // Setup resize observer for preview canvas
    this.setupCanvasResizeObserver();

    // Build initial sketch controls if sketch exists
    if (this.layer.sketch) {
      this.rebuildSketchControls();
    }
    this.updateEmptyState();
  }

  private setupCanvasResizeObserver(): void {
    const dpr = window.devicePixelRatio || 1;
    const previewContainer = this.previewCanvas.parentElement!;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Sanity check - skip if dimensions are invalid
        if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
          return;
        }
        this.canvasSize = {
          width: Math.floor(width * dpr),
          height: Math.floor(height * dpr),
        };
        this.previewCanvas.width = this.canvasSize.width;
        this.previewCanvas.height = this.canvasSize.height;
      }
    });

    // Observe the container, not the canvas itself
    resizeObserver.observe(previewContainer);
    this.onCleanup(() => resizeObserver.disconnect());
  }

  private updatePreview(): void {
    const ctx = this.previewCtx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (this.layer.sketch && this.layer.canvas) {
      ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      ctx.drawImage(
        this.layer.canvas,
        0, 0, this.layer.canvas.width, this.layer.canvas.height,
        0, 0, this.previewCanvas.width, this.previewCanvas.height
      );
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }
  }

  private updateBoundControls(): void {
    if (!this.layer.sketch) return;

    for (const control of this.layer.sketch.controls) {
      if (control.type === 'float' || control.type === 'integer') {
        const binding = signalManager.getBinding(this.layer.id, control.name);
        if (binding) {
          const mappedValue = signalManager.getMappedValue(
            this.layer.id,
            control.name,
            control.min,
            control.max
          );
          if (mappedValue !== undefined) {
            const slider = this.controlSliders.get(control.name);
            if (slider) {
              slider.setValue(mappedValue);
            }
          }
        }
      }
    }
  }

  private handlePropertyChange(
    property: 'opacity' | 'blendMode' | 'visible',
    value: number | BlendMode | boolean
  ): void {
    switch (property) {
      case 'opacity':
        this.opacitySlider.setValue(value as number);
        break;
      case 'blendMode':
        this.blendSelect.value = value as BlendMode;
        break;
      case 'visible':
        this.visibilityCheckbox.checked = value as boolean;
        break;
    }
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!this.isDragOver) {
      this.isDragOver = true;
      this.element.classList.add('drag-over');
    }
  }

  private handleDragLeave(): void {
    this.isDragOver = false;
    this.element.classList.remove('drag-over');
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    this.element.classList.remove('drag-over');

    const factoryId = e.dataTransfer?.getData('application/x-sketch-id');
    if (factoryId && this.onDropCallback) {
      this.onDropCallback(factoryId);
    }
  }

  private updateEmptyState(): void {
    this.emptyLabel.style.display = this.layer.sketch ? 'none' : 'block';
  }

  private rebuildSketchControls(): void {
    this.clearSketchControls();
    if (!this.layer.sketch) return;

    const sketch = this.layer.sketch;

    // Header with sketch name
    const header = document.createElement('div');
    header.className = 'sketch-controls-header';
    header.textContent = sketch.name;
    this.sketchControlsContainer.appendChild(header);

    // Create controls
    for (const control of sketch.controls) {
      this.createControl(control);
    }
  }

  private createControl(control: ControlDefinition): void {
    const binding = signalManager.getBinding(this.layer.id, control.name);
    const boundSignal = binding ? signalManager.getSignal(binding.signalId) : null;

    switch (control.type) {
      case 'float':
      case 'integer': {
        const slider = new Slider({
          label: control.label,
          value: (this.layer.sketch?.getControl(control.name) as number) ?? control.defaultValue,
          min: control.min,
          max: control.max,
          step: control.type === 'integer' ? 1 : (control.step ?? 0.01),
          decimals: control.type === 'integer' ? 0 : 2,
          onChange: (v) => {
            this.layer.sketch?.setControl(control.name, v);
          },
          onContextMenu: (e) => {
            this.showControlContextMenu(e, {
              layerId: this.layer.id,
              controlName: control.name,
              min: control.min,
              max: control.max,
            });
          },
        });
        slider.setBound(!!boundSignal, boundSignal?.name);
        slider.mount(this.sketchControlsContainer);
        this.controlSliders.set(control.name, slider);
        break;
      }

      case 'color': {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'sketch-control color-control';
        colorDiv.innerHTML = `
          <label>${control.label}</label>
          <input type="color" value="${(this.layer.sketch?.getControl(control.name) as string) ?? control.defaultValue}">
        `;
        const input = colorDiv.querySelector('input')!;
        input.addEventListener('change', () => {
          this.layer.sketch?.setControl(control.name, input.value);
        });
        this.sketchControlsContainer.appendChild(colorDiv);
        break;
      }

      case 'trigger': {
        const button = document.createElement('button');
        button.className = 'trigger-button';
        button.textContent = control.label;
        button.addEventListener('mousedown', () => {
          this.layer.sketch?.setControl(control.name, true);
        });
        this.sketchControlsContainer.appendChild(button);
        break;
      }
    }
  }

  private showControlContextMenu(e: MouseEvent, target: ControlTarget): void {
    showContextMenu({
      target,
      position: { x: e.clientX, y: e.clientY },
      onClose: () => {},
    });
  }

  private updateControlBinding(controlName: string): void {
    const slider = this.controlSliders.get(controlName);
    if (!slider) return;

    const binding = signalManager.getBinding(this.layer.id, controlName);
    const boundSignal = binding ? signalManager.getSignal(binding.signalId) : null;
    slider.setBound(!!boundSignal, boundSignal?.name);
  }

  private clearSketchControls(): void {
    // Dispose sliders
    for (const slider of this.controlSliders.values()) {
      slider.dispose();
    }
    this.controlSliders.clear();

    // Clear container
    this.sketchControlsContainer.innerHTML = '';
  }

  protected onDispose(): void {
    this.opacitySlider.dispose();
    this.clearSketchControls();
  }
}
