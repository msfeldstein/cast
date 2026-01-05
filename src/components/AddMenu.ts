import './AddMenu.css';
import { Component } from '../ui/Component';
import { SignalType } from '../signals';
import { dragManager } from '../layout/DragManager';

const DRAG_THRESHOLD = 5;

export interface AddMenuOptions {
  onAddSignal: (type: SignalType) => void;
  onAddLayer: () => void;
}

const SIGNAL_OPTIONS: { type: SignalType; icon: string; label: string }[] = [
  { type: 'lfo', icon: '~', label: 'LFO' },
  { type: 'microphone', icon: '🎤', label: 'Microphone' },
  { type: 'beat', icon: '♪', label: 'Beat Detector' },
  { type: 'midi', icon: '⎆', label: 'MIDI' },
  { type: 'gamepad', icon: '⎈', label: 'Gamepad' },
];

/**
 * Floating plus button that opens a menu for adding signals and layers.
 */
export class AddMenu extends Component {
  private onAddSignal: (type: SignalType) => void;
  private onAddLayer: () => void;
  private menuOpen = false;
  private menuElement: HTMLElement | null = null;

  constructor(options: AddMenuOptions) {
    super();
    this.onAddSignal = options.onAddSignal;
    this.onAddLayer = options.onAddLayer;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'add-menu-container';

    // Plus button
    const button = document.createElement('button');
    button.className = 'add-menu-button';
    button.innerHTML = '+';
    button.title = 'Add signal or layer';
    el.appendChild(button);

    // Dropdown menu
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'add-menu-dropdown';
    this.menuElement.innerHTML = this.renderMenuContent();
    el.appendChild(this.menuElement);

    return el;
  }

  private renderMenuContent(): string {
    const signalItems = SIGNAL_OPTIONS.map(
      (opt) => `
      <button class="add-menu-item" data-signal-type="${opt.type}">
        <span class="add-menu-item-icon">${opt.icon}</span>
        <span class="add-menu-item-label">${opt.label}</span>
      </button>
    `
    ).join('');

    return `
      <div class="add-menu-section">
        <div class="add-menu-section-title">Signals</div>
        ${signalItems}
      </div>
      <div class="add-menu-divider"></div>
      <div class="add-menu-section">
        <button class="add-menu-item" data-action="add-layer">
          <span class="add-menu-item-icon">▢</span>
          <span class="add-menu-item-label">New Layer</span>
        </button>
      </div>
    `;
  }

  protected onMount(): void {
    const button = this.element.querySelector('.add-menu-button')!;

    // Toggle menu on button click
    this.listen(button, 'click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Set up drag handling for signal items
    this.setupSignalDrag();

    // Set up drag handling for layer item
    this.setupLayerDrag();

    // Close menu when clicking outside
    this.listen(document, 'click', (e) => {
      if (this.menuOpen && !this.element.contains(e.target as Node)) {
        this.closeMenu();
      }
    });

    // Close menu on escape
    this.listen(document, 'keydown', (e) => {
      if (this.menuOpen && (e as KeyboardEvent).key === 'Escape') {
        this.closeMenu();
      }
    });
  }

  private setupSignalDrag(): void {
    const signalItems = this.menuElement!.querySelectorAll('[data-signal-type]');

    signalItems.forEach((item) => {
      const el = item as HTMLElement;
      const type = el.dataset.signalType as SignalType;
      const label = SIGNAL_OPTIONS.find((o) => o.type === type)?.label || type;

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let hasMoved = false;

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!hasMoved && distance > DRAG_THRESHOLD) {
          hasMoved = true;
          this.closeMenu();
          // Start drag with createSignalType
          dragManager.startDrag(
            {
              tabId: `new-${type}`,
              tabTitle: label,
              sourcePanelId: '',
              createSignalType: type,
            },
            e.clientX,
            e.clientY
          );
        }
      };

      const handleMouseUp = () => {
        if (isDragging && !hasMoved) {
          // Click without drag - create signal in default location
          this.onAddSignal(type);
          this.closeMenu();
        }
        isDragging = false;
      };

      el.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      this.onCleanup(() => {
        el.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      });
    });
  }

  private setupLayerDrag(): void {
    const layerItem = this.menuElement!.querySelector('[data-action="add-layer"]') as HTMLElement;
    if (!layerItem) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!hasMoved && distance > DRAG_THRESHOLD) {
        hasMoved = true;
        this.closeMenu();
        // Start drag with createLayer flag
        dragManager.startDrag(
          {
            tabId: 'new-layer',
            tabTitle: 'New Layer',
            sourcePanelId: '',
            createLayer: true,
          },
          e.clientX,
          e.clientY
        );
      }
    };

    const handleMouseUp = () => {
      if (isDragging && !hasMoved) {
        // Click without drag - create layer in default location
        this.onAddLayer();
        this.closeMenu();
      }
      isDragging = false;
    };

    layerItem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    this.onCleanup(() => {
      layerItem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    });
  }

  private toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  private openMenu(): void {
    this.menuOpen = true;
    this.element.classList.add('open');
  }

  private closeMenu(): void {
    this.menuOpen = false;
    this.element.classList.remove('open');
  }
}
