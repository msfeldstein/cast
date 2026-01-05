import { Component } from '../ui/Component';
import { dragManager } from './DragManager';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerOptions {
  orientation: DividerOrientation;
  onResize: (delta: number) => void;
  onDrop?: () => void;
}

/**
 * A draggable divider for resizing adjacent panels.
 * - Horizontal divider: resizes panels above/below (drag up/down)
 * - Vertical divider: resizes panels left/right (drag left/right)
 * Also supports dropping panels to insert at this split point.
 */
export class Divider extends Component {
  private orientation: DividerOrientation;
  private onResize: (delta: number) => void;
  private onDropCallback?: () => void;
  private isDragging = false;
  private startPos = 0;
  private isDropTarget = false;
  private dragCleanupFns: (() => void)[] = [];

  constructor(options: DividerOptions) {
    super();
    this.orientation = options.orientation;
    this.onResize = options.onResize;
    this.onDropCallback = options.onDrop;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = `divider divider-${this.orientation}`;
    return el;
  }

  protected onMount(): void {
    this.listen(this.element, 'mousedown', this.handleMouseDown.bind(this));
    this.setupDropTarget();
  }

  private setupDropTarget(): void {
    // Listen for drag state changes
    const unsubStart = dragManager.on('drag:start', () => {
      this.element.classList.add('drop-enabled');
    });
    this.dragCleanupFns.push(unsubStart);

    const unsubEnd = dragManager.on('drag:end', () => {
      this.element.classList.remove('drop-enabled', 'drop-hover');
      this.isDropTarget = false;
    });
    this.dragCleanupFns.push(unsubEnd);

    // Mouse enter/leave for drop highlight
    this.listen(this.element, 'mouseenter', () => {
      if (dragManager.isDragActive()) {
        this.isDropTarget = true;
        this.element.classList.add('drop-hover');
      }
    });

    this.listen(this.element, 'mouseleave', () => {
      this.isDropTarget = false;
      this.element.classList.remove('drop-hover');
    });

    // Handle drop
    this.listen(this.element, 'mouseup', () => {
      if (dragManager.isDragActive() && this.isDropTarget && this.onDropCallback) {
        this.onDropCallback();
      }
    });
  }

  protected onDispose(): void {
    for (const fn of this.dragCleanupFns) {
      fn();
    }
    this.dragCleanupFns = [];
  }

  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isDragging = true;
    this.startPos = this.orientation === 'vertical' ? e.clientX : e.clientY;
    this.element.classList.add('dragging');
    document.body.style.cursor =
      this.orientation === 'vertical' ? 'col-resize' : 'row-resize';

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const currentPos = this.orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - this.startPos;
      this.startPos = currentPos;
      this.onResize(delta);
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      this.element.classList.remove('dragging');
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
}
