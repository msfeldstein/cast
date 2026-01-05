/**
 * Layout tree types for the customizable window manager.
 *
 * The layout is represented as a binary tree where:
 * - SplitNode: A container that splits space between two children
 * - PanelNode: A leaf node containing tabs/content
 */

export interface TabConfig {
  id: string;
  title: string;
}

export interface PanelNode {
  type: 'panel';
  id: string;
  tabs: TabConfig[];
  activeTabId: string;
}

export interface SplitNode {
  type: 'split';
  id: string;
  direction: 'horizontal' | 'vertical'; // horizontal = side-by-side, vertical = stacked
  ratio: number; // 0-1, position of divider
  first: LayoutNode;
  second: LayoutNode;
}

export type LayoutNode = SplitNode | PanelNode;

export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface DragData {
  tabId: string;
  tabTitle: string;
  sourcePanelId: string;
  /** If set, this is a drag to create a new signal rather than move an existing tab */
  createSignalType?: string;
  /** If set, this is a drag to create a new layer */
  createLayer?: boolean;
}

// Helper functions

let nextId = 1;
export function generateId(): string {
  return `node-${nextId++}`;
}

export function resetIdCounter(): void {
  nextId = 1;
}

export function createPanelNode(tabs: TabConfig[], activeTabId?: string): PanelNode {
  return {
    type: 'panel',
    id: generateId(),
    tabs,
    activeTabId: activeTabId || tabs[0]?.id || '',
  };
}

export function createSplitNode(
  direction: 'horizontal' | 'vertical',
  first: LayoutNode,
  second: LayoutNode,
  ratio = 0.5
): SplitNode {
  return {
    type: 'split',
    id: generateId(),
    direction,
    ratio,
    first,
    second,
  };
}

/**
 * Find a panel node by ID in the tree.
 */
export function findPanelById(node: LayoutNode, panelId: string): PanelNode | null {
  if (node.type === 'panel') {
    return node.id === panelId ? node : null;
  }
  return findPanelById(node.first, panelId) || findPanelById(node.second, panelId);
}

/**
 * Find a panel node containing a specific tab.
 */
export function findPanelByTabId(node: LayoutNode, tabId: string): PanelNode | null {
  if (node.type === 'panel') {
    return node.tabs.some((t) => t.id === tabId) ? node : null;
  }
  return findPanelByTabId(node.first, tabId) || findPanelByTabId(node.second, tabId);
}

/**
 * Find the parent split node of a given node.
 */
export function findParent(
  root: LayoutNode,
  targetId: string
): { parent: SplitNode; position: 'first' | 'second' } | null {
  if (root.type === 'panel') return null;

  if (root.first.id === targetId) {
    return { parent: root, position: 'first' };
  }
  if (root.second.id === targetId) {
    return { parent: root, position: 'second' };
  }

  return findParent(root.first, targetId) || findParent(root.second, targetId);
}

/**
 * Remove a tab from its panel. Returns the updated tree.
 * If the panel becomes empty, it's removed and the tree is simplified.
 */
export function removeTab(root: LayoutNode, tabId: string): LayoutNode | null {
  const panel = findPanelByTabId(root, tabId);
  if (!panel) return root;

  // Remove the tab from the panel
  panel.tabs = panel.tabs.filter((t) => t.id !== tabId);

  // If this was the active tab, switch to another
  if (panel.activeTabId === tabId) {
    panel.activeTabId = panel.tabs[0]?.id || '';
  }

  // If panel still has tabs, we're done
  if (panel.tabs.length > 0) {
    return root;
  }

  // Panel is empty - remove it from the tree
  return removePanelFromTree(root, panel.id);
}

/**
 * Remove an empty panel from the tree and simplify.
 */
export function removePanelFromTree(root: LayoutNode, panelId: string): LayoutNode | null {
  // If root is the panel to remove, return null (tree is empty)
  if (root.type === 'panel' && root.id === panelId) {
    return null;
  }

  if (root.type === 'panel') {
    return root;
  }

  // Check if first or second child is the panel to remove
  if (root.first.id === panelId) {
    return root.second;
  }
  if (root.second.id === panelId) {
    return root.first;
  }

  // Recurse into children
  const newFirst = removePanelFromTree(root.first, panelId);
  const newSecond = removePanelFromTree(root.second, panelId);

  // If a child was removed and simplified, update
  if (newFirst !== root.first) {
    if (newFirst === null) return newSecond;
    root.first = newFirst;
  }
  if (newSecond !== root.second) {
    if (newSecond === null) return newFirst;
    root.second = newSecond;
  }

  return root;
}

/**
 * Add a tab to a panel, creating a split if dropping on an edge.
 */
