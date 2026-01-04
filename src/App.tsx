import { useEffect, useRef, useState, useCallback } from 'react';
import { Layer, BlendMode } from './core/Layer';
import { Compositor } from './core/Compositor';
import { RenderLoop } from './core/RenderLoop';
import { GenerationFactory } from './types/generation';
import { generations } from './generations';
import { MainOutput } from './components/MainOutput';
import { Sidebar } from './components/Sidebar';
import './App.css';

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

function App() {
  const outputCanvasRef = useRef<HTMLCanvasElement>(null!);
  const compositorRef = useRef<Compositor | null>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const layersRef = useRef<Layer[]>([]);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [, forceUpdate] = useState({});

  // Initialize layers and compositor
  useEffect(() => {
    const layer1 = new Layer('layer-1', OUTPUT_WIDTH, OUTPUT_HEIGHT);
    const layer2 = new Layer('layer-2', OUTPUT_WIDTH, OUTPUT_HEIGHT);
    layersRef.current = [layer1, layer2];
    setLayers([layer1, layer2]);

    return () => {
      layersRef.current.forEach(l => l.dispose());
    };
  }, []);

  // Initialize compositor and render loop
  useEffect(() => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const compositor = new Compositor(canvas);
    compositorRef.current = compositor;

    const renderLoop = new RenderLoop((time, deltaTime) => {
      // Render all layers
      for (const layer of layersRef.current) {
        layer.render(time, deltaTime);
      }

      // Composite layers
      compositor.composite(layersRef.current);
    });
    renderLoopRef.current = renderLoop;
    renderLoop.start();

    return () => {
      renderLoop.stop();
      compositor.dispose();
    };
  }, []);

  const handleLoadGeneration = useCallback(async (layer: Layer, factory: GenerationFactory) => {
    const generation = factory.create();
    await layer.loadGeneration(generation);
    forceUpdate({});
  }, []);

  const handleUnloadGeneration = useCallback((layer: Layer) => {
    layer.unloadGeneration();
    forceUpdate({});
  }, []);

  const handleOpacityChange = useCallback((layer: Layer, opacity: number) => {
    layer.opacity = opacity;
    forceUpdate({});
  }, []);

  const handleBlendModeChange = useCallback((layer: Layer, mode: BlendMode) => {
    layer.blendMode = mode;
    forceUpdate({});
  }, []);

  const handleVisibilityChange = useCallback((layer: Layer, visible: boolean) => {
    layer.visible = visible;
    forceUpdate({});
  }, []);

  const handleDropGeneration = useCallback(async (layer: Layer, factoryId: string) => {
    const factory = generations.find((g) => g.id === factoryId);
    if (factory) {
      const generation = factory.create();
      await layer.loadGeneration(generation);
      forceUpdate({});
    }
  }, []);

  return (
    <div className="app">
      <MainOutput canvasRef={outputCanvasRef} />
      <Sidebar
        layers={layers}
        generations={generations}
        selectedLayerIndex={selectedLayerIndex}
        onSelectLayer={setSelectedLayerIndex}
        onLoadGeneration={handleLoadGeneration}
        onUnloadGeneration={handleUnloadGeneration}
        onOpacityChange={handleOpacityChange}
        onBlendModeChange={handleBlendModeChange}
        onVisibilityChange={handleVisibilityChange}
        onDropGeneration={handleDropGeneration}
      />
    </div>
  );
}

export default App;
