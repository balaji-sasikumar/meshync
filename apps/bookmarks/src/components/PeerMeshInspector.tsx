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
                  status.peersCount > 0 ? 'bg-indigo-400' : 'bg-amber-400'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  status.peersCount > 0 ? 'bg-indigo-500' : 'bg-amber-500'
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
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}
              >
                {status.isSimulatedOffline ? 'Partitioned' : 'Decentralized'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Room: {status.fingerprint} • {status.peersCount} peer(s) connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span>Mesh Details</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Web Crypto Sealed</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                PBKDF2-derived 256-bit AES-GCM envelope with unique IV per mutation.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <HardDrive className="w-4 h-4" />
                <span>IndexedDB Storage</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Zero-latency offline durability with automatic compaction.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <Radio className="w-4 h-4" />
                <span>WebRTC Mesh</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                DataChannels exchange state vectors & binary delta diffs with peer discovery.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                <Cpu className="w-4 h-4" />
                <span>IPFS Snapshot Relay</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Debounced binary snapshot persistence for async disconnected peers.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-semibold text-slate-300 block">Latest IPFS Snapshot CID</span>
              {status.latestIpfsCid ? (
                <div className="flex items-center gap-2 font-mono text-xs text-amber-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                  <span className="truncate max-w-xs">{status.latestIpfsCid}</span>
                  <button onClick={copyCid} className="text-slate-400 hover:text-slate-200">
                    {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-500 italic">No snapshot generated yet.</span>
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
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
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
                <Settings className="w-5 h-5 text-indigo-400" />
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
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
