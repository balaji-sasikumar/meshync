import { EncryptedEnvelope } from '../crypto/types.js';

export type MeshMessageType =
  | 'SYNC_STEP_1' // Exchange state vector
  | 'SYNC_STEP_2' // Respond with binary delta diff
  | 'SYNC_UPDATE' // Live delta mutation
  | 'SNAPSHOT_ANNOUNCE' // Announce IPFS snapshot CID
  | 'PING'
  | 'PONG';

export interface WireMessage {
  type: MeshMessageType;
  payload: EncryptedEnvelope;
  senderPeerId: string;
}

export interface SignalingMessage {
  type: 'publish' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  topic: string;
  sender?: string;
  data?: unknown;
}

export interface PeerInfo {
  peerId: string;
  connectionState: RTCPeerConnectionState | 'broadcast-channel';
  bytesSent: number;
  bytesReceived: number;
  latencyMs?: number;
  connectedAt: number;
}

export interface MeshTransportEvents {
  peerConnected: (peer: PeerInfo) => void;
  peerDisconnected: (peerId: string) => void;
  updateReceived: (update: Uint8Array, peerId: string) => void;
  snapshotAnnounced: (cid: string, timestamp: number, peerId: string) => void;
  statusChange: () => void;
}
