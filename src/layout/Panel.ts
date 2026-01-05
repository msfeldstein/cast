import { Component } from '../ui/Component';
import { EventEmitter } from '../ui/EventEmitter';
import { dragManager } from './DragManager';
import { DropZone, TabConfig } from './types';

export type { TabConfig };

export interface PanelEvents {
  [key: string]: unknown;
  'tab:change': { tabId: string };
  'drop': { zone: DropZone };
  'tab:drop': { index: number };
  'tab:close': { tabId: string };
}

export interface PanelOptions {
  id: string;
  tabs?: TabConfig[];
  activeTabId?: string;
}

export type TabValueProvider = (tabId: string) => number | null;

const DRAG_THRESHOLD = 5; // pixels before drag starts

/**
 * A panel container that can optionally have tabs.
 * Always shows a title bar that can be dragged.
 * Shows drop zones when a drag operation is active.
 */
export class Panel extends EventEmitter<PanelEvents> {
  public readonly id: string;
  private element: HTMLElement;
  private titleBar: HTMLElement;
  private contentArea!: HTMLElement;
  private dropZonesContainer: HTMLElement | null = null;
  private tabs: TabConfig[] = [];
  private activeTabId: string | null = null;
  private mountedContent: Component | null = null;
  private contentFactory: ((tabId: string) => Component) | null = null;
  private valueProvider: TabValueProvider | null = null;
  private activeDropZone: DropZone | null = null;
  private cleanupFns: (() => void)[] = [];
  private animationFrameId: number | null = null;
  private tabDropIndicator: HTMLElement | null = null;
  private tabDropIndex: number = -1;

  constructor(options: PanelOptions) {
    super();
    this.id = options.id;
    this.tabs = options.tabs || [];
    this.activeTabId = options.activeTabId || (this.tabs.length > 0 ? this.tabs[0].id : null);
    this.element = this.createElement();
    this.titleBar = this.element.querySelector('.panel-title-bar')!;
    this.setupDragManager();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel';
    el.dataset.panelId = this.id;

    // Always create title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'panel-title-bar';

    if (this.tabs.length > 1) {
      // Multiple tabs - render as tab buttons
      titleBar.classList.add('has-tabs');
      this.renderTabsIntoTitleBar(titleBar);
    } else {
      // Single tab or no tabs - show title with value fill
      const tabId = this.tabs[0]?.id || this.id;
      const title = this.tabs[0]?.title || this.id;

      // Add value fill element
      const fillEl = document.createElement('div');
      fillEl.className = 'panel-title-fill';
      fillEl.dataset.tabId = tabId;
      titleBar.appendChild(fillEl);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'panel-title-text';
      titleSpan.textContent = title;
      titleBar.appendChild(titleSpan);
    }

    // Create tab drop indicator
    this.tabDropIndicator = document.createElement('div');
    this.tabDropIndicator.className = 'tab-drop-indicator';
    titleBar.appendChild(this.tabDropIndicator);

    el.appendChild(titleBar);

    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'panel-content';
    el.appendChild(this.contentArea);

    // Create drop zones overlay
    this.dropZonesContainer = document.createElement('div');
    this.dropZonesContainer.className = 'panel-drop-zones';
    this.dropZonesContainer.innerHTML = `
      <div class="drop-zone drop-zone-left" data-zone="left"></div>
      <div class="drop-zone drop-zone-right" data-zone="right"></div>
      <div class="drop-zone drop-zone-top" data-zone="top"></div>
      <div class="drop-zone drop-zone-bottom" data-zone="bottom"></div>
      <div class="drop-zone drop-zone-center" data-zone="center"></div>
    `;
    el.appendChild(this.dropZonesContainer);

    return el;
  }

