import './ControlContextMenu.css';
import { Component } from '../ui/Component';
import { signalManager } from '../signals/SignalManager';
import { ControlTarget } from '../signals/types';

export interface ContextMenuOptions {
  target: ControlTarget;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Context menu for binding controls to signals.
 */
export class ContextMenu extends Component {
  private target: ControlTarget;
  private position: { x: number; y: number };
  private onCloseCallback: () => void;
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: ContextMenuOptions) {
    super();
    this.target = options.target;
    this.position = options.position;
    this.onCloseCallback = options.onClose;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'control-context-menu';
    el.style.cssText = `
      position: fixed;
      left: ${this.position.x}px;
      top: ${this.position.y}px;
      z-index: 10000;
    `;

    this.renderContent(el);
    return el;
  }

  private renderContent(el: HTMLElement): void {
    const signals = signalManager.getAllSignals();
    const currentBinding = signalManager.getBinding(
      this.target.layerId,
      this.target.controlName
    );

    let html = '';

    // Unbind option if currently bound
    if (currentBinding) {
      const signal = signalManager.getSignal(currentBinding.signalId);
      html += `
        <div class="menu-item unbind" data-action="unbind">
          Unbind from ${signal?.name ?? 'Unknown'}
        </div>
        <div class="menu-divider"></div>
      `;
    }

    // Signal list
    if (signals.length > 0) {
      html += `<div class="menu-label">Bind to:</div>`;
      for (const signal of signals) {
        const isActive = currentBinding?.signalId === signal.id;
        html += `
          <div class="menu-item ${isActive ? 'active' : ''}" data-action="bind" data-signal-id="${signal.id}">
            <span class="signal-badge type-${signal.type}">
              ${signal.type.charAt(0).toUpperCase()}
            </span>
            ${signal.name}
          </div>
        `;
      }
    } else {
      html += `<div class="menu-empty">No signals available. Create one in the Signals panel.</div>`;
    }

    el.innerHTML = html;
  }

  protected onMount(): void {
    // Handle clicks on menu items
    this.listen(this.element, 'click', this.handleClick.bind(this));

    // Close on click outside (with delay to avoid immediate close)
    setTimeout(() => {
      this.clickOutsideHandler = (e: MouseEvent) => {
        if (!this.element.contains(e.target as Node)) {
          this.close();
        }
      };
      document.addEventListener('mousedown', this.clickOutsideHandler);
    }, 0);

    // Close on Escape
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    // Adjust position to keep in viewport
    this.adjustPosition();
  }

  protected onUnmount(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler);
    }
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
  }

  private handleClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'unbind') {
      signalManager.unbind(this.target.layerId, this.target.controlName);
      this.close();
    } else if (action === 'bind') {
      const signalId = target.dataset.signalId;
      if (signalId) {
        signalManager.bind(this.target, signalId);
        this.close();
      }
    }
  }

  private adjustPosition(): void {
    const rect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = this.position;

    // Adjust if menu goes off right edge
    if (x + rect.width > viewportWidth - 10) {
      x = viewportWidth - rect.width - 10;
    }

    // Adjust if menu goes off bottom edge
    if (y + rect.height > viewportHeight - 10) {
      y = viewportHeight - rect.height - 10;
    }

    // Ensure not negative
    x = Math.max(10, x);
    y = Math.max(10, y);

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  private close(): void {
    this.onCloseCallback();
  }
}

/**
 * Helper function to show a context menu.
 * Returns a dispose function to close the menu.
 */
export function showContextMenu(options: ContextMenuOptions): () => void {
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    menu.dispose();
  };

  const menu = new ContextMenu({
    ...options,
    onClose: () => {
      options.onClose();
      dispose();
    },
  });
  menu.mount(document.body);

  return dispose;
}
