import './Library.css';
import { Component } from '../ui/Component';
import { SketchFactory, SketchType } from '../types/sketch';
import { generateAllThumbnails } from '../core/ThumbnailGenerator';

type FilterType = 'all' | SketchType;

export interface LibraryOptions {
  sketches: SketchFactory[];
  onSelectSketch: (factory: SketchFactory) => void;
}

/**
 * Library panel showing available sketches with thumbnails.
 * Supports filtering by type and drag-and-drop to layers.
 */
export class Library extends Component {
  private sketches: SketchFactory[];
  private onSelectSketch: (factory: SketchFactory) => void;

  private filter: FilterType = 'all';
  private thumbnails: Map<string, string> = new Map();
  private loading = true;

  private filterButtons!: NodeListOf<HTMLButtonElement>;
  private listContainer!: HTMLElement;

  constructor(options: LibraryOptions) {
    super();
    this.sketches = options.sketches;
    this.onSelectSketch = options.onSelectSketch;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'library';
    el.innerHTML = `
      <div class="library-header">
        <span class="library-title">Library</span>
        <div class="library-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="video">Video</button>
          <button class="filter-btn" data-filter="shader">Shader</button>
          <button class="filter-btn" data-filter="sketch">Sketch</button>
        </div>
      </div>
      <div class="library-list">
        <div class="library-loading">Loading thumbnails...</div>
      </div>
    `;

    this.filterButtons = el.querySelectorAll('.filter-btn');
    this.listContainer = el.querySelector('.library-list')!;

    return el;
  }

  protected onMount(): void {
    // Filter button handlers
    for (const btn of this.filterButtons) {
      this.listen(btn, 'click', () => {
        this.setFilter(btn.dataset.filter as FilterType);
      });
    }

    // Load thumbnails
    this.loadThumbnails();
  }

  private async loadThumbnails(): Promise<void> {
    this.loading = true;
    this.renderList();

    try {
      this.thumbnails = await generateAllThumbnails(this.sketches);
    } catch (error) {
      console.error('Failed to generate thumbnails:', error);
    }

    this.loading = false;
    this.renderList();
  }

  private setFilter(filter: FilterType): void {
    this.filter = filter;

    // Update button states
    for (const btn of this.filterButtons) {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    }

    this.renderList();
  }

  private renderList(): void {
    this.listContainer.innerHTML = '';

    if (this.loading) {
      this.listContainer.innerHTML = '<div class="library-loading">Loading thumbnails...</div>';
      return;
    }

    const filteredSketches = this.sketches.filter(
      (s) => this.filter === 'all' || s.type === this.filter
    );

    if (filteredSketches.length === 0) {
      this.listContainer.innerHTML = '<div class="library-empty">No sketches available</div>';
      return;
    }

    for (const sketch of filteredSketches) {
      const item = this.createLibraryItem(sketch);
      this.listContainer.appendChild(item);
    }
  }

  private createLibraryItem(sketch: SketchFactory): HTMLElement {
    const item = document.createElement('div');
    item.className = 'library-item';
    item.draggable = true;

    const thumbnail = this.thumbnails.get(sketch.id);
    item.innerHTML = `
      <div class="library-item-thumbnail">
        ${thumbnail ? `<img src="${thumbnail}" alt="${sketch.name}">` : '<div class="library-item-placeholder"></div>'}
      </div>
    `;

    // Drag start
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer!.setData('application/x-sketch-id', sketch.id);
      e.dataTransfer!.effectAllowed = 'copy';

      // Use thumbnail as drag image
      if (thumbnail) {
        const img = new Image();
        img.src = thumbnail;
        e.dataTransfer!.setDragImage(img, 40, 22);
      }
    });

    // Click to select
    item.addEventListener('click', () => {
      this.onSelectSketch(sketch);
    });

    return item;
  }

  /**
   * Update the sketches list.
   */
  setSketches(sketches: SketchFactory[]): void {
    this.sketches = sketches;
    this.loadThumbnails();
  }
}
