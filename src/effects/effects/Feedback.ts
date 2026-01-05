import { Effect } from '../../types/effect';
import { ControlDefinition, ControlValue } from '../../types/sketch';
import { EffectFactory } from '../../types/effect';

/**
 * Feedback effect - creates trails by blending current frame with previous
 * This is a special effect that doesn't use WebGL, just 2D canvas blending
 */
class FeedbackEffect implements Effect {
  id = 'feedback';
  name = 'Feedback';
  enabled = true;

  controls: ControlDefinition[] = [
    { name: 'decay', type: 'float', label: 'Decay', defaultValue: 0.9, min: 0.0, max: 0.99, step: 0.01 },
    { name: 'zoom', type: 'float', label: 'Zoom', defaultValue: 1.0, min: 0.95, max: 1.05, step: 0.001 },
    { name: 'rotation', type: 'float', label: 'Rotation', defaultValue: 0.0, min: -0.05, max: 0.05, step: 0.001 },
    { name: 'offsetX', type: 'float', label: 'Offset X', defaultValue: 0.0, min: -0.05, max: 0.05, step: 0.001 },
    { name: 'offsetY', type: 'float', label: 'Offset Y', defaultValue: 0.0, min: -0.05, max: 0.05, step: 0.001 },
  ];

  private decay = 0.9;
  private zoom = 1.0;
  private rotation = 0.0;
  private offsetX = 0.0;
  private offsetY = 0.0;

  private feedbackCanvas: OffscreenCanvas | null = null;
  private feedbackCtx: OffscreenCanvasRenderingContext2D | null = null;

  async init(): Promise<void> {
    // Canvas will be created on first apply
  }

  apply(
    source: OffscreenCanvas,
    destination: OffscreenCanvas,
    _time: number,
    _deltaTime: number
  ): void {
    if (!this.enabled) {
      const ctx = destination.getContext('2d')!;
      ctx.drawImage(source, 0, 0);
      return;
    }

    const width = source.width;
    const height = source.height;

    // Initialize feedback canvas if needed
    if (!this.feedbackCanvas || this.feedbackCanvas.width !== width || this.feedbackCanvas.height !== height) {
      this.feedbackCanvas = new OffscreenCanvas(width, height);
      this.feedbackCtx = this.feedbackCanvas.getContext('2d')!;
      // Start with transparent
      this.feedbackCtx.clearRect(0, 0, width, height);
    }

    const ctx = destination.getContext('2d')!;
    const fbCtx = this.feedbackCtx!;

    // Draw previous feedback with decay, zoom, and rotation
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = this.decay;
    ctx.translate(width / 2 + this.offsetX * width, height / 2 + this.offsetY * height);
    ctx.rotate(this.rotation);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(this.feedbackCanvas, 0, 0);
    ctx.restore();

    // Draw current source on top
    ctx.globalAlpha = 1.0;
    ctx.drawImage(source, 0, 0);

    // Store result for next frame
    fbCtx.clearRect(0, 0, width, height);
    fbCtx.drawImage(destination, 0, 0);
  }

  dispose(): void {
    this.feedbackCanvas = null;
    this.feedbackCtx = null;
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'decay' && typeof value === 'number') this.decay = value;
    else if (name === 'zoom' && typeof value === 'number') this.zoom = value;
    else if (name === 'rotation' && typeof value === 'number') this.rotation = value;
    else if (name === 'offsetX' && typeof value === 'number') this.offsetX = value;
    else if (name === 'offsetY' && typeof value === 'number') this.offsetY = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'decay') return this.decay;
    if (name === 'zoom') return this.zoom;
    if (name === 'rotation') return this.rotation;
    if (name === 'offsetX') return this.offsetX;
    if (name === 'offsetY') return this.offsetY;
    return undefined;
  }
}

export const feedbackFactory: EffectFactory = {
  id: 'feedback',
  name: 'Feedback',
  create: () => new FeedbackEffect(),
};
