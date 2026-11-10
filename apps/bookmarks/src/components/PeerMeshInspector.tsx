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
  Cpu
} from 'lucide-react';

interface Props {
  kernel: MeshKernel | null;
  status: MeshKernelStatus | null;
}

export const PeerMeshInspector: React.FC<Props> = ({ kernel, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);

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
                P2P Mesh Kernel: {status.peersCount > 0 ? 'Active Mesh' : 'Offline / Local-Only'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Decentralized
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
                <button
                  onClick={handleRehydrate}
                  disabled={isRehydrating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRehydrating ? 'animate-spin' : ''}`} />
                  Rehydrate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
