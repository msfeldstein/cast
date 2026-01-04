import { SketchFactory } from '../types/sketch';

const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = 45;

export async function generateThumbnail(factory: SketchFactory): Promise<string> {
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

    // Clean up
    sketch.dispose();

    return dataUrl;
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${factory.id}:`, error);
    // Return a placeholder
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Error', THUMBNAIL_WIDTH / 2, THUMBNAIL_HEIGHT / 2 + 3);
    }
    return canvas.toDataURL('image/png');
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
  }

  return thumbnails;
}
