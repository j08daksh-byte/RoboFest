import { RealtimeEvent } from './types';

// Simple PubSub for single-instance Node.js Next.js server
// Uses globalThis to survive Next.js HMR in development

type Subscriber = (event: RealtimeEvent) => void;

class RealtimeBroker {
  private subscribers: Set<Subscriber> = new Set();
  
  // Rate limiting for telemetry specifically
  private lastTelemetryPublish: number = 0;
  private readonly TELEMETRY_THROTTLE_MS = 1000; 

  subscribe(cb: Subscriber) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  publish(event: RealtimeEvent) {
    // Throttle telemetry to prevent SSE saturation
    if (event.type === 'TELEMETRY_UPDATED') {
      const now = Date.now();
      if (now - this.lastTelemetryPublish < this.TELEMETRY_THROTTLE_MS) {
        return; // Drop excessive telemetry broadcasts
      }
      this.lastTelemetryPublish = now;
    }

    // Broadcast to all connected clients
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (err) {
        console.error('Failed to dispatch event to subscriber', err);
      }
    }
  }
}

// Ensure singleton across HMR reloads
const globalForBroker = globalThis as unknown as {
  __realtimeBroker: RealtimeBroker | undefined;
};

export const realtimeBroker = globalForBroker.__realtimeBroker ?? new RealtimeBroker();
if (process.env.NODE_ENV !== 'production') {
  globalForBroker.__realtimeBroker = realtimeBroker;
}
