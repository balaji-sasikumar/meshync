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
  Users
} from 'lucide-react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import type { GroupMeta } from '../domain/schema.ts';

interface MeshInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  kernel: MeshKernel | null;
  status: MeshKernelStatus;
  groupMeta: GroupMeta | null;
  onUpdateGroupMeta?: (meta: GroupMeta) => void;
  onExportJson: () => void;
  onExportSnapshot: () => void;
  onImportJson: (items: any[]) => void;
}

export const MeshInspectorModal: React.FC<MeshInspectorModalProps> = ({
  isOpen,
  onClose,
  kernel,
  status,
  groupMeta,
  onUpdateGroupMeta,
  onExportJson,
  onExportSnapshot,
  onImportJson
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [newMember, setNewMember] = useState('');

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
    if (!newMember.trim() || !groupMeta || !onUpdateGroupMeta) return;
    const trimmed = newMember.trim();
    if (!groupMeta.members.includes(trimmed)) {
      onUpdateGroupMeta({
        ...groupMeta,
        members: [...groupMeta.members, trimmed]
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

        {/* Offline Simulation Button */}
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
                <WifiOff className="w-4 h-4 text-rose-500" />
                <span>Offline Mode (Simulated Active) - Reconnect</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span>Simulate Offline Disconnection</span>
              </>
            )}
          </button>
        </div>

        {/* Share Group Link */}
        <div className="mb-4 p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 rounded-2xl">
          <p className="text-xs font-bold text-sky-900 dark:text-sky-300 mb-1">Encrypted Share Link</p>
          <p className="text-[11px] text-sky-700/80 dark:text-sky-400/80 mb-2">
            Keys are in the URL hash (#) and never touch any server.
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Share Link'}</span>
          </button>
        </div>

        {/* IPFS Snapshot Fallback */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>IPFS Cold Persistence</span>
            </span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
              CIDv1 raw
            </span>
          </div>

          {status.latestIpfsCid ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                <span className="truncate max-w-[200px] text-slate-600 dark:text-slate-400">
                  {status.latestIpfsCid}
                </span>
                <button
                  onClick={() => handleCopyCid(status.latestIpfsCid!)}
                  className="text-slate-400 hover:text-slate-700 ml-2"
                >
                  {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <a
                href={`https://ipfs.io/ipfs/${status.latestIpfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline block text-center mt-1"
              >
                Inspect Encrypted Snapshot on IPFS Gateway ↗
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Snapshot publishes automatically after edits.
            </p>
          )}
        </div>

        {/* Group Members Manager */}
        {groupMeta && onUpdateGroupMeta && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Group Members ({groupMeta.members.length})</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {groupMeta.members.map(m => (
                <span key={m} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {m}
                </span>
              ))}
            </div>
            <form onSubmit={handleAddMember} className="flex gap-1.5 mt-2">
              <input
                type="text"
                value={newMember}
                onChange={e => setNewMember(e.target.value)}
                placeholder="Add member..."
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMember.trim()}
                className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* Data Backup & Restore */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button
              onClick={onExportJson}
              className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <label className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
            </label>
          </div>

          <button
            onClick={onExportSnapshot}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium text-[11px]"
          >
            Export .bin
          </button>
        </div>
      </div>
    </div>
  );
};
