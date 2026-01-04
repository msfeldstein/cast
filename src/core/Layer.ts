import { Generation } from '../types/generation';

export type BlendMode = 'normal' | 'additive' | 'multiply' | 'screen' | 'overlay';

export class Layer {
  public readonly canvas: OffscreenCanvas;
  public generation: Generation | null = null;
  public opacity: number = 1.0;
  public blendMode: BlendMode = 'normal';
  public visible: boolean = true;

  private ctx2d: OffscreenCanvasRenderingContext2D | null = null;

  constructor(
    public readonly id: string,
    public readonly width: number,
    public readonly height: number
  ) {
    this.canvas = new OffscreenCanvas(width, height);
  }

  async loadGeneration(generation: Generation): Promise<void> {
    // Dispose previous generation
    if (this.generation) {
      this.generation.dispose();
    }

    this.generation = generation;

    // Create a visible canvas for the generation to render to
    const visibleCanvas = document.createElement('canvas');
    visibleCanvas.width = this.width;
    visibleCanvas.height = this.height;

    await generation.init(visibleCanvas);

    // Store reference to copy from
    (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas = visibleCanvas;
  }

  unloadGeneration(): void {
    if (this.generation) {
      this.generation.dispose();
      this.generation = null;
    }
    const visibleCanvas = (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas;
    if (visibleCanvas) {
      visibleCanvas.remove();
      (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas = undefined;
    }
  }

  render(time: number, deltaTime: number): void {
    if (!this.generation || !this.visible) return;

    // Render the generation
    this.generation.render(time, deltaTime);

    // Copy to offscreen canvas
    const visibleCanvas = (this as { _visibleCanvas?: HTMLCanvasElement })._visibleCanvas;
    if (visibleCanvas) {
      if (!this.ctx2d) {
        this.ctx2d = this.canvas.getContext('2d');
      }
      if (this.ctx2d) {
        this.ctx2d.clearRect(0, 0, this.width, this.height);
        this.ctx2d.drawImage(visibleCanvas, 0, 0);
      }
    }
  }

  resize(width: number, height: number): void {
    (this.canvas as { width: number }).width = width;
    (this.canvas as { height: number }).height = height;
    this.ctx2d = null; // Reset context after resize
  }

  dispose(): void {
    this.unloadGeneration();
  }
}
