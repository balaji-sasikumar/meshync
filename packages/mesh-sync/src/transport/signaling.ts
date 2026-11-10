export interface SignalingBrokerOptions {
  urls: string[];
  room: string;
  peerId: string;
  onSignal: (senderPeerId: string, signalData: unknown) => void;
  onBrokerStatus?: (url: string, status: 'connected' | 'disconnected' | 'error') => void;
}

/**
 * Multi-broker resilient signaling client for WebRTC peer discovery.
 * Tries multiple public brokers concurrently or with failover, routing WebRTC SDP offers,
 * answers, and ICE candidates between peers without any server-side database.
 */
export class MultiBrokerSignaling {
  private sockets: Map<string, WebSocket> = new Map();
  private reconnectTimers: Map<string, number> = new Map();
  private isDestroyed = false;
  private hotRelayHandler?: (eventData: any) => void;

  constructor(private options: SignalingBrokerOptions) {
    this.initHotRelay();
  }

  /**
   * Set up local Vite HMR relay for instantaneous local dev signaling across
   * normal, incognito, and different browser windows without any third-party server dependency.
   */
  private initHotRelay(): void {
    if (typeof window === 'undefined') return;
    try {
      const hot = (import.meta as any)?.hot;
      if (hot && typeof hot.on === 'function') {
        this.hotRelayHandler = (payload: any) => {
          if (!payload || payload.room !== this.options.room) return;
          if (payload.from === this.options.peerId) return;

          const data = payload.data || payload;
          if (data.target && data.target !== this.options.peerId) return;

          this.options.onSignal(payload.from, data);
        };

        hot.on('mesh:signal', this.hotRelayHandler);
      }
    } catch {}
  }

  public connect(): void {
    if (this.isDestroyed || typeof WebSocket === 'undefined') return;

    for (const url of this.options.urls) {
      this.connectToBroker(url);
    }
  }

  private connectToBroker(url: string): void {
    if (this.isDestroyed) return;

    try {
      const ws = new WebSocket(url);
      this.sockets.set(url, ws);

      ws.onopen = () => {
        if (this.isDestroyed) {
          ws.close();
          return;
        }
        this.options.onBrokerStatus?.(url, 'connected');

        // Subscribe to room topic
        const subscribeMsg = JSON.stringify({
          type: 'subscribe',
          topics: [this.options.room]
        });
        ws.send(subscribeMsg);

        // Announce presence
        this.sendSignal(url, {
          type: 'announce',
          from: this.options.peerId
        });
      };

      ws.onmessage = (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : '';
          if (!raw) return;

          const msg = JSON.parse(raw);
          // Handle standard y-webrtc / custom signaling relay schema
          const payload = msg.data || msg.message;
          if ((msg.type === 'publish' || msg.type === 'pubsub') && msg.topic === this.options.room && payload) {
            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
            if (data.from && data.from !== this.options.peerId) {
              if (data.target && data.target !== this.options.peerId) {
                return; // targeted to another peer
              }
              this.options.onSignal(data.from, data);
            }
          } else if (msg.from && msg.from !== this.options.peerId) {
            if (msg.target && msg.target !== this.options.peerId) {
              return;
            }
            this.options.onSignal(msg.from, msg);
          }
        } catch {
          // Non-JSON or ping message, safely ignore
        }
      };

      ws.onerror = () => {
        this.options.onBrokerStatus?.(url, 'error');
      };

      ws.onclose = () => {
        this.options.onBrokerStatus?.(url, 'disconnected');
        this.sockets.delete(url);
        this.scheduleReconnect(url);
      };
    } catch {
      this.options.onBrokerStatus?.(url, 'error');
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string): void {
    if (this.isDestroyed) return;
    if (this.reconnectTimers.has(url)) return;

    const jitter = Math.floor(Math.random() * 2000);
    const delay = 3000 + jitter;

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(url);
      this.connectToBroker(url);
    }, delay) as unknown as number;

    this.reconnectTimers.set(url, timer);
  }

  /**
   * Broadcast or target a signal through all connected brokers and local dev relay.
   */
  public broadcastSignal(signalData: Record<string, unknown>): void {
    const payload = {
      ...signalData,
      from: this.options.peerId
    };

    // 1. Send via local dev HMR relay (reaches incognito tabs instantly)
    try {
      const hot = (import.meta as any)?.hot;
      if (hot && typeof hot.send === 'function') {
        hot.send('mesh:signal', {
          room: this.options.room,
          from: this.options.peerId,
          data: payload
        });
      }
    } catch {}

    // 2. Send via connected WebSocket signaling brokers
    const envelope = JSON.stringify({
      type: 'publish',
      topic: this.options.room,
      data: payload
    });

    for (const [url, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(envelope);
        } catch (err) {
          console.warn(`[Signaling] Failed to send via broker ${url}:`, err);
        }
      }
    }
  }

  private sendSignal(url: string, signalData: Record<string, unknown>): void {
    const ws = this.sockets.get(url);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'publish',
          topic: this.options.room,
          data: signalData
        })
      );
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    for (const ws of this.sockets.values()) {
      try {
        ws.close();
      } catch {}
    }
    this.sockets.clear();
  }
}
