import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Wifi,
  WifiOff,
  ShieldCheck,
  Globe,
  Download,
  Upload,
  Copy,
  Check,
  Users,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Receipt,
  LayoutGrid,
  Plus,
  Share2,
  ExternalLink
} from 'lucide-react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import type { SpaceMeta } from '../domain/schema.ts';
import { getAvatarColor } from '../domain/schema.ts';

interface MeshInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  kernel: MeshKernel | null;
  status: MeshKernelStatus;
  spaceMeta: SpaceMeta | null;
  onUpdateSpaceMeta?: (meta: SpaceMeta) => void;
  onExportJson: () => void;
  onExportSnapshot?: () => void;
  onImportJson: (items: any[]) => number | void;
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmNewSpace, setConfirmNewSpace] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmReset(false);
      setConfirmNewSpace(false);
      setImportNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof window === 'undefined') return;
    if (canNativeShare) {
      try {
        await navigator.share({
          title: spaceMeta?.name || 'Shared Bookmarks',
          text: 'Join my encrypted P2P bookmarks space:',
          url: window.location.href
        });
        return;
      } catch {
        // User cancelled or share failed; fall back silently
      }
    }
    handleCopyLink();
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
    if (!spaceMeta.members.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
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
    setImportNotice(null);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          const count = onImportJson(parsed);
          setImportNotice({
            type: 'ok',
            text: typeof count === 'number' ? `Imported ${count} bookmark${count === 1 ? '' : 's'}.` : 'Bookmarks imported.'
          });
        } else {
          setImportNotice({ type: 'err', text: 'Invalid JSON backup format.' });
        }
      } catch {
        setImportNotice({ type: 'err', text: 'Could not parse JSON backup file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetEverything = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof window !== 'undefined') {
      if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(dbs => {
          dbs.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
          window.location.hash = '';
          window.location.reload();
        }).catch(() => {
          window.location.hash = '';
          window.location.reload();
        });
      } else {
        window.location.hash = '';
        window.location.reload();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 max-h-[88dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-3.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                {spaceMeta?.name || 'Space & Network'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    status.isSimulatedOffline
                      ? 'bg-rose-500'
                      : status.peersCount > 0
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {status.isSimulatedOffline
                    ? 'Offline simulation active'
                    : status.peersCount > 0
                    ? `${status.peersCount} ${status.peersCount === 1 ? 'peer' : 'peers'} connected · Encrypted`
                    : 'Waiting for peers · Encrypted'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5 space-y-3.5 sm:space-y-4 overflow-y-auto overscroll-contain">
          {/* 1. Primary Action: Invite Friends / Share Link */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <div className="mb-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Invite Friends</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Share this link so friends join directly. Keys stay inside the URL fragment.
              </p>
            </div>
            {canNativeShare ? (
              <div className="flex gap-2">
                <button
                  onClick={handleNativeShare}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4" strokeWidth={1.75} />
                  <span>Share Invite Link</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  title="Copy link"
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border active:scale-[0.98] shrink-0 ${
                    copiedLink
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.75} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleCopyLink}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                  copiedLink
                    ? 'bg-teal-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.75} />}
                <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Encrypted Share Link'}</span>
              </button>
            )}
          </div>

          {/* 2. Space Members */}
          {spaceMeta && (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  <span>Members</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {spaceMeta.members.length} total
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {spaceMeta.members.map(m => {
                  const color = getAvatarColor(m);
                  return (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${color.bg} ${color.text}`}
                      >
                        {m.substring(0, 2).toUpperCase()}
                      </span>
                      <span>{m}</span>
                    </span>
                  );
                })}
              </div>

              <form onSubmit={handleAddMember} className="flex gap-1.5">
                <input
                  type="text"
                  value={newMember}
                  onChange={e => setNewMember(e.target.value)}
                  placeholder="Add member name..."
                  className="flex-1 min-w-0 px-3 py-2 text-base sm:text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMember.trim()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl text-xs font-semibold transition shrink-0"
                >
                  Add
                </button>
              </form>
            </div>
          )}

          {/* 3. Collapsible More, Backup & Diagnostics */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(prev => !prev)}
              className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 transition"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                <span>Backup, Apps & Diagnostics</span>
              </span>
              <span className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>AES-256</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {showAdvanced && (
              <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                {/* Export / Import JSON */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onExportJson}
                    className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500" />
                    <span>Export JSON</span>
                  </button>
                  <label className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-sky-500" />
                    <span>Import JSON</span>
                    <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
                  </label>
                </div>
                {importNotice && (
                  <p className={`text-[11px] font-medium text-center ${importNotice.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {importNotice.text}
                  </p>
                )}

                {/* Quick App Links */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="../splitwise/"
                    className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                    <span>PeerSplit</span>
                  </a>
                  <a
                    href="../"
                    className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition flex items-center justify-center gap-1.5"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                    <span>All Apps</span>
                  </a>
                </div>

                {/* Offline Simulation */}
                <button
                  onClick={handleToggleOffline}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    status.isSimulatedOffline
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {status.isSimulatedOffline ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                      <span>Simulated Offline — Reconnect</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Simulate Offline Mode</span>
                    </>
                  )}
                </button>

                {/* IPFS CID */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>IPFS Snapshot</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">CIDv1 raw</span>
                  </div>

                  {status.latestIpfsCid ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-mono">
                        <span className="truncate text-slate-600 dark:text-slate-400">
                          {status.latestIpfsCid}
                        </span>
                        <button
                          onClick={() => handleCopyCid(status.latestIpfsCid!)}
                          className="text-slate-400 hover:text-sky-500 ml-2 shrink-0"
                        >
                          {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <a
                          href={`https://ipfs.io/ipfs/${status.latestIpfsCid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>View on Gateway</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {onExportSnapshot && (
                          <button
                            onClick={onExportSnapshot}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                          >
                            Export .bin
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Snapshot publishes automatically after edits.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. Workspace Reset / New Space */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {confirmNewSpace ? (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Create a brand new space?
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setConfirmNewSpace(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = '';
                      window.location.reload();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setConfirmReset(false);
                  setConfirmNewSpace(true);
                }}
                className="w-full py-2 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-sky-500" />
                <span>Create New Space</span>
              </button>
            )}

            {confirmReset ? (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Wipe all local data & start fresh?
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetEverything}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold"
                  >
                    Wipe & Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setConfirmNewSpace(false);
                  setConfirmReset(true);
                }}
                className="w-full py-2 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Everything & Start Fresh</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
