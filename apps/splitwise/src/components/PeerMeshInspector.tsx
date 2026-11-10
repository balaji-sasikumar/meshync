import React, { useState } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import {
  Activity,
  ShieldCheck,
  Radio,
  HardDrive,
  Copy,
  Check,
  RefreshCw,
  ServerOff,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  WifiOff,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Props {
  kernel: MeshKernel | null;
  status: MeshKernelStatus | null;
}

export const PeerMeshInspector: React.FC<Props> = ({ kernel, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [signalingInput, setSignalingInput] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('mesh_custom_signaling_url') || '' : ''
  );
  const [pinningInput, setPinningInput] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('mesh_custom_pinning_endpoint') || '' : ''
  );

  if (!kernel || !status) return null;

  const copyCid = () => {
    if (status.latestIpfsCid) {
      navigator.clipboard.writeText(status.latestIpfsCid);
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    }
  };

  const handleForceSnapshot = async () => {
    setIsRehydrating(true);
    try {
      await kernel.ipfsRelay.createAndPublishSnapshot();
    } finally {
      setIsRehydrating(false);
    }
  };

  const handleRehydrate = async () => {
    if (!status.latestIpfsCid) return;
    setIsRehydrating(true);
    try {
      await kernel.ipfsRelay.rehydrateFromCid(status.latestIpfsCid);
    } finally {
      setIsRehydrating(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  status.peersCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  status.peersCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-200">
                P2P Mesh Kernel:{' '}
                {status.isSimulatedOffline
                  ? 'Simulated Network Partition'
                  : status.peersCount > 0
                  ? 'Active Mesh'
                  : 'Offline / Local-Only'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                  status.isSimulatedOffline
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {status.isSimulatedOffline ? 'Partitioned' : 'Zero-Server'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Room: {status.fingerprint} • {status.peersCount} peer(s) connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              kernel.toggleOfflineSimulation();
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              status.isSimulatedOffline
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Disconnect WebRTC and BroadcastChannel to test offline mutations and CRDT reconciliation"
          >
            {status.isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5 text-rose-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{status.isSimulatedOffline ? 'Reconnect Mesh' : 'Simulate Offline'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <span>Details</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-4 text-xs">
          {/* 4 Pillars Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Cryptography */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>E2E Web Crypto</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                PBKDF2 (100k iters) + AES-GCM 256-bit with fresh 12-byte random IVs per message. Zero plaintext leaves browser.
              </p>
            </div>

            {/* 2. CRDT & IndexedDB */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <HardDrive className="w-4 h-4" />
                <span>IndexedDB Durability</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Local-first CRDT state stored in browser IndexedDB. Instant cold boot, offline mutation buffering & auto-compaction.
              </p>
            </div>

            {/* 3. WebRTC Mesh */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <Radio className="w-4 h-4" />
                <span>WebRTC DataChannels</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Direct peer-to-peer data transport over WebRTC with symmetric vector-clock diff exchange & BroadcastChannel fallback.
              </p>
            </div>

            {/* 4. IPFS Relay */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                <Cpu className="w-4 h-4" />
                <span>IPFS Cold Relay</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Debounced encrypted binary snapshots with content-addressed CIDv1 identifiers for async offline rejoining.
              </p>
            </div>
          </div>

          {/* WebRTC Peers List */}
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Connected Peers ({status.peers.length})</span>
              <span className="text-[11px] text-slate-500 font-mono">
                My Peer ID: {kernel.transport.peerId}
              </span>
            </div>

            {status.peers.length === 0 ? (
              <p className="text-slate-500 text-xs italic">
                No other peers active right now. Open another tab or browser with this URL hash to test real-time P2P sync!
              </p>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {status.peers.map((peer) => (
                  <div
                    key={peer.peerId}
                    className="flex items-center justify-between py-1 px-2 rounded bg-slate-950/60 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-300">{peer.peerId}</span>
                      <span className="text-[10px] text-slate-500">({peer.connectionState})</span>
                    </div>
                    <div className="text-slate-400">
                      {peer.latencyMs !== undefined && peer.latencyMs > 0
                        ? `${peer.latencyMs}ms latency`
                        : 'Local tab channel'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IPFS Snapshot Info */}
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-semibold text-slate-300 block">Latest IPFS Snapshot CID</span>
              {status.latestIpfsCid ? (
                <div className="flex items-center gap-2 font-mono text-xs text-amber-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                  <span className="truncate max-w-xs">{status.latestIpfsCid}</span>
                  <button
                    onClick={copyCid}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy CID"
                  >
                    {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-500 italic">No snapshot generated yet (waiting for mutations).</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleForceSnapshot}
                disabled={isRehydrating}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                Snapshot Now
              </button>

              {status.latestIpfsCid && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://ipfs.io/ipfs/${status.latestIpfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-1 text-xs"
                    title="View snapshot on public IPFS gateway"
                  >
                    <span>Gateway</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    onClick={handleRehydrate}
                    disabled={isRehydrating}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRehydrating ? 'animate-spin' : ''}`} />
                    Rehydrate
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Relay & Pinning Configuration"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relay & Pinning Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Relay & Pinning Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Configure custom WebRTC signaling relays or decentralized IPFS pinning endpoints.
              Settings are saved locally on this browser.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Custom WebRTC Signaling URL
                </label>
                <input
                  type="text"
                  value={signalingInput}
                  onChange={(e) => setSignalingInput(e.target.value)}
                  placeholder="e.g. wss://signaling.fly.dev or ws://localhost:4444"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  IPFS Pinning Service Endpoint
                </label>
                <input
                  type="text"
                  value={pinningInput}
                  onChange={(e) => setPinningInput(e.target.value)}
                  placeholder="e.g. https://api.pinata.cloud/pinning/pinFileToIPFS"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof localStorage !== 'undefined') {
                    if (signalingInput.trim()) {
                      localStorage.setItem('mesh_custom_signaling_url', signalingInput.trim());
                    } else {
                      localStorage.removeItem('mesh_custom_signaling_url');
                    }
                    if (pinningInput.trim()) {
                      localStorage.setItem('mesh_custom_pinning_endpoint', pinningInput.trim());
                    } else {
                      localStorage.removeItem('mesh_custom_pinning_endpoint');
                    }
                  }
                  setShowSettings(false);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
