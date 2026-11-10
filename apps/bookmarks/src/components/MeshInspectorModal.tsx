import React, { useState } from 'react';
import {
  X,
  Radio,
  Wifi,
  WifiOff,
  ShieldCheck,
  HardDrive,
  Globe,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Users,
  Settings
} from 'lucide-react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import type { SpaceMeta } from '../domain/schema.ts';

interface MeshInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  kernel: MeshKernel | null;
  status: MeshKernelStatus;
  spaceMeta: SpaceMeta | null;
  onUpdateSpaceMeta?: (meta: SpaceMeta) => void;
  onExportJson: () => void;
  onExportSnapshot?: () => void;
  onImportJson: (items: any[]) => void;
}

export const MeshInspectorModal: React.FC<MeshInspectorModalProps> = ({
  isOpen,
  onClose,
  kernel,
  status,
  spaceMeta,
  onUpdateSpaceMeta,
  onExportJson,
  onExportSnapshot,
  onImportJson
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [signalingInput, setSignalingInput] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('mesh_custom_signaling_url') || '' : ''
  );
  const [pinningInput, setPinningInput] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('mesh_custom_pinning_endpoint') || '' : ''
  );

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const handleToggleOffline = () => {
    if (kernel) {
      kernel.toggleOfflineSimulation();
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim() || !spaceMeta || !onUpdateSpaceMeta) return;
    const trimmed = newMember.trim();
    if (!spaceMeta.members.includes(trimmed)) {
      onUpdateSpaceMeta({
        ...spaceMeta,
        members: [...spaceMeta.members, trimmed]
      });
      setNewMember('');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportJson(parsed);
        }
      } catch (err) {
        alert('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const saveSettings = () => {
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
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-3xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">P2P Mesh Network</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Decentralized Zero-Server Engine</p>
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span className={`w-2 h-2 rounded-full ${status.peersCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>Direct Peers</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {status.peersCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">connected</span>
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>E2E Encryption</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">
              AES-GCM-256
            </p>
          </div>
        </div>

        {/* Offline Simulation Toggle */}
        <div className="mb-4">
          <button
            onClick={handleToggleOffline}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
              status.isSimulatedOffline
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            {status.isSimulatedOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Simulated Offline Active (Click to Reconnect)</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span>Simulate Offline Partition</span>
              </>
            )}
          </button>
        </div>

        {/* Space Members */}
        {spaceMeta && (
          <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                Space Members ({spaceMeta.members.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {spaceMeta.members.map(m => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {m}
                </span>
              ))}
            </div>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input
                type="text"
                value={newMember}
                onChange={e => setNewMember(e.target.value)}
                placeholder="Add member name..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* IPFS CID Status */}
        <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-500" />
              IPFS Cold Snapshot
            </span>
            {status.latestIpfsCid && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                CID Ready
              </span>
            )}
          </div>
          {status.latestIpfsCid ? (
            <div className="flex items-center justify-between gap-2 mt-2">
              <code className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate flex-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {status.latestIpfsCid}
              </code>
              <button
                onClick={() => handleCopyCid(status.latestIpfsCid!)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Copy CID"
              >
                {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No snapshot published yet</p>
          )}
        </div>

        {/* Export / Import Data */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Backup & Migration
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExportJson}
              className="py-2 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              Export JSON
            </button>
            <label className="py-2 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-sky-500" />
              Import JSON
              <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
            </label>
          </div>
        </div>

        {/* Advanced Relay Settings Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center justify-between py-1"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Custom Relays & Endpoints
            </span>
            <span>{showSettings ? '▲' : '▼'}</span>
          </button>
          {showSettings && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Signaling Relay Server (WebSocket)
                </label>
                <input
                  type="text"
                  value={signalingInput}
                  onChange={e => setSignalingInput(e.target.value)}
                  placeholder="wss://signaling.example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  IPFS Pinning Service (Kubo / Helia)
                </label>
                <input
                  type="text"
                  value={pinningInput}
                  onChange={e => setPinningInput(e.target.value)}
                  placeholder="https://api.pinata.cloud or local IPFS"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
              <button
                onClick={saveSettings}
                className="w-full py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Save & Reload Relay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
