import { Component } from '../ui/Component';
import { EventEmitter } from '../ui/EventEmitter';
import { Panel, TabValueProvider } from './Panel';
import { Divider } from './Divider';
import { dragManager } from './DragManager';
import {
  LayoutNode,
  PanelNode,
  SplitNode,
  DropZone,
  TabConfig,
  createDefaultLayout,
  cloneLayout,
  removeTab,
  addTabToPanel,
  findPanelByTabId,
  addPanel,
  insertTabAtIndex,
  createPanelNode,
  createSplitNode,
} from './types';

export interface WindowManagerEvents {
  [key: string]: unknown;
  'layout:change': LayoutNode;
}

const MIN_PANEL_SIZE = 100; // px

/**
 * Tree-based window manager that supports flexible panel arrangements.
 * Panels can be split horizontally or vertically, and tabs can be
 * dragged between panels or to create new splits.
 */
export class WindowManager extends EventEmitter<WindowManagerEvents> {
  private container: HTMLElement;
  private rootElement: HTMLElement;
  private layout: LayoutNode;
  private panels: Map<string, Panel> = new Map();
  private dividers: Divider[] = [];
  private contentFactories: Map<string, () => Component> = new Map();
  private valueProvider: TabValueProvider | null = null;
  private cleanupFns: (() => void)[] = [];

  constructor(container: HTMLElement, initialLayout?: LayoutNode) {
    super();
    this.container = container;
    this.layout = initialLayout ? cloneLayout(initialLayout) : createDefaultLayout();
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'window-manager';
    this.container.appendChild(this.rootElement);

    this.render();
    this.setupDragDropHandling();
  }

  private setupDragDropHandling(): void {
    const handleDrop = dragManager.on('drop', ({ data, targetPanelId, zone }) => {
      this.handleDrop(data.tabId, data.sourcePanelId, targetPanelId, zone);
    });
    this.cleanupFns.push(handleDrop);
  }

  private handleTabDrop(targetPanelId: string, index: number): void {
    const dragData = dragManager.getDragData();
    if (!dragData) return;

    // Skip if this is a signal/layer creation drag (handled by App)
    if (dragData.createSignalType || dragData.createLayer) return;

    const { tabId } = dragData;

    // Find the tab being dragged
    const sourcePanel = findPanelByTabId(this.layout, tabId);
    if (!sourcePanel) return;

    const tab = sourcePanel.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Don't do anything if it's the same position
    if (sourcePanel.id === targetPanelId) {
      const currentIndex = sourcePanel.tabs.findIndex((t) => t.id === tabId);
      if (currentIndex === index || currentIndex === index - 1) {
        return;
      }
    }

    // Remove the tab from source
    const newLayout = removeTab(this.layout, tabId);
    if (!newLayout) return;
    this.layout = newLayout;

    // Insert the tab at the specified index
    this.layout = insertTabAtIndex(this.layout, targetPanelId, tab, index);

    // Re-render and notify
    this.render();
    this.emitLayoutChange();
  }

  private handleDrop(
    tabId: string,
    sourcePanelId: string,
    targetPanelId: string,
    zone: DropZone
  ): void {
    // Skip if this is a signal/layer creation drag (handled by App)
    const dragData = dragManager.getDragData();
    if (dragData?.createSignalType || dragData?.createLayer) return;

    // Find the tab being dragged
    const sourcePanel = findPanelByTabId(this.layout, tabId);
    if (!sourcePanel) return;

    const tab = sourcePanel.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Don't do anything if dropping on the same panel's center with a single tab
    if (sourcePanelId === targetPanelId && zone === 'center') {
      return;
    }

    // Remove the tab from source
    const newLayout = removeTab(this.layout, tabId);
    if (!newLayout) {
      // Tree became empty - shouldn't happen in normal use
      return;
    }
    this.layout = newLayout;

    // Add the tab to target
    this.layout = addTabToPanel(this.layout, targetPanelId, tab, zone);

    // Re-render and notify
    this.render();
    this.emitLayoutChange();
  }

  /**
   * Render the entire layout tree.
   */
  private render(): void {
    // Clean up existing elements
    this.cleanup();

    // Recursively render the tree
    const content = this.renderNode(this.layout);
    this.rootElement.appendChild(content);
  }

  private renderNode(node: LayoutNode): HTMLElement {
    if (node.type === 'panel') {
      return this.renderPanelNode(node);
    } else {
      return this.renderSplitNode(node);
    }
  }

