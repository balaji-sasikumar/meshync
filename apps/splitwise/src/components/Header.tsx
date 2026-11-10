import React, { useState } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import {
  Wallet,
  Share2,
  Copy,
  Check,
  PlusCircle,
  ExternalLink,
  Lock,
  Layers,
  Download
} from 'lucide-react';

interface Props {
  kernel: MeshKernel | null;
  status: MeshKernelStatus | null;
  onSwitchWorkspace: (hash: string) => void;
  onExportSnapshot?: () => void;
  onExportJson?: () => void;
}

export const Header: React.FC<Props> = ({
  kernel,
  status,
  onSwitchWorkspace,
  onExportSnapshot,
  onExportJson
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [newWorkspaceInput, setNewWorkspaceInput] = useState('');

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCreateNew = () => {
    // Generates a new random credentials fragment and updates window hash
    const randomHex = Math.random().toString(36).substring(2, 8);
    const pass = Math.random().toString(36).substring(2, 10);
    const hash = `#trip-${randomHex}:${pass}`;
    onSwitchWorkspace(hash);
  };

  const handleCustomSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceInput.trim()) {
      let hash = newWorkspaceInput.trim();
      if (!hash.startsWith('#')) hash = `#${hash}`;
      onSwitchWorkspace(hash);
      setShowSwitchModal(false);
      setNewWorkspaceInput('');
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* App Title & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Wallet className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">PeerSplit</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                P2P Mesh
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Workspace: {kernel?.credentials.workspaceId || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied Secret Link!' : 'Share Group Link'}
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
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>Export Plaintext JSON</span>
                  <span className="text-[10px] text-slate-500 font-mono">.json</span>
                </button>
                <button
                  onClick={() => {
                    onExportSnapshot?.();
                    setShowBackupMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>Export Encrypted Snapshot</span>
                  <span className="text-[10px] text-amber-500 font-mono">.bin</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Switch Workspace
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Group
          </button>
        </div>
      </div>

      {/* Switch Workspace Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Switch or Join Workspace
            </h3>
            <p className="text-xs text-slate-400">
              Enter the full hash fragment (e.g.{' '}
              <code className="text-emerald-400">#trip-tokyo:mypassword123</code>) or paste the shareable URL.
              The passphrase never leaves your browser.
            </p>

            <form onSubmit={handleCustomSwitch} className="space-y-3">
              <input
                type="text"
                value={newWorkspaceInput}
                onChange={(e) => setNewWorkspaceInput(e.target.value)}
                placeholder="#workspaceId:passphrase"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Join Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