export function addTabToPanel(
  root: LayoutNode,
  targetPanelId: string,
  tab: TabConfig,
  dropZone: DropZone
): LayoutNode {
  if (dropZone === 'center') {
    // Add as a new tab at the end
    const panel = findPanelById(root, targetPanelId);
    if (panel) {
      panel.tabs.push(tab);
      panel.activeTabId = tab.id;
    }
    return root;
  }

  // Create a new panel for the dropped tab
  const newPanel = createPanelNode([tab], tab.id);

  // Split the target panel
  return splitPanel(root, targetPanelId, newPanel, dropZone);
}

/**
 * Insert a tab into a panel at a specific index.
 */
export function insertTabAtIndex(
  root: LayoutNode,
  targetPanelId: string,
  tab: TabConfig,
  index: number
): LayoutNode {
  const panel = findPanelById(root, targetPanelId);
  if (panel) {
    // Clamp index to valid range
    const insertIndex = Math.max(0, Math.min(index, panel.tabs.length));
    panel.tabs.splice(insertIndex, 0, tab);
    panel.activeTabId = tab.id;
  }
  return root;
}

/**
 * Split a panel by inserting a new node.
 */
export function splitPanel(
  root: LayoutNode,
  targetPanelId: string,
  newNode: LayoutNode,
  position: 'left' | 'right' | 'top' | 'bottom'
): LayoutNode {
  const direction = position === 'left' || position === 'right' ? 'horizontal' : 'vertical';
  const isFirst = position === 'left' || position === 'top';

  // Find the target panel
  if (root.type === 'panel' && root.id === targetPanelId) {
    // Root is the target - wrap in a split
    return createSplitNode(
      direction,
      isFirst ? newNode : root,
      isFirst ? root : newNode,
      0.5
    );
  }

  if (root.type === 'panel') {
    return root;
  }

  // Check if first or second is the target (only for panels, not splits)
  if (root.first.type === 'panel' && root.first.id === targetPanelId) {
    const split = createSplitNode(
      direction,
      isFirst ? newNode : root.first,
      isFirst ? root.first : newNode,
      0.5
    );
    root.first = split;
    return root;
  }

  if (root.second.type === 'panel' && root.second.id === targetPanelId) {
    const split = createSplitNode(
      direction,
      isFirst ? newNode : root.second,
      isFirst ? root.second : newNode,
      0.5
    );
    root.second = split;
    return root;
  }

  // Recurse into children - must use return values for deeply nested panels
  if (root.first.type === 'split') {
    root.first = splitPanel(root.first, targetPanelId, newNode, position);
  }
  if (root.second.type === 'split') {
    root.second = splitPanel(root.second, targetPanelId, newNode, position);
  }

  return root;
}

/**
 * Find all panel nodes in the tree.
 */
export function findAllPanels(node: LayoutNode): PanelNode[] {
  if (node.type === 'panel') {
    return [node];
  }
  return [...findAllPanels(node.first), ...findAllPanels(node.second)];
}

/**
 * Add a new panel to the layout by splitting an existing panel.
 * If targetPanelId is provided, splits that panel. Otherwise splits the last panel.
 * Returns the new panel's ID.
 */
export function addPanel(
  root: LayoutNode,
  tab: TabConfig,
  targetPanelId?: string,
  position: 'left' | 'right' | 'top' | 'bottom' = 'bottom'
): { layout: LayoutNode; panelId: string } {
  // Find target panel
  let targetId = targetPanelId;
  if (!targetId) {
    const panels = findAllPanels(root);
    targetId = panels[panels.length - 1]?.id;
  }
  if (!targetId) {
    // Tree is empty, create a single panel
    const panel = createPanelNode([tab], tab.id);
    return { layout: panel, panelId: panel.id };
  }

  // Create a new panel for the tab
  const newPanel = createPanelNode([tab], tab.id);

  // Split the target panel
  const newLayout = splitPanel(root, targetId, newPanel, position);
  return { layout: newLayout, panelId: newPanel.id };
}

/**
 * Clone a layout tree (deep copy).
 */
export function cloneLayout(node: LayoutNode): LayoutNode {
  if (node.type === 'panel') {
    return {
      ...node,
      tabs: node.tabs.map((t) => ({ ...t })),
    };
  }
  return {
    ...node,
    first: cloneLayout(node.first),
    second: cloneLayout(node.second),
  };
}

/**
 * Default layout matching the original PanelManager layout.
 */
export function createDefaultLayout(): LayoutNode {
  return createSplitNode(
    'horizontal',
    createPanelNode([{ id: 'output', title: 'Output' }], 'output'),
    createSplitNode(
      'vertical',
      createPanelNode([{ id: 'layer-1', title: 'Layer 1' }], 'layer-1'),
      createPanelNode([{ id: 'library', title: 'Library' }], 'library'),
      0.5
    ),
    0.6
  );
}