  private renderPanelNode(node: PanelNode): HTMLElement {
    const container = document.createElement('div');
    container.className = 'panel-container';
    container.dataset.nodeId = node.id;

    const panel = new Panel({
      id: node.id,
      tabs: node.tabs,
      activeTabId: node.activeTabId,
    });

    // Set up content factory for the panel
    panel.setContentFactory((tabId) => {
      const factory = this.contentFactories.get(tabId);
      if (!factory) {
        // Return a placeholder component
        return new PlaceholderComponent(tabId);
      }
      return factory();
    });

    // Apply value provider if set
    if (this.valueProvider) {
      panel.setValueProvider(this.valueProvider);
    }

    // Listen for tab changes to update layout state
    panel.on('tab:change', ({ tabId }) => {
      node.activeTabId = tabId;
      this.emitLayoutChange();
    });

    // Listen for tab drops on the title bar
    panel.on('tab:drop', ({ index }) => {
      this.handleTabDrop(node.id, index);
    });

    // Listen for tab close requests
    panel.on('tab:close', ({ tabId }) => {
      this.removePanel(tabId);
    });

    panel.mount(container);
    this.panels.set(node.id, panel);

    return container;
  }

  private renderSplitNode(node: SplitNode): HTMLElement {
    const container = document.createElement('div');
    container.className = `split-container split-${node.direction}`;
    container.dataset.nodeId = node.id;

    // Render first child
    const firstChild = this.renderNode(node.first);
    firstChild.classList.add('split-first');

    // Create divider
    const dividerContainer = document.createElement('div');
    dividerContainer.className = `split-divider split-divider-${node.direction}`;

    const divider = new Divider({
      orientation: node.direction === 'horizontal' ? 'vertical' : 'horizontal',
      onResize: (delta) => this.handleDividerResize(node, container, delta),
      onDrop: () => this.handleDividerDrop(node),
    });
    divider.mount(dividerContainer);
    this.dividers.push(divider);

    // Render second child
    const secondChild = this.renderNode(node.second);
    secondChild.classList.add('split-second');

    // Append in order
    container.appendChild(firstChild);
    container.appendChild(dividerContainer);
    container.appendChild(secondChild);

    // Apply initial ratio
    this.applySplitRatio(container, node);

    return container;
  }

  private applySplitRatio(container: HTMLElement, node: SplitNode): void {
    const firstChild = container.querySelector(':scope > .split-first') as HTMLElement;
    const secondChild = container.querySelector(':scope > .split-second') as HTMLElement;

    if (!firstChild || !secondChild) return;

    const percent = node.ratio * 100;

    if (node.direction === 'horizontal') {
      firstChild.style.width = `calc(${percent}% - 3px)`;
      secondChild.style.width = `calc(${100 - percent}% - 3px)`;
      firstChild.style.height = '100%';
      secondChild.style.height = '100%';
    } else {
      firstChild.style.height = `calc(${percent}% - 3px)`;
      secondChild.style.height = `calc(${100 - percent}% - 3px)`;
      firstChild.style.width = '100%';
      secondChild.style.width = '100%';
    }
  }

  private handleDividerDrop(node: SplitNode): void {
    const dragData = dragManager.getDragData();
    if (!dragData) return;

    const { tabId, tabTitle } = dragData;

    // Don't allow dropping on self
    const sourcePanel = findPanelByTabId(this.layout, tabId);
    if (!sourcePanel) return;

    // Remove the tab from source
    const newLayout = removeTab(this.layout, tabId);
    if (!newLayout) return;
    this.layout = newLayout;

    // Create a new panel for the dropped tab
    const newPanel = createPanelNode([{ id: tabId, title: tabTitle }], tabId);

    // Insert the new panel between first and second by wrapping second in a new split
    // The new panel goes before the second child (in the middle of the divider)
    this.insertPanelAtDivider(node, newPanel);

    // End the drag operation
    dragManager.endDrag();

    // Re-render and notify
    this.render();
    this.emitLayoutChange();
  }

  private insertPanelAtDivider(node: SplitNode, newPanel: PanelNode): void {
    // Wrap the second child in a new split with the new panel
    // This inserts the new panel between first and second
    const newSplit = createSplitNode(
      node.direction,
      newPanel,
      node.second,
      0.5
    );

    // Update node's second to be the new split
    node.second = newSplit;

    // Adjust the parent ratio to give equal space
    node.ratio = node.ratio * 0.67; // Shrink first to make room
  }

  private handleDividerResize(node: SplitNode, container: HTMLElement, delta: number): void {
    const isHorizontal = node.direction === 'horizontal';
    const totalSize = isHorizontal ? container.clientWidth : container.clientHeight;

    // Calculate old sizes
    const oldSecondSize = (1 - node.ratio) * totalSize;

    const deltaRatio = delta / totalSize;
    const newRatio = Math.max(0.1, Math.min(0.9, node.ratio + deltaRatio));

    // Check minimum sizes
    const firstSize = newRatio * totalSize;
    const secondSize = (1 - newRatio) * totalSize;
    if (firstSize < MIN_PANEL_SIZE || secondSize < MIN_PANEL_SIZE) return;

    // Compensate nested splits so only adjacent panels change size
    this.compensateNestedSplits(node.second, node.direction, oldSecondSize, secondSize);

    node.ratio = newRatio;

    // Re-apply all ratios in the subtree
    this.applyAllRatios(node, container);
    this.emitLayoutChange();
  }

