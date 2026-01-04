import { Component } from '../ui/Component';
import { EventEmitter } from '../ui/EventEmitter';
import { Panel, TabConfig } from './Panel';
import { Divider } from './Divider';

export interface PanelConfig {
  id: string;
  tabs?: TabConfig[];
  activeTabId?: string;
}

export interface LayoutConfig {
  /** Main horizontal split position as percentage (0-100) */
  mainSplit: number;
  /** Right column splits as percentages [layer1, layer2, bottom] (must sum to 100) */
  rightSplits: [number, number, number];
}

export interface PanelManagerEvents {
  [key: string]: unknown;
  'layout:change': LayoutConfig;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  mainSplit: 60,
  rightSplits: [35, 35, 30],
};

const MIN_PANEL_SIZE = 100; // px

/**
 * Manages the overall panel layout with resizable dividers.
 *
 * Layout structure:
 * +------------------+-------------------+
 * |                  |    Layer 1        |
 * |     OUTPUT       +-------------------+
 * |                  |    Layer 2        |
 * |                  +-------------------+
 * |                  | Library | Signals |
 * +------------------+-------------------+
 */
export class PanelManager extends EventEmitter<PanelManagerEvents> {
  private container: HTMLElement;
  private rootElement: HTMLElement;
  private layout: LayoutConfig;
  private panels: Map<string, Panel> = new Map();
  private dividers: Divider[] = [];
  private contentFactories: Map<string, () => Component> = new Map();

  constructor(container: HTMLElement, initialLayout?: LayoutConfig) {
    super();
    this.container = container;
    this.layout = initialLayout || { ...DEFAULT_LAYOUT };
    this.rootElement = this.createElement();
    this.container.appendChild(this.rootElement);
    this.setupPanels();
    this.updateLayout();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel-manager';
    el.innerHTML = `
      <div class="panel-column panel-column-left"></div>
      <div class="divider-vertical-main"></div>
      <div class="panel-column panel-column-right">
        <div class="panel-slot panel-slot-layer1"></div>
        <div class="divider-horizontal-1"></div>
        <div class="panel-slot panel-slot-layer2"></div>
        <div class="divider-horizontal-2"></div>
        <div class="panel-slot panel-slot-bottom"></div>
      </div>
    `;
    return el;
  }

  private setupPanels(): void {
    // Output panel (left column)
    const outputPanel = new Panel({ id: 'output' });
    this.panels.set('output', outputPanel);
    const leftCol = this.rootElement.querySelector('.panel-column-left')!;
    outputPanel.mount(leftCol as HTMLElement);

    // Layer 1 panel
    const layer1Panel = new Panel({ id: 'layer-1' });
    this.panels.set('layer-1', layer1Panel);
    const layer1Slot = this.rootElement.querySelector('.panel-slot-layer1')!;
    layer1Panel.mount(layer1Slot as HTMLElement);

    // Layer 2 panel
    const layer2Panel = new Panel({ id: 'layer-2' });
    this.panels.set('layer-2', layer2Panel);
    const layer2Slot = this.rootElement.querySelector('.panel-slot-layer2')!;
    layer2Panel.mount(layer2Slot as HTMLElement);

    // Bottom panel with tabs (Library + Signals)
    const bottomPanel = new Panel({
      id: 'bottom',
      tabs: [
        { id: 'library', title: 'Library' },
        { id: 'signals', title: 'Signals' },
      ],
      activeTabId: 'library',
    });
    this.panels.set('bottom', bottomPanel);
    const bottomSlot = this.rootElement.querySelector('.panel-slot-bottom')!;
    bottomPanel.mount(bottomSlot as HTMLElement);

    // Setup dividers
    this.setupDividers();
  }

