import './App.css';
import './layout/layout.css';
import { Layer } from './core/Layer';
import { Compositor } from './core/Compositor';
import { RenderLoop } from './core/RenderLoop';
import { sketches } from './sketches';
import { signalManager } from './signals';
import { appStateManager } from './persistence';
import { WindowManager } from './layout/WindowManager';
import { createDefaultLayout, LayoutNode } from './layout/types';
import { MainOutput } from './components/MainOutput';
import { LayerPanel } from './components/LayerPanel';
import { Library } from './components/Library';
import { SignalsPanel } from './components/SignalsPanel';

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

/**
 * Main application class that orchestrates the entire app.
 */
export class App {
  private container: HTMLElement;
  private compositor: Compositor | null = null;
  private renderLoop: RenderLoop | null = null;
  private windowManager: WindowManager | null = null;
  private layers: Layer[];

  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize layers
    this.layers = [
      new Layer('layer-1', OUTPUT_WIDTH, OUTPUT_HEIGHT),
      new Layer('layer-2', OUTPUT_WIDTH, OUTPUT_HEIGHT),
    ];
  }

  /**
   * Start the application.
   */
  async start(): Promise<void> {
    // Show loading state
    this.container.innerHTML = '<div class="app-loading">Loading...</div>';

    // Initialize persistence (loads signals, bindings)
    await appStateManager.initialize();

    // Clear loading state
    this.container.innerHTML = '';

    // Get saved layout or use default
    const savedLayout = appStateManager.getTreeLayout();
    const layoutConfig: LayoutNode = savedLayout || createDefaultLayout();

    // Create window manager
    this.windowManager = new WindowManager(this.container, layoutConfig);

    // Subscribe to layout changes for persistence
    this.windowManager.on('layout:change', (layout) => {
      appStateManager.saveTreeLayout(layout);
    });

    // Register content factories for each panel/tab
    this.registerPanelContent();
  }

  private registerPanelContent(): void {
    if (!this.windowManager) return;

    // Output panel
    this.windowManager.registerContent('output', () => {
      return new MainOutput({
        onCanvasReady: (canvas) => this.initCompositor(canvas),
        onCanvasResize: (width, height) => {
          this.compositor?.resize(width, height);
        },
      });
    });

    // Layer 1 panel
    this.windowManager.registerContent('layer-1', () => {
      return new LayerPanel({
        layer: this.layers[0],
        renderLoop: this.renderLoop!,
        onDrop: (factoryId) => this.loadSketchToLayer('layer-1', factoryId),
      });
    });

    // Layer 2 panel
    this.windowManager.registerContent('layer-2', () => {
      return new LayerPanel({
        layer: this.layers[1],
        renderLoop: this.renderLoop!,
        onDrop: (factoryId) => this.loadSketchToLayer('layer-2', factoryId),
      });
    });

    // Library tab
    this.windowManager.registerContent('library', () => {
      return new Library({
        sketches,
        onSelectSketch: (factory) => {
          // Load into first layer by default
          this.loadSketchToLayer('layer-1', factory.id);
        },
      });
    });

    // Signals tab
    this.windowManager.registerContent('signals', () => {
      return new SignalsPanel({
        renderLoop: this.renderLoop!,
      });
    });
  }

  private initCompositor(canvas: HTMLCanvasElement): void {
    // Cleanup previous
    if (this.renderLoop) {
      this.renderLoop.stop();
      this.renderLoop = null;
    }
    if (this.compositor) {
      this.compositor.dispose();
      this.compositor = null;
    }

    // Create compositor
    this.compositor = new Compositor(canvas);

    // Create render loop
    this.renderLoop = new RenderLoop((time, deltaTime) => {
      // 1. Update all signals
      signalManager.update(time, deltaTime);

      // 2. Apply bound signal values to sketch controls
      for (const layer of this.layers) {
        if (layer.sketch) {
          for (const control of layer.sketch.controls) {
            if (control.type === 'float' || control.type === 'integer') {
              const mappedValue = signalManager.getMappedValue(
                layer.id,
                control.name,
                control.min,
                control.max
              );
              if (mappedValue !== undefined) {
                layer.sketch.setControl(control.name, mappedValue);
              }
            }
          }
        }
      }

      // 3. Render layers
      for (const layer of this.layers) {
        layer.render(time, deltaTime);
      }
      this.compositor!.composite(this.layers);
    });

    this.renderLoop.start();
  }

  private async loadSketchToLayer(layerId: string, factoryId: string): Promise<void> {
    const layer = this.layers.find((l) => l.id === layerId);
    const factory = sketches.find((s) => s.id === factoryId);

    if (layer && factory) {
      const sketch = factory.create();
      await layer.loadSketch(sketch);
    }
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    // Flush pending saves
    appStateManager.flush();

    // Stop render loop
    if (this.renderLoop) {
      this.renderLoop.stop();
      this.renderLoop = null;
    }

    // Dispose compositor
    if (this.compositor) {
      this.compositor.dispose();
      this.compositor = null;
    }

    // Dispose window manager
    if (this.windowManager) {
      this.windowManager.dispose();
      this.windowManager = null;
    }

    // Dispose layers
    for (const layer of this.layers) {
      layer.dispose();
    }

    // Dispose signal manager
    signalManager.dispose();
  }
}
