export type RenderCallback = (time: number, deltaTime: number) => void;
export type UIUpdateCallback = () => void;

export class RenderLoop {
  private animationId: number | null = null;
  private lastTime: number = 0;
  private callback: RenderCallback;
  private running: boolean = false;
  private uiCallbacks: Set<UIUpdateCallback> = new Set();

  constructor(callback: RenderCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = now;

    // Main render callback
    this.callback(now / 1000, deltaTime); // Time in seconds

    // UI update callbacks (run after render)
    for (const uiCallback of this.uiCallbacks) {
      uiCallback();
    }

    this.animationId = requestAnimationFrame(this.tick);
  };

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Register a UI update callback to run every frame after rendering.
   * Use this for updating UI elements that need to stay in sync with the render loop
   * (e.g., preview canvases, signal value displays).
   *
   * @returns Unregister function
   */
  registerUIUpdate(callback: UIUpdateCallback): () => void {
    this.uiCallbacks.add(callback);
    return () => this.uiCallbacks.delete(callback);
  }
}
