import { Component } from '../ui/Component';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerOptions {
  orientation: DividerOrientation;
  onResize: (delta: number) => void;
}

/**
 * A draggable divider for resizing adjacent panels.
 * - Horizontal divider: resizes panels above/below (drag up/down)
 * - Vertical divider: resizes panels left/right (drag left/right)
 */
export class Divider extends Component {
  private orientation: DividerOrientation;
  private onResize: (delta: number) => void;
  private isDragging = false;
  private startPos = 0;

  constructor(options: DividerOptions) {
    super();
    this.orientation = options.orientation;
    this.onResize = options.onResize;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = `divider divider-${this.orientation}`;
    return el;
  }

  protected onMount(): void {
    this.listen(this.element, 'mousedown', this.handleMouseDown.bind(this));
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
