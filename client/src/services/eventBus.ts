// path: client/src/services/eventBus.ts
// version: 1.0 (Event Bus for Cross-Component Communication)
// last-modified: 23 กันยายน 2568 16:00

// Simple event bus for cross-component communication
type EventCallback = (data?: any) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  // Subscribe to an event
  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emit an event
  emit(event: string, data?: any) {
    console.log(`[EventBus] Emitting event: ${event}`, data);
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Remove all listeners for an event
  off(event: string) {
    delete this.events[event];
  }

  // Clear all events
  clear() {
    this.events = {};
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Event constants
export const EVENTS = {
  REQUEST_STATUS_UPDATED: 'REQUEST_STATUS_UPDATED',
  REQUEST_DATA_CHANGED: 'REQUEST_DATA_CHANGED',
  REFRESH_REQUESTS_LIST: 'REFRESH_REQUESTS_LIST',
} as const;

export default eventBus;