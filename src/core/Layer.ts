import { Sketch } from '../types/sketch';
import { Effect } from '../types/effect';
import { EventEmitter } from '../ui/EventEmitter';

export type BlendMode = 'normal' | 'additive' | 'multiply' | 'screen' | 'overlay';

export interface LayerEvents {
  [key: string]: unknown;
  'property:change': {
    property: 'opacity' | 'blendMode' | 'visible';
    value: number | BlendMode | boolean;
  };
  'sketch:load': { sketch: Sketch };
  'sketch:unload': { sketchId: string };
  'effect:add': { effect: Effect; index: number };
  'effect:remove': { effectId: string; index: number };
  'effects:reorder': { effects: Effect[] };
}

export class Layer extends EventEmitter<LayerEvents> {
  public readonly canvas: OffscreenCanvas;
  public sketch: Sketch | null = null;
  public effects: Effect[] = [];

  private _opacity: number = 1.0;
  private _blendMode: BlendMode = 'normal';
  private _visible: boolean = true;
  private ctx2d: OffscreenCanvasRenderingContext2D | null = null;
  private effectTempCanvas: OffscreenCanvas | null = null;

  constructor(
    public readonly id: string,
    public readonly width: number,
    public readonly height: number
  ) {
    super();
    this.canvas = new OffscreenCanvas(width, height);
  }

  // ===== Property getters/setters with events =====

  get opacity(): number {
    return this._opacity;
  }

  set opacity(value: number) {
    if (this._opacity !== value) {
      this._opacity = value;
      this.emit('property:change', { property: 'opacity', value });
    }
  }

  get blendMode(): BlendMode {
    return this._blendMode;
  }

  set blendMode(value: BlendMode) {
    if (this._blendMode !== value) {
      this._blendMode = value;
      this.emit('property:change', { property: 'blendMode', value });
    }
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    if (this._visible !== value) {
      this._visible = value;
      this.emit('property:change', { property: 'visible', value });
    }
  }

  // ===== Sketch management =====

  async loadSketch(sketch: Sketch): Promise<void> {
    // Dispose previous sketch
    if (this.sketch) {
      const oldId = this.sketch.id;
      this.sketch.dispose();
      this.emit('sketch:unload', { sketchId: oldId });
    }

    this.sketch = sketch;

    // Create a visible canvas for the sketch to render to
    // Use devicePixelRatio for higher quality on high-DPI displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    const visibleCanvas = document.createElement('canvas');
    visibleCanvas.width = this.width * dpr;
    visibleCanvas.height = this.height * dpr;

    await sketch.init(visibleCanvas);

    // Store reference to copy from
    (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas = visibleCanvas;

    this.emit('sketch:load', { sketch });
  }

  unloadSketch(): void {
    if (this.sketch) {
      const sketchId = this.sketch.id;
      this.sketch.dispose();
      this.sketch = null;
      this.emit('sketch:unload', { sketchId });
    }
    const visibleCanvas = (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas;
    if (visibleCanvas) {
      visibleCanvas.remove();
      (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas = undefined;
    }
  }

  // ===== Effect management =====

  async addEffect(effect: Effect, index?: number): Promise<void> {
    await effect.init();
    const insertIndex = index !== undefined ? index : this.effects.length;
    this.effects.splice(insertIndex, 0, effect);
    this.emit('effect:add', { effect, index: insertIndex });
  }

  removeEffect(effectId: string): void {
    const index = this.effects.findIndex((e) => e.id === effectId);
    if (index !== -1) {
      const effect = this.effects[index];
      effect.dispose();
      this.effects.splice(index, 1);
      this.emit('effect:remove', { effectId, index });
    }
  }

  getEffect(effectId: string): Effect | undefined {
    return this.effects.find((e) => e.id === effectId);
  }

  moveEffect(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.effects.length) return;
    if (toIndex < 0 || toIndex >= this.effects.length) return;

    const [effect] = this.effects.splice(fromIndex, 1);
    this.effects.splice(toIndex, 0, effect);
    this.emit('effects:reorder', { effects: this.effects });
  }

  render(time: number, deltaTime: number): void {
    if (!this.sketch || !this._visible) return;

    // Render the sketch
    this.sketch.render(time, deltaTime);

    // Copy to offscreen canvas
    const visibleCanvas = (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas;
    if (visibleCanvas) {
      if (!this.ctx2d) {
        this.ctx2d = this.canvas.getContext('2d');
      }
      if (this.ctx2d) {
        this.ctx2d.imageSmoothingEnabled = true;
        this.ctx2d.imageSmoothingQuality = 'high';
        this.ctx2d.clearRect(0, 0, this.width, this.height);
        // Scale from source canvas (may be different size) to layer canvas
        this.ctx2d.drawImage(
          visibleCanvas,
          0, 0, visibleCanvas.width, visibleCanvas.height,
          0, 0, this.width, this.height
        );
      }
    }

    // Apply effects chain
    this.applyEffects(time, deltaTime);
  }

  private applyEffects(time: number, deltaTime: number): void {
    const enabledEffects = this.effects.filter((e) => e.enabled);
    if (enabledEffects.length === 0) return;

    // Ensure we have a temp canvas for ping-pong rendering
    if (!this.effectTempCanvas ||
        this.effectTempCanvas.width !== this.width ||
        this.effectTempCanvas.height !== this.height) {
      this.effectTempCanvas = new OffscreenCanvas(this.width, this.height);
    }

    // Ping-pong between layer canvas and temp canvas
    let source: OffscreenCanvas = this.canvas;
    let destination: OffscreenCanvas = this.effectTempCanvas;

    for (let i = 0; i < enabledEffects.length; i++) {
      const effect = enabledEffects[i];

      // Clear destination
      const destCtx = destination.getContext('2d')!;
      destCtx.clearRect(0, 0, this.width, this.height);

      // Apply effect
      effect.apply(source, destination, time, deltaTime);

      // Swap for next iteration
      [source, destination] = [destination, source];
    }

    // If the final result is in the temp canvas, copy back to layer canvas
    if (source !== this.canvas) {
      const ctx = this.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.drawImage(source, 0, 0);
    }
  }

  resize(width: number, height: number): void {
    (this.canvas as { width: number }).width = width;
    (this.canvas as { height: number }).height = height;
    this.ctx2d = null; // Reset context after resize
  }

  dispose(): void {
    this.unloadSketch();
    // Dispose all effects
    for (const effect of this.effects) {
      effect.dispose();
    }
    this.effects = [];
    this.effectTempCanvas = null;
    this.clearAllListeners();
  }
}
