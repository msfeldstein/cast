import { Layer, BlendMode } from '../core/Layer';
import { GenerationFactory } from '../types/generation';
import { LayerPanel } from './LayerPanel';
import { Library } from './Library';
import './Sidebar.css';

interface SidebarProps {
  layers: Layer[];
  generations: GenerationFactory[];
  selectedLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onLoadGeneration: (layer: Layer, factory: GenerationFactory) => void;
  onUnloadGeneration: (layer: Layer) => void;
  onOpacityChange: (layer: Layer, opacity: number) => void;
  onBlendModeChange: (layer: Layer, mode: BlendMode) => void;
  onVisibilityChange: (layer: Layer, visible: boolean) => void;
  onDropGeneration: (layer: Layer, factoryId: string) => void;
}

export function Sidebar({
  layers,
  generations,
  selectedLayerIndex,
  onSelectLayer,
  onLoadGeneration,
  onUnloadGeneration,
  onOpacityChange,
  onBlendModeChange,
  onVisibilityChange,
  onDropGeneration,
}: SidebarProps) {
  const handleLibrarySelect = (factory: GenerationFactory) => {
    const layer = layers[selectedLayerIndex];
    if (layer) {
      onLoadGeneration(layer, factory);
    }
  };

  return (
    <div className="sidebar">
      <div className="layers-section">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`layer-wrapper ${index === selectedLayerIndex ? 'selected' : ''}`}
            onClick={() => onSelectLayer(index)}
          >
            <LayerPanel
              layer={layer}
              layerNumber={index + 1}
              generations={generations}
              onLoadGeneration={onLoadGeneration}
              onUnloadGeneration={onUnloadGeneration}
              onOpacityChange={onOpacityChange}
              onBlendModeChange={onBlendModeChange}
              onVisibilityChange={onVisibilityChange}
              onDrop={onDropGeneration}
            />
          </div>
        ))}
      </div>
      <Library generations={generations} onSelectGeneration={handleLibrarySelect} />
    </div>
  );
}
