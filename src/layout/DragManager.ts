import { EventEmitter } from '../ui/EventEmitter';
import { DragData, DropZone } from './types';

export interface DragManagerEvents {
  [key: string]: unknown;
  'drag:start': DragData;
  'drag:move': { x: number; y: number };
  'drag:end': void;
  'drop': { data: DragData; targetPanelId: string; zone: DropZone };
}

/**
 * Singleton manager for panel/tab drag-and-drop operations.
 * Coordinates drag state across all panels and provides visual feedback.
 */
class DragManagerImpl extends EventEmitter<DragManagerEvents> {
  private dragData: DragData | null = null;
  private ghostElement: HTMLElement | null = null;
  private isDragging = false;

  /**
   * Start a drag operation for a tab.
   */
  startDrag(data: DragData, startX: number, startY: number): void {
    if (this.isDragging) return;

    this.isDragging = true;
    this.dragData = data;

    // Create ghost element
    this.createGhost(data.tabTitle, startX, startY);

    // Set up global mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      this.updateGhostPosition(e.clientX, e.clientY);
      this.emit('drag:move', { x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      this.endDrag(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Notify listeners
    this.emit('drag:start', data);

    // Add dragging class to body
    document.body.classList.add('panel-dragging');
  }

  /**
   * End the current drag operation.
   */
  endDrag(_x?: number, _y?: number): void {
    if (!this.isDragging) return;

    this.removeGhost();
    this.isDragging = false;
    this.dragData = null;

    document.body.classList.remove('panel-dragging');

    this.emit('drag:end', undefined);
  }

  /**
   * Complete a drop operation.
   */
  drop(targetPanelId: string, zone: DropZone): void {
    if (!this.dragData) return;

    this.emit('drop', {
      data: { ...this.dragData },
      targetPanelId,
      zone,
    });
  }

  /**
   * Get the current drag data, if any.
   */
  getDragData(): DragData | null {
    return this.dragData;
  }

  /**
   * Check if a drag operation is in progress.
   */
  isDragActive(): boolean {
    return this.isDragging;
  }

  private createGhost(title: string, x: number, y: number): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'drag-ghost';
    this.ghostElement.textContent = title;
    this.ghostElement.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      padding: 8px 16px;
      background: #333;
      border: 1px solid #666;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(this.ghostElement);
  }

  private updateGhostPosition(x: number, y: number): void {
    if (this.ghostElement) {
      this.ghostElement.style.left = `${x}px`;
      this.ghostElement.style.top = `${y}px`;
    }
  }

  private removeGhost(): void {
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
  }
}

// Export singleton instance
export const dragManager = new DragManagerImpl();