  private setupDividers(): void {
    // Main vertical divider (between left and right columns)
    const mainDivider = new Divider({
      orientation: 'vertical',
      onResize: (delta) => this.handleMainDividerResize(delta),
    });
    const mainDividerSlot = this.rootElement.querySelector('.divider-vertical-main')!;
    mainDivider.mount(mainDividerSlot as HTMLElement);
    this.dividers.push(mainDivider);

    // Horizontal divider 1 (between layer1 and layer2)
    const hDivider1 = new Divider({
      orientation: 'horizontal',
      onResize: (delta) => this.handleRightDividerResize(0, delta),
    });
    const hDivider1Slot = this.rootElement.querySelector('.divider-horizontal-1')!;
    hDivider1.mount(hDivider1Slot as HTMLElement);
    this.dividers.push(hDivider1);

    // Horizontal divider 2 (between layer2 and bottom)
    const hDivider2 = new Divider({
      orientation: 'horizontal',
      onResize: (delta) => this.handleRightDividerResize(1, delta),
    });
    const hDivider2Slot = this.rootElement.querySelector('.divider-horizontal-2')!;
    hDivider2.mount(hDivider2Slot as HTMLElement);
    this.dividers.push(hDivider2);
  }

  private handleMainDividerResize(delta: number): void {
    const containerWidth = this.container.clientWidth;
    const deltaPercent = (delta / containerWidth) * 100;
    const newSplit = Math.max(20, Math.min(80, this.layout.mainSplit + deltaPercent));

    // Check minimum sizes
    const leftWidth = (newSplit / 100) * containerWidth;
    const rightWidth = containerWidth - leftWidth;
    if (leftWidth < MIN_PANEL_SIZE || rightWidth < MIN_PANEL_SIZE) return;

    this.layout.mainSplit = newSplit;
    this.updateLayout();
    this.emitLayoutChange();
  }

  private handleRightDividerResize(dividerIndex: number, delta: number): void {
    const rightColumn = this.rootElement.querySelector('.panel-column-right') as HTMLElement;
    const totalHeight = rightColumn.clientHeight;
    const deltaPercent = (delta / totalHeight) * 100;

    const splits = [...this.layout.rightSplits] as [number, number, number];

    if (dividerIndex === 0) {
      // Divider between layer1 and layer2
      splits[0] += deltaPercent;
      splits[1] -= deltaPercent;
    } else {
      // Divider between layer2 and bottom
      splits[1] += deltaPercent;
      splits[2] -= deltaPercent;
    }

    // Validate minimum sizes
    const minPercent = (MIN_PANEL_SIZE / totalHeight) * 100;
    if (splits.some((s) => s < minPercent)) return;

    this.layout.rightSplits = splits;
    this.updateLayout();
    this.emitLayoutChange();
  }

  private updateLayout(): void {
    const root = this.rootElement;

    // Set main split (left/right columns)
    root.style.setProperty('--main-split', `${this.layout.mainSplit}%`);

    // Set right column splits
    const [layer1, layer2, bottom] = this.layout.rightSplits;
    root.style.setProperty('--layer1-height', `${layer1}%`);
    root.style.setProperty('--layer2-height', `${layer2}%`);
    root.style.setProperty('--bottom-height', `${bottom}%`);
  }

  private emitLayoutChange(): void {
    this.emit('layout:change', { ...this.layout });
  }

  /**
   * Register a factory function for creating content for a specific tab/panel.
   */
  registerContent(contentId: string, factory: () => Component): void {
    this.contentFactories.set(contentId, factory);

    // If this is for a panel without tabs, set content directly
    const panel = this.panels.get(contentId);
    if (panel && panel.getTabs().length === 0) {
      panel.setContent(factory());
    }

    // For tabbed panels, set up the content factory
    for (const [, p] of this.panels) {
      const tabs = p.getTabs();
      if (tabs.some((t) => t.id === contentId)) {
        p.setContentFactory((tabId) => {
          const f = this.contentFactories.get(tabId);
          if (!f) throw new Error(`No content factory for tab: ${tabId}`);
          return f();
        });
      }
    }
  }

  /**
   * Get a panel by ID.
   */
  getPanel(id: string): Panel | undefined {
    return this.panels.get(id);
  }

  /**
   * Get the current layout configuration.
   */
  getLayout(): LayoutConfig {
    return { ...this.layout };
  }

  /**
   * Set the layout configuration.
   */
  setLayout(config: LayoutConfig): void {
    this.layout = { ...config };
    this.updateLayout();
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    for (const divider of this.dividers) {
      divider.dispose();
    }
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.rootElement.remove();
    this.clearAllListeners();
  }
}
