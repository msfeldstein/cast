import { EventEmitter } from './EventEmitter';

/**
 * Base class for UI components with lifecycle management and automatic cleanup.
 *
 * @example
 * class MyButton extends Component {
 *   protected createElement(): HTMLElement {
 *     const btn = document.createElement('button');
 *     btn.textContent = 'Click me';
 *     return btn;
 *   }
 *
 *   protected onMount(): void {
 *     this.listen(this.element, 'click', () => console.log('clicked'));
 *   }
 * }
 */
export abstract class Component {
  protected element!: HTMLElement;
  protected mounted: boolean = false;
  private cleanupFns: (() => void)[] = [];
  private elementCreated: boolean = false;

  constructor() {
    // Element is created lazily when first accessed or when mounted
  }

  /**
   * Ensure the element is created. Call this if you need the element before mount.
   */
  protected ensureElement(): void {
    if (!this.elementCreated) {
      this.element = this.createElement();
      this.elementCreated = true;
    }
  }

  /**
   * Subclasses must implement this to create their DOM structure.
   */
  protected abstract createElement(): HTMLElement;

  /**
   * Mount this component into the DOM.
   */
  mount(parent: HTMLElement): void {
    if (this.mounted) return;
    this.ensureElement();
    parent.appendChild(this.element);
    this.mounted = true;
    this.onMount();
  }

  /**
   * Remove this component from the DOM (can be re-mounted later).
   */
  unmount(): void {
    if (!this.mounted) return;
    this.onUnmount();
    this.element.remove();
    this.mounted = false;
  }

  /**
   * Permanently destroy this component, releasing all resources.
   */
  dispose(): void {
    if (this.mounted) {
      this.unmount();
    }
    this.onDispose();
    // Run all cleanup functions
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }

  /**
   * Get the root element of this component.
   */
  getElement(): HTMLElement {
    this.ensureElement();
    return this.element;
  }

  /**
   * Check if component is currently mounted.
   */
  isMounted(): boolean {
    return this.mounted;
  }

  // ===== Lifecycle hooks for subclasses =====

  /**
   * Called after component is mounted to DOM.
   * Override to set up event listeners and subscriptions.
   */
  protected onMount(): void {}

  /**
   * Called before component is removed from DOM.
   * Override to pause animations or save state.
   */
  protected onUnmount(): void {}

  /**
   * Called when component is permanently disposed.
   * Override for additional cleanup beyond automatic listener removal.
   */
  protected onDispose(): void {}

  // ===== Helper methods for automatic cleanup =====

  /**
   * Add a DOM event listener with automatic cleanup on dispose.
   */
  protected listen<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): () => void {
    target.addEventListener(event, handler as EventListener, options);
    const cleanup = () =>
      target.removeEventListener(event, handler as EventListener, options);
    this.cleanupFns.push(cleanup);
    return cleanup;
  }

  /**
   * Add a generic event listener (for window events like 'resize').
   */
  protected listenWindow<K extends keyof WindowEventMap>(
    event: K,
    handler: (e: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): () => void {
    window.addEventListener(event, handler as EventListener, options);
    const cleanup = () =>
      window.removeEventListener(event, handler as EventListener, options);
    this.cleanupFns.push(cleanup);
    return cleanup;
  }

  /**
   * Subscribe to an EventEmitter with automatic cleanup on dispose.
   */
  protected subscribe<Events extends { [key: string]: unknown }, K extends keyof Events>(
    emitter: EventEmitter<Events>,
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    const unsub = emitter.on(event, handler);
    this.cleanupFns.push(unsub);
    return unsub;
  }

  /**
   * Register a cleanup function to run on dispose.
   */
  protected onCleanup(fn: () => void): void {
    this.cleanupFns.push(fn);
  }

  // ===== DOM helpers =====

  /**
   * Query selector within this component's element.
   */
  protected query<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector<T>(selector);
  }

  /**
   * Query selector within this component's element (throws if not found).
   */
  protected queryRequired<T extends HTMLElement>(selector: string): T {
    const el = this.element.querySelector<T>(selector);
    if (!el) {
      throw new Error(`Required element not found: ${selector}`);
    }
    return el;
  }

  /**
   * Query all matching elements within this component.
   */
  protected queryAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return this.element.querySelectorAll<T>(selector);
  }
}
