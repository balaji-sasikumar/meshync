import { EncryptedEnvelope } from '../crypto/types.js';
import {
  encryptPayload,
  decryptPayload,
  base64ToBytes,
  bytesToBase64
} from '../crypto/cipher.js';
import { CRDTDocManager } from '../crdt/doc.js';
import { MultiBrokerSignaling } from './signaling.js';
import { PeerInfo, WireMessage } from './types.js';

export interface WebRTCMeshOptions {
  workspaceId: string;
  fingerprint: string;
  encryptionKey: CryptoKey;
  docManager: CRDTDocManager;
  signalingUrls?: string[];
  iceServers?: RTCIceServer[];
  onPeerChange?: (peers: PeerInfo[]) => void;
  onSnapshotAnnounce?: (cid: string, timestamp: number, peerId: string) => void;
}

interface PeerConnectionWrapper {
  peerId: string;
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  bytesSent: number;
  bytesReceived: number;
  connectedAt: number;
  lastPing: number;
  latencyMs?: number;
  isInitiator: boolean;
}

const DEFAULT_SIGNALING_URLS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com'
];

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export class WebRTCMeshTransport {
  public readonly peerId: string;
  private connections = new Map<string, PeerConnectionWrapper>();
  private signaling: MultiBrokerSignaling;
  private broadcastChannel: BroadcastChannel | null = null;
  private isDestroyed = false;
  private docUnsubscribe?: () => void;
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private heartbeatInterval?: number;
  private isPaused = false;

  constructor(private options: WebRTCMeshOptions) {
    this.peerId = this.generatePeerId();

    const signalingUrls = options.signalingUrls?.length
      ? options.signalingUrls
      : DEFAULT_SIGNALING_URLS;

    this.signaling = new MultiBrokerSignaling({
      urls: signalingUrls,
      room: options.fingerprint,
      peerId: this.peerId,
      onSignal: this.handleSignal.bind(this)
    });

    this.initBroadcastChannel();
    this.initDocSubscription();
    this.initHeartbeat();
  }

  private generatePeerId(): string {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    }
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public start(): void {
    if (this.isDestroyed || this.isPaused) return;
    this.signaling.connect();

    // Trigger instant vector-clock sync across tabs via BroadcastChannel
    this.broadcastStateVector();
  }

  /**
   * Pause mesh networking to simulate a network partition or offline mode.
   */
  public pause(): void {
    if (this.isPaused || this.isDestroyed) return;
    this.isPaused = true;

    // Close all current WebRTC peer connections
    for (const peerId of Array.from(this.connections.keys())) {
      this.cleanupPeer(peerId);
    }

    // Close signaling
    this.signaling.destroy();

    // Close BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.emitPeerChanges();
  }

  /**
   * Resume mesh networking after partition simulation, reconnecting and reconciling state.
   */
  public resume(): void {
    if (!this.isPaused || this.isDestroyed) return;
    this.isPaused = false;

    // Re-instantiate signaling
    const signalingUrls = this.options.signalingUrls?.length
      ? this.options.signalingUrls
      : DEFAULT_SIGNALING_URLS;

    this.signaling = new MultiBrokerSignaling({
      urls: signalingUrls,
      room: this.options.fingerprint,
      peerId: this.peerId,
      onSignal: this.handleSignal.bind(this)
    });

    this.initBroadcastChannel();
    this.signaling.connect();
    this.broadcastStateVector();
    this.emitPeerChanges();
  }

  public get isOfflineSimulated(): boolean {
    return this.isPaused;
  }

  /**
   * Set up local multi-tab BroadcastChannel for zero-latency peer sync within the same device.
   */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel(`localfirst_mesh_${this.options.fingerprint}`);
      this.broadcastChannel.onmessage = async (event) => {
        if (!event.data || typeof event.data !== 'object') return;
        const msg = event.data as WireMessage;
        if (msg.senderPeerId === this.peerId) return;

        await this.handleIncomingWireMessage(msg, 'broadcast-channel');
      };
    } catch (err) {
      console.warn('[WebRTCMeshTransport] BroadcastChannel not supported:', err);
    }
  }

  /**
   * Listen to local CRDT mutations and broadcast encrypted delta updates to all peers.
   */
  private initDocSubscription(): void {
    this.docUnsubscribe = this.options.docManager.subscribeToUpdates(async (event) => {
      // Do not re-broadcast updates originating from remote mesh peers
      if (
        event.origin === 'remote-mesh' ||
        event.origin === 'indexeddb-snapshot' ||
        event.origin === 'indexeddb-delta' ||
        event.origin === 'ipfs-rehydration'
      ) {
        return;
      }

      await this.broadcastUpdate(event.update);
    });
  }

  private initHeartbeat(): void {
    if (typeof setInterval === 'undefined') return;
    this.heartbeatInterval = setInterval(() => {
      this.sendPingToAll();
    }, 15000) as unknown as number;
  }

  /**
   * Encrypt and broadcast a binary delta update to all active peers and tabs.
   */
  public async broadcastUpdate(update: Uint8Array): Promise<void> {
    if (!update || update.byteLength === 0) return;

    try {
      const envelope = await encryptPayload(
        update,
        this.options.encryptionKey,
        this.options.fingerprint
      );

      const msg: WireMessage = {
        type: 'SYNC_UPDATE',
        payload: envelope,
        senderPeerId: this.peerId
      };

      this.sendWireMessageToAll(msg);
    } catch (err) {
      console.error('[WebRTCMeshTransport] Failed to encrypt/broadcast update:', err);
    }
  }

  /**
   * Broadcast an encrypted snapshot CID announcement.
   */
  public async broadcastSnapshotAnnouncement(cid: string, timestamp: number): Promise<void> {
    try {
      const payloadBytes = new TextEncoder().encode(JSON.stringify({ cid, timestamp }));
      const envelope = await encryptPayload(
        payloadBytes,
        this.options.encryptionKey,
        this.options.fingerprint
      );

      const msg: WireMessage = {
        type: 'SNAPSHOT_ANNOUNCE',
        payload: envelope,
        senderPeerId: this.peerId
      };

      this.sendWireMessageToAll(msg);
    } catch (err) {
      console.error('[WebRTCMeshTransport] Failed to broadcast snapshot CID:', err);
    }
  }

  /**
   * Send state vector to initiate symmetric vector-clock reconciliation.
   */
  private async broadcastStateVector(): Promise<void> {
    const vector = this.options.docManager.getStateVector();
    const envelope = await encryptPayload(
      vector,
      this.options.encryptionKey,
      this.options.fingerprint
    );

    const msg: WireMessage = {
      type: 'SYNC_STEP_1',
      payload: envelope,
      senderPeerId: this.peerId
    };

    this.sendWireMessageToAll(msg);
  }

  private async sendStateVectorTo(peerWrapper: PeerConnectionWrapper): Promise<void> {
    const vector = this.options.docManager.getStateVector();
    const envelope = await encryptPayload(
      vector,
      this.options.encryptionKey,
      this.options.fingerprint
    );

    const msg: WireMessage = {
      type: 'SYNC_STEP_1',
      payload: envelope,
      senderPeerId: this.peerId
    };

    this.sendWireMessage(peerWrapper, msg);
  }

  /**
   * Handle incoming signaling messages (SDP offer, answer, ICE candidates).
   */
  private async handleSignal(senderPeerId: string, signalData: unknown): Promise<void> {
    if (this.isDestroyed || senderPeerId === this.peerId) return;

    const data = signalData as Record<string, unknown>;

    // Peer announcement: polite peer pattern for WebRTC glare resolution
    if (data.type === 'announce') {
      // Deterministically decide initiator: lexicographical comparison
      const isInitiator = this.peerId > senderPeerId;
      if (isInitiator && !this.connections.has(senderPeerId)) {
        await this.createPeerConnection(senderPeerId, true);
      }
      return;
    }

    if (data.type === 'offer') {
      const sdp = data.sdp as RTCSessionDescriptionInit;
      let wrapper = this.connections.get(senderPeerId);
      if (!wrapper) {
        wrapper = await this.createPeerConnection(senderPeerId, false);
      }

      await wrapper.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush buffered ICE candidates
      const queuedCandidates = this.pendingCandidates.get(senderPeerId) || [];
      for (const cand of queuedCandidates) {
        try {
          await wrapper.pc.addIceCandidate(cand);
        } catch {}
      }
      this.pendingCandidates.delete(senderPeerId);

      const answer = await wrapper.pc.createAnswer();
      await wrapper.pc.setLocalDescription(answer);

      this.signaling.broadcastSignal({
        type: 'answer',
        target: senderPeerId,
        sdp: answer
      });
      return;
    }

    if (data.type === 'answer') {
      const wrapper = this.connections.get(senderPeerId);
      if (wrapper && wrapper.pc.signalingState !== 'stable') {
        const sdp = data.sdp as RTCSessionDescriptionInit;
        await wrapper.pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const queuedCandidates = this.pendingCandidates.get(senderPeerId) || [];
        for (const cand of queuedCandidates) {
          try {
            await wrapper.pc.addIceCandidate(cand);
          } catch {}
        }
        this.pendingCandidates.delete(senderPeerId);
      }
      return;
    }

    if (data.type === 'ice-candidate') {
      const candidateInit = data.candidate as RTCIceCandidateInit;
      const wrapper = this.connections.get(senderPeerId);

      if (wrapper && wrapper.pc.remoteDescription) {
        try {
          await wrapper.pc.addIceCandidate(candidateInit);
        } catch (err) {
          console.warn('[WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        const queued = this.pendingCandidates.get(senderPeerId) || [];
        queued.push(candidateInit);
        this.pendingCandidates.set(senderPeerId, queued);
      }
    }
  }

  /**
   * Instantiate an RTCPeerConnection for a discovered peer.
   */
  private async createPeerConnection(
    peerId: string,
    isInitiator: boolean
  ): Promise<PeerConnectionWrapper> {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC RTCPeerConnection not supported in this environment');
    }

    const iceServers = this.options.iceServers?.length
      ? this.options.iceServers
      : DEFAULT_ICE_SERVERS;

    const pc = new RTCPeerConnection({ iceServers });

    const wrapper: PeerConnectionWrapper = {
      peerId,
      pc,
      bytesSent: 0,
      bytesReceived: 0,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      isInitiator
    };

    this.connections.set(peerId, wrapper);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.broadcastSignal({
          type: 'ice-candidate',
          target: peerId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.onconnectionstatechange = () => {
      this.emitPeerChanges();
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.cleanupPeer(peerId);
      }
    };

    if (isInitiator) {
      const dc = pc.createDataChannel('localfirst-sync', {
        ordered: true
      });
      wrapper.dc = dc;
      this.setupDataChannel(dc, wrapper);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.signaling.broadcastSignal({
          type: 'offer',
          target: peerId,
          sdp: offer
        });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
        this.cleanupPeer(peerId);
      }
    } else {
      pc.ondatachannel = (event) => {
        wrapper.dc = event.channel;
        this.setupDataChannel(event.channel, wrapper);
      };
    }

    return wrapper;
  }

  /**
   * Bind event handlers to an active WebRTC RTCDataChannel.
   */
  private setupDataChannel(dc: RTCDataChannel, wrapper: PeerConnectionWrapper): void {
    dc.binaryType = 'arraybuffer';

    dc.onopen = async () => {
      this.emitPeerChanges();
      // On connection open, immediately initiate symmetric vector-clock diff exchange
      await this.sendStateVectorTo(wrapper);
    };

    dc.onclose = () => {
      this.cleanupPeer(wrapper.peerId);
    };

    dc.onerror = (err) => {
      console.warn(`[WebRTC DC Error ${wrapper.peerId}]:`, err);
      this.cleanupPeer(wrapper.peerId);
    };

    dc.onmessage = async (event) => {
      try {
        let raw = '';
        if (typeof event.data === 'string') {
          raw = event.data;
        } else if (event.data instanceof ArrayBuffer) {
          raw = new TextDecoder().decode(event.data);
        }
        if (!raw) return;

        const msg = JSON.parse(raw) as WireMessage;
        wrapper.bytesReceived += raw.length;
        await this.handleIncomingWireMessage(msg, wrapper.peerId);
      } catch (err) {
        console.error('[WebRTC DC] Failed to parse message:', err);
      }
    };
  }

  /**
   * Core protocol dispatch for incoming encrypted messages.
   */
  private async handleIncomingWireMessage(msg: WireMessage, sourceId: string): Promise<void> {
    if (msg.senderPeerId === this.peerId) return;

    try {
      // Step A: Decrypt payload using authenticated AES-GCM
      const decryptedBytes = await decryptPayload(msg.payload, this.options.encryptionKey);

      switch (msg.type) {
        case 'SYNC_STEP_1': {
          // Peer sent their state vector.
          // Compute the delta of everything we have that peer does not have.
          const peerStateVector = decryptedBytes;
          const missingDelta = this.options.docManager.getDelta(peerStateVector);

          if (missingDelta.byteLength > 0) {
            const envelope = await encryptPayload(
              missingDelta,
              this.options.encryptionKey,
              this.options.fingerprint
            );
            const responseMsg: WireMessage = {
              type: 'SYNC_STEP_2',
              payload: envelope,
              senderPeerId: this.peerId
            };

            const peerWrapper = this.connections.get(sourceId);
            if (peerWrapper) {
              this.sendWireMessage(peerWrapper, responseMsg);
            } else if (this.broadcastChannel) {
              this.broadcastChannel.postMessage(responseMsg);
            }
          }
          break;
        }

        case 'SYNC_STEP_2': {
          // Peer responded with missing delta updates. Apply them directly to our CRDT doc!
          this.options.docManager.applyUpdate(decryptedBytes, 'remote-mesh');
          break;
        }

        case 'SYNC_UPDATE': {
          // Live mutation from a peer.
          this.options.docManager.applyUpdate(decryptedBytes, 'remote-mesh');
          break;
        }

        case 'SNAPSHOT_ANNOUNCE': {
          const jsonStr = new TextDecoder().decode(decryptedBytes);
          const meta = JSON.parse(jsonStr) as { cid: string; timestamp: number };
          this.options.onSnapshotAnnounce?.(meta.cid, meta.timestamp, msg.senderPeerId);
          break;
        }

        case 'PING': {
          const pongEnvelope = await encryptPayload(
            new Uint8Array([1]),
            this.options.encryptionKey,
            this.options.fingerprint
          );
          const pongMsg: WireMessage = {
            type: 'PONG',
            payload: pongEnvelope,
            senderPeerId: this.peerId
          };
          const peer = this.connections.get(sourceId);
          if (peer) this.sendWireMessage(peer, pongMsg);
          break;
        }

        case 'PONG': {
          const peer = this.connections.get(sourceId);
          if (peer) {
            peer.latencyMs = Date.now() - peer.lastPing;
            this.emitPeerChanges();
          }
          break;
        }
      }
    } catch {
      // Failed to decrypt: Likely wrong passphrase or different workspace
    }
  }

  private sendWireMessage(peer: PeerConnectionWrapper, msg: WireMessage): void {
    if (peer.dc && peer.dc.readyState === 'open') {
      try {
        const payloadStr = JSON.stringify(msg);
        peer.dc.send(payloadStr);
        peer.bytesSent += payloadStr.length;
      } catch (err) {
        console.warn(`[WebRTC] Failed to send to ${peer.peerId}:`, err);
      }
    }
  }

  private sendWireMessageToAll(msg: WireMessage): void {
    const payloadStr = JSON.stringify(msg);

    // Send over WebRTC DataChannels
    for (const peer of this.connections.values()) {
      if (peer.dc && peer.dc.readyState === 'open') {
        try {
          peer.dc.send(payloadStr);
          peer.bytesSent += payloadStr.length;
        } catch {}
      }
    }

    // Send over BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {}
    }
  }

  private sendPingToAll(): void {
    for (const peer of this.connections.values()) {
      if (peer.dc && peer.dc.readyState === 'open') {
        peer.lastPing = Date.now();
        encryptPayload(new Uint8Array([0]), this.options.encryptionKey, this.options.fingerprint)
          .then((envelope) => {
            this.sendWireMessage(peer, {
              type: 'PING',
              payload: envelope,
              senderPeerId: this.peerId
            });
          })
          .catch(() => {});
      }
    }
  }

  public getConnectedPeers(): PeerInfo[] {
    const peers: PeerInfo[] = [];

    for (const wrapper of this.connections.values()) {
      if (wrapper.dc && wrapper.dc.readyState === 'open') {
        peers.push({
          peerId: wrapper.peerId,
          connectionState: wrapper.pc.connectionState,
          bytesSent: wrapper.bytesSent,
          bytesReceived: wrapper.bytesReceived,
          latencyMs: wrapper.latencyMs,
          connectedAt: wrapper.connectedAt
        });
      }
    }

    // Add BroadcastChannel synthetic peer indicator if active
    if (this.broadcastChannel) {
      peers.push({
        peerId: 'local-tab-channel',
        connectionState: 'broadcast-channel',
        bytesSent: 0,
        bytesReceived: 0,
        latencyMs: 0,
        connectedAt: Date.now()
      });
    }

    return peers;
  }

  private emitPeerChanges(): void {
    if (this.options.onPeerChange) {
      this.options.onPeerChange(this.getConnectedPeers());
    }
  }

  private cleanupPeer(peerId: string): void {
    const wrapper = this.connections.get(peerId);
    if (!wrapper) return;

    try {
      wrapper.dc?.close();
      wrapper.pc.close();
    } catch {}

    this.connections.delete(peerId);
    this.pendingCandidates.delete(peerId);
    this.emitPeerChanges();
  }

  public destroy(): void {
    this.isDestroyed = true;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.docUnsubscribe?.();

    for (const peerId of Array.from(this.connections.keys())) {
      this.cleanupPeer(peerId);
    }

    this.signaling.destroy();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