  private renderTabsIntoTitleBar(titleBar: HTMLElement): void {
    for (const tab of this.tabs) {
      const tabEl = document.createElement('button');
      tabEl.className = 'panel-tab';
      tabEl.dataset.tabId = tab.id;

      // Add value fill element
      const fillEl = document.createElement('div');
      fillEl.className = 'panel-tab-fill';
      tabEl.appendChild(fillEl);

      // Add text
      const textEl = document.createElement('span');
      textEl.className = 'panel-tab-text';
      textEl.textContent = tab.title;
      tabEl.appendChild(textEl);

      if (tab.id === this.activeTabId) {
        tabEl.classList.add('active');
      }
      tabEl.addEventListener('click', (e) => {
        // Only switch tab if not dragging
        if (!e.defaultPrevented) {
          this.setActiveTab(tab.id);
        }
      });
      titleBar.appendChild(tabEl);
    }
  }

  private setupDragManager(): void {
    // Set up title bar drag
    this.setupTitleBarDrag();

    // Set up drop zone interactions
    this.setupDropZones();

    // Set up title bar drop handling
    this.setupTitleBarDrop();

    // Set up right-click context menu
    this.setupContextMenu();

    // Listen for drag state changes
    const unsubStart = dragManager.on('drag:start', () => {
      // Don't show drop zones on the source panel
      const dragData = dragManager.getDragData();
      if (dragData && dragData.sourcePanelId !== this.id) {
        this.element.classList.add('drag-active');
      }
    });
    this.cleanupFns.push(unsubStart);

    const unsubEnd = dragManager.on('drag:end', () => {
      this.element.classList.remove('drag-active');
      this.clearActiveDropZone();
      this.hideTabDropIndicator();
    });
    this.cleanupFns.push(unsubEnd);
  }

  private setupTitleBarDrag(): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    let dragTabId: string | null = null;
    let dragTabTitle: string | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if clicking on a tab button or the title bar itself
      const target = e.target as HTMLElement;
      const tabButton = target.closest('.panel-tab') as HTMLElement | null;

