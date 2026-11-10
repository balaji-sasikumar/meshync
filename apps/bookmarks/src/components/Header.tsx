import React, { useState, useEffect } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import {
  parseHashCredentials,
  formatHashCredentials,
  getWorkspacesHistory,
  WorkspaceHistoryItem
} from '@localfirst/mesh-sync';
import {
  Bookmark as BookmarkIcon,
  Share2,
  Copy,
  Check,
  PlusCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  Layers,
  Download,
  History,
  ArrowRight
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWsId, setCopiedWsId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);

  const [switchMode, setSwitchMode] = useState<'link' | 'manual'>('link');
  const [inputLinkOrHash, setInputLinkOrHash] = useState('');
  const [inputWsId, setInputWsId] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<WorkspaceHistoryItem[]>([]);

  useEffect(() => {
    if (showSwitchModal) {
      setHistoryList(getWorkspacesHistory());
    }
  }, [showSwitchModal]);

  const workspaceId = kernel?.credentials.workspaceId || '';
  const passphrase = kernel?.credentials.passphrase || '';

  const getFullShareUrl = () => {
    if (typeof window === 'undefined' || !workspaceId || !passphrase) return '';
    return `${window.location.origin}${window.location.pathname}#${workspaceId}:${passphrase}`;
  };

  const copyShareLink = () => {
    const url = getFullShareUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const copyWorkspaceIdOnly = () => {
    if (workspaceId) {
      navigator.clipboard.writeText(workspaceId);
      setCopiedWsId(true);
      setTimeout(() => setCopiedWsId(false), 2000);
    }
  };

  const copyPassphraseOnly = () => {
    if (passphrase) {
      navigator.clipboard.writeText(passphrase);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const createNewWorkspace = () => {
    const id = Math.random().toString(36).substring(2, 8);
    const pass = Math.random().toString(36).substring(2, 10);
    onSwitchWorkspace(`#bookmarks-${id}:${pass}`);
  };

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSwitchError(null);

    if (switchMode === 'link') {
      const parsed = parseHashCredentials(inputLinkOrHash.trim());
      if (parsed) {
        onSwitchWorkspace(formatHashCredentials(parsed));
        setShowSwitchModal(false);
        setInputLinkOrHash('');
      } else {
        setSwitchError('Invalid format. Please enter either the full URL or #workspaceId:passphrase');
      }
    } else {
      const ws = inputWsId.trim();
      const pass = inputPass.trim();
      if (!ws || !pass) {
        setSwitchError('Both Workspace ID and Passphrase are required.');
        return;
      }
      onSwitchWorkspace(`#${ws}:${pass}`);
      setShowSwitchModal(false);
      setInputWsId('');
      setInputPass('');
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white flex-shrink-0">
            <BookmarkIcon className="w-5 h-5 fill-white/20 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">MeshBookmarks</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                P2P CRDT Hub
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <Lock className="w-3 h-3 text-indigo-400" />
                <span className="text-slate-300 font-semibold">{workspaceId || 'Loading...'}</span>
                <button
                  type="button"
                  onClick={copyWorkspaceIdOnly}
                  className="text-slate-500 hover:text-slate-300 ml-0.5"
                  title="Copy Workspace ID"
                >
                  {copiedWsId ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <Key className="w-3 h-3 text-indigo-400" />
                <span className="text-slate-400">
                  {showPassphrase ? passphrase : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-slate-500 hover:text-slate-300"
                  title={showPassphrase ? 'Hide key' : 'Show key'}
                >
                  {showPassphrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={copyPassphraseOnly}
                  className="text-slate-500 hover:text-slate-300"
                  title="Copy Key"
                >
                  {copiedPass ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied Full Share Link!' : 'Share Group Link'}
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
            onClick={() => setShowSwitchModal(true)}
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

      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Switch or Join Workspace
              </h3>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSwitchMode('link')}
                className={`pb-2 border-b-2 transition-colors ${
                  switchMode === 'link'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Paste Full Link / Hash
              </button>
              <button
                type="button"
                onClick={() => setSwitchMode('manual')}
                className={`pb-2 border-b-2 transition-colors ${
                  switchMode === 'manual'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Enter ID & Passphrase
              </button>
            </div>

            <form onSubmit={handleSwitchSubmit} className="space-y-3">
              {switchMode === 'link' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Hub Link or Hash Fragment
                  </label>
                  <input
                    type="text"
                    required
                    value={inputLinkOrHash}
                    onChange={(e) => setInputLinkOrHash(e.target.value)}
                    placeholder="http://localhost:5174/#bookmarks-xxx:passphrase or #bookmarks-xxx:passphrase"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    You can paste the entire URL copied from another tab or device.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Workspace ID
                    </label>
                    <input
                      type="text"
                      required
                      value={inputWsId}
                      onChange={(e) => setInputWsId(e.target.value)}
                      placeholder="e.g. bookmarks-abc123"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Secret Key / Passphrase
                    </label>
                    <input
                      type="text"
                      required
                      value={inputPass}
                      onChange={(e) => setInputPass(e.target.value)}
                      placeholder="e.g. 9c4621ed5ab17876"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {switchError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  {switchError}
                </p>
              )}

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
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Open Hub
                </button>
              </div>
            </form>

            {historyList.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  Recent Workspaces on This Browser
                </span>

                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {historyList.map((item) => (
                    <div
                      key={item.workspaceId}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-slate-200 block">
                          {item.workspaceId}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[200px]">
                          Key: {item.passphrase}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSwitchWorkspace(formatHashCredentials(item));
                          setShowSwitchModal(false);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
