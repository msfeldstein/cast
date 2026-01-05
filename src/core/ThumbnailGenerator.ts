import { SketchFactory } from '../types/sketch';

const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = 45;

// Shared canvas for thumbnail generation - reused to avoid creating too many WebGL contexts
let sharedCanvas: HTMLCanvasElement | null = null;

function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = THUMBNAIL_WIDTH;
    sharedCanvas.height = THUMBNAIL_HEIGHT;
  }
  return sharedCanvas;
}

function releaseWebGLContext(canvas: HTMLCanvasElement): void {
  // Try to get and lose the WebGL context to free resources
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (gl) {
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) {
      ext.loseContext();
    }
  }
}

export async function generateThumbnail(factory: SketchFactory): Promise<string> {
  // Create a fresh canvas for each sketch since WebGL context is tied to canvas
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;

  try {
    const sketch = factory.create();
    await sketch.init(canvas);

    // Render a single frame at t=0.5s to get something interesting
    sketch.render(0.5, 0.016);

    // Get the data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Clean up sketch resources
    sketch.dispose();

    // Explicitly release the WebGL context
    releaseWebGLContext(canvas);

    return dataUrl;
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${factory.id}:`, error);

    // Try to release context even on error
    releaseWebGLContext(canvas);

    // Return a placeholder using 2D context on shared canvas
    const placeholderCanvas = getSharedCanvas();
    const ctx = placeholderCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Error', THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT / 2 + 3);
    }
    return placeholderCanvas.toDataURL('image/png');
  }
}

export async function generateAllThumbnails(
  factories: SketchFactory[]
): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();

  // Generate thumbnails sequentially to avoid WebGL context issues
  for (const factory of factories) {
    const thumbnail = await generateThumbnail(factory);
    thumbnails.set(factory.id, thumbnail);

    // Small delay to allow browser to garbage collect released contexts
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return thumbnails;
}
