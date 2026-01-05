import './LayerPanel.css';
import { Component } from '../ui/Component';
import { Layer, BlendMode, LayerEvents } from '../core/Layer';
import { RenderLoop } from '../core/RenderLoop';
import { ControlDefinition } from '../types/sketch';
import { Effect } from '../types/effect';
import { effects } from '../effects';
import { signalManager, SignalManagerEvents } from '../signals/SignalManager';
import { ControlTarget } from '../signals/types';
import { appStateManager } from '../persistence';
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
  private effectsContainer!: HTMLElement;
  private controlSliders: Map<string, Slider> = new Map();
  private effectSliders: Map<string, Map<string, Slider>> = new Map(); // effectId -> controlName -> Slider

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
          </label>
          <div class="blend-select">
            <select></select>
          </div>
          <div class="opacity-slider-container"></div>
        </div>
      </div>
      <div class="sketch-controls"></div>
      <div class="effects-section">
        <div class="effects-header">
          <span class="effects-title">Effects</span>
          <button class="add-effect-btn" title="Add Effect">+</button>
        </div>
        <div class="effects-list"></div>
      </div>
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
    this.effectsContainer = el.querySelector('.effects-list')!;

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
      decimals: 2,
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

    // Add effect button
    const addEffectBtn = this.element.querySelector('.add-effect-btn')!;
    this.listen(addEffectBtn, 'click', (e) => {
      this.showAddEffectMenu(e as MouseEvent);
    });

    // Drag and drop (only on preview area)
    const previewArea = this.element.querySelector('.layer-preview')!;
    this.listen(previewArea, 'dragover', this.handleDragOver.bind(this));
    this.listen(previewArea, 'dragleave', this.handleDragLeave.bind(this));
    this.listen(previewArea, 'drop', this.handleDrop.bind(this));

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

    // Subscribe to effect events
    this.subscribe<LayerEvents, 'effect:add'>(this.layer, 'effect:add', () => {
      this.rebuildEffectsUI();
    });
    this.subscribe<LayerEvents, 'effect:remove'>(this.layer, 'effect:remove', () => {
      this.rebuildEffectsUI();
    });
    this.subscribe<LayerEvents, 'effects:reorder'>(this.layer, 'effects:reorder', () => {
      this.rebuildEffectsUI();
    });

    // Subscribe to signal binding changes
    this.subscribe<SignalManagerEvents, 'binding:add'>(signalManager, 'binding:add', (data) => {
      const { binding } = data as SignalManagerEvents['binding:add'];
      if (binding.layerId === this.layer.id) {
        if (binding.effectId) {
          this.updateEffectControlBinding(binding.effectId, binding.controlName);
        } else {
          this.updateControlBinding(binding.controlName);
        }
      }
    });
    this.subscribe<SignalManagerEvents, 'binding:remove'>(signalManager, 'binding:remove', (data) => {
      const { layerId, controlName, effectId } = data as SignalManagerEvents['binding:remove'];
      if (layerId === this.layer.id) {
        if (effectId) {
          this.updateEffectControlBinding(effectId, controlName);
        } else {
          this.updateControlBinding(controlName);
        }
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

    // Build initial effects UI
    this.rebuildEffectsUI();
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
    // Update sketch controls
    if (this.layer.sketch) {
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

    // Update effect controls
    for (const effect of this.layer.effects) {
      const effectSlidersMap = this.effectSliders.get(effect.id);
      if (!effectSlidersMap) continue;

      for (const control of effect.controls) {
        if (control.type === 'float' || control.type === 'integer') {
          const binding = signalManager.getBinding(this.layer.id, control.name, effect.id);
          if (binding) {
            const mappedValue = signalManager.getMappedValue(
              this.layer.id,
              control.name,
              control.min,
              control.max,
              effect.id
            );
            if (mappedValue !== undefined) {
              const slider = effectSlidersMap.get(control.name);
              if (slider) {
                slider.setValue(mappedValue);
              }
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
    const previewArea = this.element.querySelector('.layer-preview')!;
    if (!this.isDragOver) {
      this.isDragOver = true;
      previewArea.classList.add('drag-over');
    }
  }

  private handleDragLeave(): void {
    this.isDragOver = false;
    const previewArea = this.element.querySelector('.layer-preview')!;
    previewArea.classList.remove('drag-over');
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    const previewArea = this.element.querySelector('.layer-preview')!;
    previewArea.classList.remove('drag-over');

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

    // Collapsible header with sketch name
    const header = document.createElement('div');
    header.className = 'sketch-controls-header';
    header.innerHTML = `
      <span class="sketch-controls-toggle">▼</span>
      <span class="sketch-controls-name">${sketch.name}</span>
    `;
    this.sketchControlsContainer.appendChild(header);

    // Controls container (collapsible)
    const controlsBody = document.createElement('div');
    controlsBody.className = 'sketch-controls-body';
    this.sketchControlsContainer.appendChild(controlsBody);

    // Toggle collapse on header click
    header.addEventListener('click', () => {
      const isCollapsed = this.sketchControlsContainer.classList.toggle('collapsed');
      const toggle = header.querySelector('.sketch-controls-toggle')!;
      toggle.textContent = isCollapsed ? '▶' : '▼';
    });

    // Create controls inside body
    for (const control of sketch.controls) {
      this.createControl(control, controlsBody);
    }
  }

  private createControl(control: ControlDefinition, container: HTMLElement): void {
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
            appStateManager.saveState();
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
        slider.mount(container);
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
          appStateManager.saveState();
        });
        container.appendChild(colorDiv);
        break;
      }

      case 'trigger': {
        const button = document.createElement('button');
        button.className = 'trigger-button';
        button.textContent = control.label;
        button.addEventListener('mousedown', () => {
          this.layer.sketch?.setControl(control.name, true);
        });
        container.appendChild(button);
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

  // ===== Effects UI =====

  private showAddEffectMenu(e: MouseEvent): void {
    const menuItems = effects.map((factory) => ({
      label: factory.name,
      action: async () => {
        const effect = factory.create();
        await this.layer.addEffect(effect);
      },
    }));

    // Create a simple dropdown menu
    const menu = document.createElement('div');
    menu.className = 'effect-menu';
    menu.style.cssText = `
      position: fixed;
      background: #2a2a2a;
      border: 1px solid #444;
      z-index: 10000;
      min-width: 150px;
      max-height: 300px;
      overflow-y: auto;
    `;

    // Position will be set after measuring

    for (const item of menuItems) {
      const menuItem = document.createElement('div');
      menuItem.className = 'effect-menu-item';
      menuItem.textContent = item.label;
      menuItem.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        color: #ccc;
      `;
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#3a3a3a';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      menuItem.addEventListener('click', () => {
        item.action();
        menu.remove();
      });
      menu.appendChild(menuItem);
    }

    document.body.appendChild(menu);

    // Position menu, avoiding overflow
    const menuRect = menu.getBoundingClientRect();
    let left = e.clientX;
    let top = e.clientY;

    // Check right edge
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 8;
    }
    // Check bottom edge
    if (top + menuRect.height > window.innerHeight) {
      top = window.innerHeight - menuRect.height - 8;
    }
    // Ensure not off left/top
    left = Math.max(8, left);
    top = Math.max(8, top);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    // Close on click outside
    const closeHandler = (evt: MouseEvent) => {
      if (!menu.contains(evt.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  private rebuildEffectsUI(): void {
    this.clearEffectsUI();

    this.layer.effects.forEach((effect, index) => {
      this.createEffectUI(effect, index);
    });
  }

  private createEffectUI(effect: Effect, index: number): void {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'effect-item';
    effectDiv.dataset.effectId = effect.id;
    effectDiv.dataset.effectIndex = String(index);
    effectDiv.draggable = true;

    // Header with drag handle, toggle, name, enable checkbox, and remove button
    const header = document.createElement('div');
    header.className = 'effect-header';
    header.innerHTML = `
      <span class="effect-drag-handle" title="Drag to reorder">⋮⋮</span>
      <span class="effect-toggle">▼</span>
      <span class="effect-name">${effect.name}</span>
      <label class="effect-enable" title="Enable/Disable">
        <input type="checkbox" ${effect.enabled ? 'checked' : ''}>
      </label>
      <button class="effect-remove" title="Remove Effect">×</button>
    `;
    effectDiv.appendChild(header);

    // Drag and drop handlers
    effectDiv.addEventListener('dragstart', (e) => {
      effectDiv.classList.add('dragging');
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(index));
    });

    effectDiv.addEventListener('dragend', () => {
      effectDiv.classList.remove('dragging');
      // Remove any remaining drag-over states
      this.effectsContainer.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
    });

    effectDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingEl = this.effectsContainer.querySelector('.dragging');
      if (!draggingEl || draggingEl === effectDiv) return;

      const rect = effectDiv.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // Clear previous states
      effectDiv.classList.remove('drag-over-above', 'drag-over-below');

      if (e.clientY < midY) {
        effectDiv.classList.add('drag-over-above');
      } else {
        effectDiv.classList.add('drag-over-below');
      }
    });

    effectDiv.addEventListener('dragleave', () => {
      effectDiv.classList.remove('drag-over-above', 'drag-over-below');
    });

    effectDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      effectDiv.classList.remove('drag-over-above', 'drag-over-below');

      const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'), 10);
      const toIndex = parseInt(effectDiv.dataset.effectIndex!, 10);

      if (fromIndex === toIndex) return;

      const rect = effectDiv.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // Determine final position based on drop location
      let finalIndex = toIndex;
      if (e.clientY >= midY && fromIndex < toIndex) {
        // Dropping below, and moving down - stay at toIndex
      } else if (e.clientY < midY && fromIndex > toIndex) {
        // Dropping above, and moving up - stay at toIndex
      } else if (e.clientY >= midY) {
        finalIndex = toIndex + 1;
      }

      // Adjust for the removal of the dragged item
      if (fromIndex < finalIndex) {
        finalIndex--;
      }

      this.layer.moveEffect(fromIndex, finalIndex);
    });

    // Controls body
    const controlsBody = document.createElement('div');
    controlsBody.className = 'effect-controls-body';
    effectDiv.appendChild(controlsBody);

    // Toggle collapse
    const toggle = header.querySelector('.effect-toggle')!;
    header.addEventListener('click', (e) => {
      // Don't toggle when clicking checkbox or remove button
      if ((e.target as HTMLElement).closest('.effect-enable, .effect-remove')) return;

      const isCollapsed = effectDiv.classList.toggle('collapsed');
      toggle.textContent = isCollapsed ? '▶' : '▼';
    });

    // Enable checkbox
    const enableCheckbox = header.querySelector('.effect-enable input') as HTMLInputElement;
    enableCheckbox.addEventListener('change', () => {
      effect.enabled = enableCheckbox.checked;
      appStateManager.saveState();
    });

    // Remove button
    const removeBtn = header.querySelector('.effect-remove')!;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.layer.removeEffect(effect.id);
    });

    // Create controls
    const slidersMap = new Map<string, Slider>();
    this.effectSliders.set(effect.id, slidersMap);

    for (const control of effect.controls) {
      const binding = signalManager.getBinding(this.layer.id, control.name, effect.id);
      const boundSignal = binding ? signalManager.getSignal(binding.signalId) : null;

      switch (control.type) {
        case 'float':
        case 'integer': {
          const slider = new Slider({
            label: control.label,
            value: (effect.getControl(control.name) as number) ?? control.defaultValue,
            min: control.min,
            max: control.max,
            step: control.type === 'integer' ? 1 : (control.step ?? 0.01),
            decimals: control.type === 'integer' ? 0 : 2,
            onChange: (v) => {
              effect.setControl(control.name, v);
              appStateManager.saveState();
            },
            onContextMenu: (ev) => {
              this.showControlContextMenu(ev, {
                layerId: this.layer.id,
                controlName: control.name,
                min: control.min,
                max: control.max,
                effectId: effect.id,
              });
            },
          });
          slider.setBound(!!boundSignal, boundSignal?.name);
          slider.mount(controlsBody);
          slidersMap.set(control.name, slider);
          break;
        }

        case 'color': {
          const colorDiv = document.createElement('div');
          colorDiv.className = 'sketch-control color-control';
          colorDiv.innerHTML = `
            <label>${control.label}</label>
            <input type="color" value="${(effect.getControl(control.name) as string) ?? control.defaultValue}">
          `;
          const input = colorDiv.querySelector('input')!;
          input.addEventListener('change', () => {
            effect.setControl(control.name, input.value);
            appStateManager.saveState();
          });
          controlsBody.appendChild(colorDiv);
          break;
        }
      }
    }

    this.effectsContainer.appendChild(effectDiv);
  }

  private updateEffectControlBinding(effectId: string, controlName: string): void {
    const slidersMap = this.effectSliders.get(effectId);
    if (!slidersMap) return;

    const slider = slidersMap.get(controlName);
    if (!slider) return;

    const binding = signalManager.getBinding(this.layer.id, controlName, effectId);
    const boundSignal = binding ? signalManager.getSignal(binding.signalId) : null;
    slider.setBound(!!boundSignal, boundSignal?.name);
  }

  private clearEffectsUI(): void {
    // Dispose all effect sliders
    for (const slidersMap of this.effectSliders.values()) {
      for (const slider of slidersMap.values()) {
        slider.dispose();
      }
    }
    this.effectSliders.clear();

    // Clear container
    this.effectsContainer.innerHTML = '';
  }

  protected onDispose(): void {
    this.opacitySlider.dispose();
    this.clearSketchControls();
    this.clearEffectsUI();
  }
}
