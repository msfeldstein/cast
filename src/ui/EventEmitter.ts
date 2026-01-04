/**
 * Typed event emitter for strongly-typed event handling.
 * Events is a record mapping event names to their payload types.
 *
 * @example
 * interface MyEvents {
 *   'change': { value: number };
 *   'reset': void;
 * }
 * const emitter = new EventEmitter<MyEvents>();
 * emitter.on('change', (data) => console.log(data.value));
 * emitter.emit('change', { value: 42 });
 */
export class EventEmitter<Events extends { [key: string]: unknown }> {
  private listeners = new Map<keyof Events, Set<(data: unknown) => void>>();

  /**
   * Subscribe to an event.
   * @returns Unsubscribe function
   */
  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (data: unknown) => void);

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event for one emission only.
   * @returns Unsubscribe function
   */
  once<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    const wrapper = (data: Events[K]) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   */
  off<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): void {
    this.listeners.get(event)?.delete(handler as (data: unknown) => void);
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }

  /**
   * Remove all listeners for all events.
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific event.
   */
  clearListeners<K extends keyof Events>(event: K): void {
    this.listeners.delete(event);
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
