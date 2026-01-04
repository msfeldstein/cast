import { useEffect, useRef, useState } from 'react';
import { Layer, BlendMode } from '../core/Layer';
import { GenerationFactory } from '../types/generation';
import './LayerPanel.css';

interface LayerPanelProps {
  layer: Layer;
  layerNumber: number;
  generations: GenerationFactory[];
  onLoadGeneration: (layer: Layer, factory: GenerationFactory) => void;
  onUnloadGeneration: (layer: Layer) => void;
  onOpacityChange: (layer: Layer, opacity: number) => void;
  onBlendModeChange: (layer: Layer, mode: BlendMode) => void;
  onVisibilityChange: (layer: Layer, visible: boolean) => void;
  onDrop?: (layer: Layer, factoryId: string) => void;
}

const BLEND_MODES: BlendMode[] = ['normal', 'additive', 'multiply', 'screen', 'overlay'];

export function LayerPanel({
  layer,
  layerNumber,
  generations,
  onLoadGeneration,
  onUnloadGeneration,
  onOpacityChange,
  onBlendModeChange,
  onVisibilityChange,
  onDrop,
}: LayerPanelProps) {
  const currentGenId = layer.generation?.id || '';
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Copy layer canvas to preview canvas each frame
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const updatePreview = () => {
      if (layer.generation && layer.canvas) {
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.drawImage(
          layer.canvas,
          0, 0, layer.canvas.width, layer.canvas.height,
          0, 0, previewCanvas.width, previewCanvas.height
        );
      } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      }
      animationId = requestAnimationFrame(updatePreview);
    };

    updatePreview();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [layer, layer.generation]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const factoryId = e.dataTransfer.getData('application/x-generation-id');
    if (factoryId && onDrop) {
      onDrop(layer, factoryId);
    }
  };

  return (
    <div
      className={`layer-panel ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="layer-header">
        <span className="layer-title">Layer {layerNumber}</span>
        <label className="layer-visibility">
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={(e) => onVisibilityChange(layer, e.target.checked)}
          />
          Visible
        </label>
      </div>

      <div className="layer-preview">
        <canvas
          ref={previewCanvasRef}
          width={160}
          height={90}
          className="layer-preview-canvas"
        />
        {!layer.generation && (
          <span className="layer-preview-empty">Drop generation here</span>
        )}
      </div>

      <div className="layer-controls">
        <div className="control-row">
          <label>Source:</label>
          <select
            value={currentGenId}
            onChange={(e) => {
              if (e.target.value === '') {
                onUnloadGeneration(layer);
              } else {
                const factory = generations.find((g) => g.id === e.target.value);
                if (factory) {
                  onLoadGeneration(layer, factory);
                }
              }
            }}
          >
            <option value="">None</option>
            {generations.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-row">
          <label>Opacity:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={layer.opacity}
            onChange={(e) => onOpacityChange(layer, parseFloat(e.target.value))}
          />
          <span className="control-value">{Math.round(layer.opacity * 100)}%</span>
        </div>

        <div className="control-row">
          <label>Blend:</label>
          <select
            value={layer.blendMode}
            onChange={(e) => onBlendModeChange(layer, e.target.value as BlendMode)}
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
