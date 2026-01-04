import './MainOutput.css';
import { Component } from '../ui/Component';

export interface MainOutputOptions {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onCanvasResize?: (width: number, height: number) => void;
}

/**
 * Main output canvas container with automatic DPI-aware resizing.
 */
export class MainOutput extends Component {
  private canvas!: HTMLCanvasElement;
  private resizeObserver: ResizeObserver | null = null;
  private onCanvasReady: (canvas: HTMLCanvasElement) => void;
  private onCanvasResize?: (width: number, height: number) => void;

  constructor(options: MainOutputOptions) {
    super();
    this.onCanvasReady = options.onCanvasReady;
    this.onCanvasResize = options.onCanvasResize;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'main-output';
    this.canvas = document.createElement('canvas');
    el.appendChild(this.canvas);
    return el;
  }

  protected onMount(): void {
    // Notify parent that canvas is ready
    this.onCanvasReady(this.canvas);

    // Set up resize observer
    const dpr = window.devicePixelRatio || 1;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Set canvas internal resolution to match display pixels
        const pixelWidth = Math.floor(width * dpr);
        const pixelHeight = Math.floor(height * dpr);

        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;

        this.onCanvasResize?.(pixelWidth, pixelHeight);
      }
    });

    this.resizeObserver.observe(this.element);
  }

  protected onUnmount(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /**
   * Get the canvas element.
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get the current canvas dimensions.
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
}
