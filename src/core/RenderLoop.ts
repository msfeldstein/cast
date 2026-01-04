export type RenderCallback = (time: number, deltaTime: number) => void;

export class RenderLoop {
  private animationId: number | null = null;
  private lastTime: number = 0;
  private callback: RenderCallback;
  private running: boolean = false;

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

    this.callback(now / 1000, deltaTime); // Time in seconds

    this.animationId = requestAnimationFrame(this.tick);
  };

  isRunning(): boolean {
    return this.running;
  }
}
