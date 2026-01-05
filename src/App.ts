import './App.css';
import './layout/layout.css';
import { Layer, BlendMode } from './core/Layer';
import { Compositor } from './core/Compositor';
import { RenderLoop } from './core/RenderLoop';
import { sketches } from './sketches';
import { effects as effectFactories } from './effects';
import { signalManager, SignalManagerEvents, SignalType } from './signals';
import { appStateManager } from './persistence';
import { WindowManager } from './layout/WindowManager';
import { dragManager } from './layout/DragManager';
import { createDefaultLayout, LayoutNode, findPanelByTabId, findAllPanels, DropZone } from './layout/types';
import { MainOutput } from './components/MainOutput';
import { LayerPanel } from './components/LayerPanel';
import { Library } from './components/Library';
import { AddMenu } from './components/AddMenu';
import { SignalPane } from './components/SignalPane';

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
  private addMenu: AddMenu | null = null;
  private layers: Layer[];
  private cleanupFns: (() => void)[] = [];

  constructor(container: HTMLElement) {
    this.container = container;

    // Layers will be initialized in start() after persistence loads
    this.layers = [];
  }

  /**
   * Start the application.
   */
  async start(): Promise<void> {
    // Show loading state
    this.container.innerHTML = '<div class="app-loading">Loading...</div>';

    // Initialize persistence (loads signals, bindings)
    await appStateManager.initialize();

    // Initialize layers from saved state or create default
    await this.initializeLayers();

    // Register layers for persistence
    appStateManager.registerLayers(this.layers);

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

    // Set up value provider for signal values in tab backgrounds
    this.windowManager.setValueProvider((tabId) => {
      const signal = signalManager.getSignal(tabId);
      return signal ? signal.getValue() : null;
    });

    // Set up signal event handlers
    this.setupSignalHandlers();

    // Register existing signals (from persistence) as panels
    this.registerExistingSignals();

    // Create the floating add menu
    this.addMenu = new AddMenu({
      onAddSignal: (type) => this.createSignal(type),
      onAddLayer: () => this.addLayer(),
    });
    this.addMenu.mount(document.body);
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

    // Register all layers (they were created in initializeLayers)
    for (const layer of this.layers) {
      const layerId = layer.id;
      this.windowManager.registerContent(layerId, () => {
        return new LayerPanel({
          layer,
          renderLoop: this.renderLoop!,
          onDrop: (factoryId) => this.loadSketchToLayer(layerId, factoryId),
        });
      });
    }

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
  }

  /**
   * Initialize layers from saved state or create default
   */
  private async initializeLayers(): Promise<void> {
    const savedLayers = appStateManager.getSavedLayers();

    if (savedLayers.length === 0) {
      // Create default layer
      this.layers = [new Layer('layer-1', OUTPUT_WIDTH, OUTPUT_HEIGHT)];
      return;
    }

    // Restore layers from saved state
    for (const savedLayer of savedLayers) {
      const layer = new Layer(savedLayer.id, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      // Restore layer properties
      layer.opacity = savedLayer.opacity;
      layer.blendMode = savedLayer.blendMode as BlendMode;
      layer.visible = savedLayer.visible;

      // Restore sketch if present
      if (savedLayer.sketchId) {
        const sketchFactory = sketches.find((s) => s.id === savedLayer.sketchId);
        if (sketchFactory) {
          const sketch = sketchFactory.create();
          await layer.loadSketch(sketch);

          // Restore sketch control values
          for (const [name, value] of Object.entries(savedLayer.sketchControls)) {
            sketch.setControl(name, value);
          }
        }
      }

      // Restore effects
      for (const savedEffect of savedLayer.effects) {
        const effectFactory = effectFactories.find((e) => e.id === savedEffect.factoryId);
        if (effectFactory) {
          const effect = effectFactory.create();
          // Override the generated ID with the saved instance ID
          (effect as { id: string }).id = savedEffect.instanceId;
          await layer.addEffect(effect);

          // Restore effect properties
          effect.enabled = savedEffect.enabled;

          // Restore effect control values
          for (const [name, value] of Object.entries(savedEffect.controls)) {
            effect.setControl(name, value);
          }
        }
      }

      this.layers.push(layer);
    }
  }

  private setupSignalHandlers(): void {
    // Listen for signal removal to remove the panel
    const unsubRemove = signalManager.on('signal:remove', (data) => {
      const { signalId } = data as SignalManagerEvents['signal:remove'];
      // Remove the panel for this signal
      this.windowManager?.removePanel(signalId);
    });
    this.cleanupFns.push(unsubRemove);

    // Listen for layout changes to clean up orphaned signals
    // (when user drags away a signal panel's tab)
    const unsubLayout = this.windowManager!.on('layout:change', (layout) => {
      const signals = signalManager.getAllSignals();
      for (const signal of signals) {
        // Check if signal's panel still exists in layout
        const panel = findPanelByTabId(layout, signal.id);
        if (!panel) {
          // Signal's panel was removed - delete the signal
          signalManager.removeSignal(signal.id);
        }
      }
    });
    this.cleanupFns.push(unsubLayout);

    // Listen for drops to handle signal/layer creation drags
    const unsubDrop = dragManager.on('drop', ({ data, targetPanelId, zone }) => {
      if (data.createSignalType) {
        this.handleSignalDrop(data.createSignalType as SignalType, targetPanelId, zone);
      } else if (data.createLayer) {
        this.handleLayerDrop(targetPanelId, zone);
      }
    });
    this.cleanupFns.push(unsubDrop);
  }

  private async handleSignalDrop(
    type: SignalType,
    targetPanelId: string,
    zone: DropZone
  ): Promise<void> {
    try {
      const signal = await signalManager.createSignal(type);

      // Register the content factory for the new signal
      this.registerSignalContent(signal.id, signal.name);

      // Add the signal as a panel at the target location
      this.windowManager?.addPanelAtTarget(
        { id: signal.id, title: signal.name },
        targetPanelId,
        zone
      );

      // Save state
      appStateManager.saveState();
    } catch (error) {
      console.error(`Failed to create ${type} signal:`, error);
    }
  }

  private handleLayerDrop(targetPanelId: string, zone: DropZone): void {
    // Find the next available layer number
    const existingLayerIds = this.layers.map((l) => l.id);
    let layerNum = this.layers.length + 1;
    while (existingLayerIds.includes(`layer-${layerNum}`)) {
      layerNum++;
    }

    const layerId = `layer-${layerNum}`;
    const layer = new Layer(layerId, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    this.layers.push(layer);

    // Register layer for persistence
    appStateManager.registerLayer(layer);

    // Register the content factory for the new layer
    this.windowManager?.registerContent(layerId, () => {
      return new LayerPanel({
        layer,
        renderLoop: this.renderLoop!,
        onDrop: (factoryId) => this.loadSketchToLayer(layerId, factoryId),
      });
    });

    // Add the layer as a panel at the target location
    this.windowManager?.addPanelAtTarget(
      { id: layerId, title: `Layer ${layerNum}` },
      targetPanelId,
      zone
    );

    // Save state
    appStateManager.saveState();
  }

  private registerExistingSignals(): void {
    // Register content factories for any signals that already exist (from persistence)
    // but don't add new panels - they should already be in the saved layout
    const signals = signalManager.getAllSignals();
    for (const signal of signals) {
      this.registerSignalContent(signal.id, signal.name);
    }
  }

  private async createSignal(type: SignalType): Promise<void> {
    try {
      const signal = await signalManager.createSignal(type);

      // Register the content factory for the new signal
      this.registerSignalContent(signal.id, signal.name);

      // Add a new panel for this signal
      // Find the library panel to split next to, or use the last panel
      const layout = this.windowManager?.getLayout();
      const libraryPanel = layout ? findPanelByTabId(layout, 'library') : null;
      const panels = layout ? findAllPanels(layout) : [];
      const targetPanel = libraryPanel || panels[panels.length - 1];

      this.windowManager?.addPanel(
        { id: signal.id, title: signal.name },
        targetPanel?.id,
        'right'
      );

      // Save state
      appStateManager.saveState();
    } catch (error) {
      console.error(`Failed to create ${type} signal:`, error);
    }
  }

  private addLayer(): void {
    // Find the next available layer number
    const existingLayerIds = this.layers.map((l) => l.id);
    let layerNum = this.layers.length + 1;
    while (existingLayerIds.includes(`layer-${layerNum}`)) {
      layerNum++;
    }

    const layerId = `layer-${layerNum}`;
    const layer = new Layer(layerId, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    this.layers.push(layer);

    // Register layer for persistence
    appStateManager.registerLayer(layer);

    // Register the content factory for the new layer
    this.windowManager?.registerContent(layerId, () => {
      return new LayerPanel({
        layer,
        renderLoop: this.renderLoop!,
        onDrop: (factoryId) => this.loadSketchToLayer(layerId, factoryId),
      });
    });

    // Add a panel for this layer next to existing layers
    const layout = this.windowManager?.getLayout();
    const layer1Panel = layout ? findPanelByTabId(layout, 'layer-1') : null;
    const panels = layout ? findAllPanels(layout) : [];
    const targetPanel = layer1Panel || panels[0];

    this.windowManager?.addPanel(
      { id: layerId, title: `Layer ${layerNum}` },
      targetPanel?.id,
      'bottom'
    );

    // Save state
    appStateManager.saveState();
  }

  private registerSignalContent(signalId: string, _signalName: string): void {
    this.windowManager?.registerContent(signalId, () => {
      return new SignalPane({
        signalId,
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

      // 2. Apply bound signal values to sketch and effect controls
      for (const layer of this.layers) {
        // Apply to sketch controls
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

        // Apply to effect controls
        for (const effect of layer.effects) {
          for (const control of effect.controls) {
            if (control.type === 'float' || control.type === 'integer') {
              const mappedValue = signalManager.getMappedValue(
                layer.id,
                control.name,
                control.min,
                control.max,
                effect.id
              );
              if (mappedValue !== undefined) {
                effect.setControl(control.name, mappedValue);
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

    // Clean up event subscriptions
    for (const fn of this.cleanupFns) {
      fn();
    }
    this.cleanupFns = [];

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

    // Dispose add menu
    if (this.addMenu) {
      this.addMenu.dispose();
      this.addMenu = null;
    }

    // Dispose layers
    for (const layer of this.layers) {
      layer.dispose();
    }

    // Dispose signal manager
    signalManager.dispose();
  }
}
