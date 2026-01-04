import { useState, useEffect } from 'react';
import { GenerationFactory, GenerationType } from '../types/generation';
import { generateAllThumbnails } from '../core/ThumbnailGenerator';
import './Library.css';

interface LibraryProps {
  generations: GenerationFactory[];
  onSelectGeneration: (factory: GenerationFactory) => void;
}

type FilterType = 'all' | GenerationType;

export function Library({ generations, onSelectGeneration }: LibraryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      setLoading(true);
      const thumbs = await generateAllThumbnails(generations);
      if (!cancelled) {
        setThumbnails(thumbs);
        setLoading(false);
      }
    }

    loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [generations]);

  const filteredGenerations = generations.filter(
    (g) => filter === 'all' || g.type === filter
  );

  const handleDragStart = (e: React.DragEvent, gen: GenerationFactory) => {
    e.dataTransfer.setData('application/x-generation-id', gen.id);
    e.dataTransfer.effectAllowed = 'copy';

    // Create a drag image from the thumbnail
    const thumbnail = thumbnails.get(gen.id);
    if (thumbnail) {
      const img = new Image();
      img.src = thumbnail;
      e.dataTransfer.setDragImage(img, 40, 22);
    }
  };

  return (
    <div className="library">
      <div className="library-header">
        <span className="library-title">Library</span>
        <div className="library-filters">
          {(['all', 'video', 'shader', 'sketch'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="library-list">
        {loading ? (
          <div className="library-loading">Loading thumbnails...</div>
        ) : filteredGenerations.length === 0 ? (
          <div className="library-empty">No generations available</div>
        ) : (
          filteredGenerations.map((gen) => (
            <div
              key={gen.id}
              className="library-item"
              draggable
              onDragStart={(e) => handleDragStart(e, gen)}
              onClick={() => onSelectGeneration(gen)}
            >
              <div className="library-item-thumbnail">
                {thumbnails.has(gen.id) ? (
                  <img src={thumbnails.get(gen.id)} alt={gen.name} />
                ) : (
                  <div className="library-item-placeholder" />
                )}
                <span className={`library-item-badge type-${gen.type}`}>
                  {gen.type.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="library-item-name">{gen.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