      if (tabButton) {
        dragTabId = tabButton.dataset.tabId || null;
        dragTabTitle = tabButton.textContent;
      } else if (target.closest('.panel-title-bar')) {
        // Dragging the whole panel (first tab or single content)
        dragTabId = this.tabs[0]?.id || this.id;
        dragTabTitle = this.tabs[0]?.title || this.id;
      } else {
        return;
      }

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
        // Start the drag operation
        dragManager.startDrag(
          {
            tabId: dragTabId!,
            tabTitle: dragTabTitle!,
            sourcePanelId: this.id,
          },
          e.clientX,
          e.clientY
        );
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      dragTabId = null;
      dragTabTitle = null;
    };

    this.titleBar.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    this.cleanupFns.push(() => {
      this.titleBar.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    });
  }

  private setupDropZones(): void {
    if (!this.dropZonesContainer) return;

    const zones = this.dropZonesContainer.querySelectorAll('.drop-zone');

    zones.forEach((zone) => {
      zone.addEventListener('mouseenter', () => {
        if (dragManager.isDragActive()) {
          const zoneType = (zone as HTMLElement).dataset.zone as DropZone;
          this.setActiveDropZone(zoneType);
        }
      });

      zone.addEventListener('mouseleave', () => {
        if (dragManager.isDragActive()) {
          this.clearActiveDropZone();
        }
      });

      zone.addEventListener('mouseup', () => {
        if (dragManager.isDragActive() && this.activeDropZone) {
          dragManager.drop(this.id, this.activeDropZone);
          this.emit('drop', { zone: this.activeDropZone });
        }
      });
    });
  }

  private setupTitleBarDrop(): void {
    // Handle mouse move on title bar to show drop indicator
    this.titleBar.addEventListener('mousemove', (e) => {
      if (!dragManager.isDragActive()) return;

      // Don't handle if dragging from this panel (with only one tab)
      const dragData = dragManager.getDragData();
      if (dragData?.sourcePanelId === this.id && this.tabs.length <= 1) return;

      // Calculate drop index based on mouse position
      const dropIndex = this.calculateTabDropIndex(e.clientX);
      this.showTabDropIndicator(dropIndex);
    });

    this.titleBar.addEventListener('mouseleave', () => {
      this.hideTabDropIndicator();
    });

    this.titleBar.addEventListener('mouseup', () => {
      if (dragManager.isDragActive() && this.tabDropIndex >= 0) {
        // Emit tab drop event
        this.emit('tab:drop', { index: this.tabDropIndex });
        dragManager.drop(this.id, 'center'); // Use center as fallback zone
        this.hideTabDropIndicator();
      }
    });
  }

  private setupContextMenu(): void {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Determine which tab was right-clicked
      const target = e.target as HTMLElement;
      const tabButton = target.closest('.panel-tab') as HTMLElement | null;
      let tabId: string;

      if (tabButton) {
        tabId = tabButton.dataset.tabId || this.tabs[0]?.id || this.id;
      } else {
        // Right-clicked on single-tab title bar
        tabId = this.tabs[0]?.id || this.id;
      }

      // Create and show context menu
      this.showContextMenu(e.clientX, e.clientY, tabId);
    };

    this.titleBar.addEventListener('contextmenu', handleContextMenu);
    this.cleanupFns.push(() => {
      this.titleBar.removeEventListener('contextmenu', handleContextMenu);
    });
  }

  private showContextMenu(x: number, y: number, tabId: string): void {
    // Remove any existing context menu
    const existing = document.querySelector('.panel-context-menu');
    existing?.remove();

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'panel-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const closeItem = document.createElement('button');
    closeItem.className = 'context-menu-item';
    closeItem.textContent = 'Close';
    closeItem.addEventListener('click', () => {
      this.emit('tab:close', { tabId });
      menu.remove();
    });

    menu.appendChild(closeItem);
    document.body.appendChild(menu);

    // Close menu when clicking elsewhere
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('mousedown', closeMenu);
      }
    };
    // Use setTimeout to avoid immediate closure from the contextmenu event
    setTimeout(() => {
      document.addEventListener('mousedown', closeMenu);
    }, 0);
  }

  private calculateTabDropIndex(mouseX: number): number {
    const tabs = this.titleBar.querySelectorAll('.panel-tab');

    if (tabs.length === 0) {
      // No tabs, drop at index 0
      return 0;
    }

    // Check each tab to find where to insert
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i] as HTMLElement;
      const rect = tab.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      if (mouseX < midpoint) {
        return i;
      }
    }

    // Mouse is after all tabs
    return tabs.length;
  }

  private showTabDropIndicator(index: number): void {
    if (!this.tabDropIndicator) return;

    this.tabDropIndex = index;
    this.tabDropIndicator.classList.add('visible');

    const tabs = this.titleBar.querySelectorAll('.panel-tab');

    if (tabs.length === 0) {
      // Position at start of title bar
      this.tabDropIndicator.style.left = '0px';
    } else if (index >= tabs.length) {
      // Position after last tab
      const lastTab = tabs[tabs.length - 1] as HTMLElement;
      const rect = lastTab.getBoundingClientRect();
      const titleBarRect = this.titleBar.getBoundingClientRect();
      this.tabDropIndicator.style.left = `${rect.right - titleBarRect.left}px`;
    } else {
      // Position before the tab at this index
      const tab = tabs[index] as HTMLElement;
      const rect = tab.getBoundingClientRect();
      const titleBarRect = this.titleBar.getBoundingClientRect();
      this.tabDropIndicator.style.left = `${rect.left - titleBarRect.left}px`;
    }
  }

  private hideTabDropIndicator(): void {
    if (!this.tabDropIndicator) return;
    this.tabDropIndex = -1;
    this.tabDropIndicator.classList.remove('visible');
  }

  private setActiveDropZone(zone: DropZone): void {
    this.clearActiveDropZone();
    this.activeDropZone = zone;
    if (this.dropZonesContainer) {
      const zoneEl = this.dropZonesContainer.querySelector(`[data-zone="${zone}"]`);
      zoneEl?.classList.add('active');
    }
  }

  private clearActiveDropZone(): void {
    this.activeDropZone = null;
    if (this.dropZonesContainer) {
      this.dropZonesContainer.querySelectorAll('.drop-zone').forEach((z) => {
        z.classList.remove('active');
      });
    }
  }

  /**
   * Update tabs dynamically.
   */
  setTabs(tabs: TabConfig[], activeTabId?: string): void {
    this.tabs = tabs;
    this.activeTabId = activeTabId || tabs[0]?.id || null;

    // Re-render title bar
    this.titleBar.innerHTML = '';
    this.titleBar.classList.remove('has-tabs');

    if (tabs.length > 1) {
      this.titleBar.classList.add('has-tabs');
      this.renderTabsIntoTitleBar(this.titleBar);
    } else {
      const tabId = tabs[0]?.id || this.id;
      const title = tabs[0]?.title || this.id;

      // Add value fill element
      const fillEl = document.createElement('div');
      fillEl.className = 'panel-title-fill';
      fillEl.dataset.tabId = tabId;
      this.titleBar.appendChild(fillEl);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'panel-title-text';
      titleSpan.textContent = title;
      this.titleBar.appendChild(titleSpan);
    }

    // Re-create tab drop indicator
    this.tabDropIndicator = document.createElement('div');
    this.tabDropIndicator.className = 'tab-drop-indicator';
    this.titleBar.appendChild(this.tabDropIndicator);

    // Re-mount content if we have a factory
    if (this.contentFactory && this.activeTabId) {
      this.mountContent(this.activeTabId);
    }
  }

  /**
   * Set the factory function for creating tab content.
   */
  setContentFactory(factory: (tabId: string) => Component): void {
    this.contentFactory = factory;
    // Mount initial content if we have an active tab
    if (this.activeTabId) {
      this.mountContent(this.activeTabId);
    }
  }

  /**
   * Set a value provider for tabs (for showing signal values in tab backgrounds).
   */
  setValueProvider(provider: TabValueProvider): void {
    this.valueProvider = provider;
    this.startValueUpdates();
  }

  private startValueUpdates(): void {
    if (this.animationFrameId !== null) return;

    const update = () => {
      this.updateTabValues();
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopValueUpdates(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateTabValues(): void {
    if (!this.valueProvider) return;

    // Update tab fills
    const tabFills = this.titleBar.querySelectorAll('.panel-tab-fill');
    tabFills.forEach((fill) => {
      const tabEl = fill.parentElement as HTMLElement;
      const tabId = tabEl?.dataset.tabId;
      if (tabId) {
        const value = this.valueProvider!(tabId);
        if (value !== null) {
          (fill as HTMLElement).style.width = `${value * 100}%`;
        } else {
          (fill as HTMLElement).style.width = '0%';
        }
      }
    });

    // Update single-tab title fill
    const titleFill = this.titleBar.querySelector('.panel-title-fill') as HTMLElement;
    if (titleFill) {
      const tabId = titleFill.dataset.tabId;
      if (tabId) {
        const value = this.valueProvider(tabId);
        if (value !== null) {
          titleFill.style.width = `${value * 100}%`;
        } else {
          titleFill.style.width = '0%';
        }
      }
    }
  }

  /**
   * Set content directly (for panels without tabs).
   */
  setContent(component: Component): void {
    this.unmountContent();
    this.mountedContent = component;
    component.mount(this.contentArea);
  }

  /**
   * Switch to a different tab.
   */
  setActiveTab(tabId: string): void {
    if (tabId === this.activeTabId) return;
    if (!this.tabs.find((t) => t.id === tabId)) return;

    this.activeTabId = tabId;

    // Update tab bar UI
    this.titleBar.querySelectorAll('.panel-tab').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-tab-id') === tabId);
    });

    // Mount new content
    this.mountContent(tabId);

    this.emit('tab:change', { tabId });
  }

  private mountContent(tabId: string): void {
    this.unmountContent();

    if (this.contentFactory) {
      this.mountedContent = this.contentFactory(tabId);
      this.mountedContent.mount(this.contentArea);
    }
  }

  private unmountContent(): void {
    if (this.mountedContent) {
      this.mountedContent.dispose();
      this.mountedContent = null;
    }
  }

  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  getTabs(): TabConfig[] {
    return [...this.tabs];
  }

  getElement(): HTMLElement {
    return this.element;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  dispose(): void {
    this.stopValueUpdates();
    this.unmountContent();
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
    this.element.remove();
    this.clearAllListeners();
  }
}
