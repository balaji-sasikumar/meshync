import React, { useState } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import {
  Bookmark as BookmarkIcon,
  Share2,
  PlusCircle,
  Check,
  Lock,
  Layers,
  Download
} from 'lucide-react';

interface Props {
  kernel: MeshKernel | null;
  status: MeshKernelStatus | null;
  onSwitchWorkspace: (hash: string) => void;
  onExportJson?: () => void;
  onExportSnapshot?: () => void;
}

export const Header: React.FC<Props> = ({
  kernel,
  status,
  onSwitchWorkspace,
  onExportJson,
  onExportSnapshot
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [inputHash, setInputHash] = useState('');

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createNewWorkspace = () => {
    const id = Math.random().toString(36).substring(2, 8);
    const pass = Math.random().toString(36).substring(2, 10);
    onSwitchWorkspace(`#bookmarks-${id}:${pass}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputHash.trim()) {
      let hash = inputHash.trim();
      if (!hash.startsWith('#')) hash = `#${hash}`;
      onSwitchWorkspace(hash);
      setShowModal(false);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <BookmarkIcon className="w-5 h-5 fill-white/20 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">MeshBookmarks</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                P2P CRDT Hub
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Workspace: {kernel?.credentials.workspaceId || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Workspace Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied Workspace Link!' : 'Share Secret Link'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Backup
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 space-y-1">
                <button
                  onClick={() => {
                    onExportJson?.();
                    setShowBackupMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-400 transition-colors flex items-center justify-between"
                >
                  <span>Export Plaintext JSON</span>
                  <span className="text-[10px] text-slate-500 font-mono">.json</span>
                </button>
                <button
                  onClick={() => {
                    onExportSnapshot?.();
                    setShowBackupMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-400 transition-colors flex items-center justify-between"
                >
                  <span>Export Encrypted Snapshot</span>
                  <span className="text-[10px] text-amber-500 font-mono">.bin</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Switch Workspace
          </button>

          <button
            onClick={createNewWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Hub
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Join Bookmark Workspace
            </h3>
            <p className="text-xs text-slate-400">
              Paste a URL or hash fragment (e.g. <code className="text-indigo-400">#bookmarks-team:pass123</code>).
            </p>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="#workspace:passphrase"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold"
                >
                  Join Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
