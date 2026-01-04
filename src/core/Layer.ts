import { Sketch } from '../types/sketch';
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
}

export class Layer extends EventEmitter<LayerEvents> {
  public readonly canvas: OffscreenCanvas;
  public sketch: Sketch | null = null;

  private _opacity: number = 1.0;
  private _blendMode: BlendMode = 'normal';
  private _visible: boolean = true;
  private ctx2d: OffscreenCanvasRenderingContext2D | null = null;

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
  }

  resize(width: number, height: number): void {
    (this.canvas as { width: number }).width = width;
    (this.canvas as { height: number }).height = height;
    this.ctx2d = null; // Reset context after resize
  }

  dispose(): void {
    this.unloadSketch();
    this.clearAllListeners();
  }
}
