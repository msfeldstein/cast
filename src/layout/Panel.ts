import { Component } from '../ui/Component';
import { EventEmitter } from '../ui/EventEmitter';

export interface TabConfig {
  id: string;
  title: string;
}

export interface PanelEvents {
  [key: string]: unknown;
  'tab:change': { tabId: string };
}

export interface PanelOptions {
  id: string;
  tabs?: TabConfig[];
  activeTabId?: string;
}

/**
 * A panel container that can optionally have tabs.
 * When tabs are provided, shows a tab bar and switches content based on active tab.
 * When no tabs, just shows content directly.
 */
export class Panel extends EventEmitter<PanelEvents> {
  public readonly id: string;
  private element: HTMLElement;
  private tabBar: HTMLElement | null = null;
  private contentArea!: HTMLElement;
  private tabs: TabConfig[] = [];
  private activeTabId: string | null = null;
  private mountedContent: Component | null = null;
  private contentFactory: ((tabId: string) => Component) | null = null;

  constructor(options: PanelOptions) {
    super();
    this.id = options.id;
    this.tabs = options.tabs || [];
    this.activeTabId = options.activeTabId || (this.tabs.length > 0 ? this.tabs[0].id : null);
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel';
    el.dataset.panelId = this.id;

    if (this.tabs.length > 0) {
      // Create tab bar
      this.tabBar = document.createElement('div');
      this.tabBar.className = 'panel-tab-bar';
      this.renderTabs();
      el.appendChild(this.tabBar);
    }

    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'panel-content';
    el.appendChild(this.contentArea);

    return el;
  }

  private renderTabs(): void {
    if (!this.tabBar) return;
    this.tabBar.innerHTML = '';

    for (const tab of this.tabs) {
      const tabEl = document.createElement('button');
      tabEl.className = 'panel-tab';
      tabEl.dataset.tabId = tab.id;
      tabEl.textContent = tab.title;
      if (tab.id === this.activeTabId) {
        tabEl.classList.add('active');
      }
      tabEl.addEventListener('click', () => this.setActiveTab(tab.id));
      this.tabBar.appendChild(tabEl);
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
    if (this.tabBar) {
      this.tabBar.querySelectorAll('.panel-tab').forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-tab-id') === tabId);
      });
    }

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
    this.unmountContent();
    this.element.remove();
    this.clearAllListeners();
  }
}