  /**
   * Adjust nested split ratios to maintain absolute sizes when parent space changes.
   */
  private compensateNestedSplits(
    node: LayoutNode,
    parentDirection: 'horizontal' | 'vertical',
    oldSize: number,
    newSize: number
  ): void {
    if (node.type !== 'split') return;
    if (node.direction !== parentDirection) return;

    // Maintain the absolute size of the first child
    const firstAbsoluteSize = node.ratio * oldSize;
    const newRatio = firstAbsoluteSize / newSize;

    if (newRatio > 0.05 && newRatio < 0.95) {
      const oldRatio = node.ratio;
      node.ratio = newRatio;

      // Recurse: the second child's space also changed
      const oldSecondSize = (1 - oldRatio) * oldSize;
      const newSecondSize = (1 - newRatio) * newSize;
      this.compensateNestedSplits(node.second, parentDirection, oldSecondSize, newSecondSize);
    }
  }

  /**
   * Recursively apply ratios to all splits in a subtree.
   */
  private applyAllRatios(node: SplitNode, container: HTMLElement): void {
    this.applySplitRatio(container, node);

    // Apply to nested splits
    if (node.first.type === 'split') {
      const firstContainer = container.querySelector(':scope > .split-first > .split-container') as HTMLElement;
      if (firstContainer) {
        this.applyAllRatios(node.first, firstContainer);
      }
    }

    if (node.second.type === 'split') {
      const secondContainer = container.querySelector(':scope > .split-second > .split-container') as HTMLElement;
      if (secondContainer) {
        this.applyAllRatios(node.second, secondContainer);
      }
    }
  }

  private cleanup(): void {
    // Dispose all panels
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();

    // Dispose all dividers
    for (const divider of this.dividers) {
      divider.dispose();
    }
    this.dividers = [];

    // Clear root element
    this.rootElement.innerHTML = '';
  }

  private emitLayoutChange(): void {
    this.emit('layout:change', cloneLayout(this.layout));
  }

  /**
   * Register a factory function for creating content for a specific tab ID.
   */
  registerContent(contentId: string, factory: () => Component): void {
    this.contentFactories.set(contentId, factory);

    // If this content is currently visible, trigger a re-render of that panel
    const panel = findPanelByTabId(this.layout, contentId);
    if (panel) {
      const panelInstance = this.panels.get(panel.id);
      if (panelInstance && panelInstance.getActiveTabId() === contentId) {
        panelInstance.setContentFactory((tabId) => {
          const f = this.contentFactories.get(tabId);
          if (!f) return new PlaceholderComponent(tabId);
          return f();
        });
      }
    }
  }

  /**
   * Set a value provider for tab backgrounds (used for signal values).
   */
  setValueProvider(provider: TabValueProvider): void {
    this.valueProvider = provider;
    // Apply to all existing panels
    for (const panel of this.panels.values()) {
      panel.setValueProvider(provider);
    }
  }

  /**
   * Get a panel by ID.
   */
  getPanel(id: string): Panel | undefined {
    return this.panels.get(id);
  }

  /**
   * Get the current layout tree.
   */
  getLayout(): LayoutNode {
    return cloneLayout(this.layout);
  }

  /**
   * Set a new layout tree.
   */
  setLayout(layout: LayoutNode): void {
    this.layout = cloneLayout(layout);
    this.render();
  }

  /**
   * Add a new panel to the layout.
   * Returns the new panel's ID.
   */
  addPanel(
    tab: TabConfig,
    targetPanelId?: string,
    position: 'left' | 'right' | 'top' | 'bottom' = 'bottom'
  ): string {
    const result = addPanel(this.layout, tab, targetPanelId, position);
    this.layout = result.layout;
    this.render();
    this.emitLayoutChange();
    return result.panelId;
  }

  /**
   * Remove a panel from the layout by its tab ID.
   * This removes the tab from the panel, and if the panel becomes empty,
   * removes the panel from the layout tree.
   */
  removePanel(tabId: string): void {
    const newLayout = removeTab(this.layout, tabId);
    if (newLayout) {
      this.layout = newLayout;
      this.render();
      this.emitLayoutChange();
    }
  }

  /**
   * Add a new panel at a specific target location (for drag & drop).
   */
  addPanelAtTarget(tab: TabConfig, targetPanelId: string, zone: DropZone): void {
    this.layout = addTabToPanel(this.layout, targetPanelId, tab, zone);
    this.render();
    this.emitLayoutChange();
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.cleanup();
    for (const fn of this.cleanupFns) {
      fn();
    }
    this.cleanupFns = [];
    this.rootElement.remove();
    this.clearAllListeners();
  }
}

/**
 * Placeholder component shown when no content factory is registered.
 */
class PlaceholderComponent extends Component {
  private label: string;

  constructor(label: string) {
    super();
    this.label = label;
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel-placeholder';
    el.innerHTML = `
      <div class="placeholder-text">
        <span>No content registered for: ${this.label}</span>
      </div>
    `;
    return el;
  }
}
