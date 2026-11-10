import React, { useState, useEffect } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import {
  parseHashCredentials,
  formatHashCredentials,
  getWorkspacesHistory,
  WorkspaceHistoryItem
} from '@localfirst/mesh-sync';
import {
  Wallet,
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
  onExportSnapshot?: () => void;
  onExportJson?: () => void;
  onImportJson?: (data: any[]) => void;
}

export const Header: React.FC<Props> = ({
  kernel,
  status,
  onSwitchWorkspace,
  onExportSnapshot,
  onExportJson,
  onImportJson
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWsId, setCopiedWsId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);

  // Switch form states
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

  const handleCreateNew = () => {
    const randomHex = Math.random().toString(36).substring(2, 8);
    const pass = Math.random().toString(36).substring(2, 10);
    onSwitchWorkspace(`#trip-${randomHex}:${pass}`);
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
        {/* Brand & Security Credentials Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 flex-shrink-0">
            <Wallet className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">PeerSplit</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                P2P Mesh
              </span>
            </div>

            {/* Display Credentials with 1-click copy */}
            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono flex-wrap">
              {/* Workspace ID */}
              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-300 font-semibold">{workspaceId || 'Loading...'}</span>
                <button
                  type="button"
                  onClick={copyWorkspaceIdOnly}
                  className="text-slate-500 hover:text-slate-300 ml-0.5"
                  title="Copy Workspace ID"
                >
                  {copiedWsId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Passphrase */}
              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <Key className="w-3 h-3 text-emerald-400" />
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
                  {copiedPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
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

                <label className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between cursor-pointer">
                  <span>Import Data / Backup</span>
                  <span className="text-[10px] text-emerald-400 font-mono">upload</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            if (Array.isArray(parsed)) {
                              onImportJson?.(parsed);
                            }
                          } catch (err) {
                            alert('Failed to parse JSON file');
                          }
                        };
                        reader.readAsText(file);
                      }
                      setShowBackupMenu(false);
                    }}
                  />
                </label>
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

      {/* Switch Workspace Modal with History */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
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

            {/* Mode selection */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSwitchMode('link')}
                className={`pb-2 border-b-2 transition-colors ${
                  switchMode === 'link'
                    ? 'border-emerald-400 text-emerald-400'
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
                    ? 'border-emerald-400 text-emerald-400'
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
                    Group Link or Hash Fragment
                  </label>
                  <input
                    type="text"
                    required
                    value={inputLinkOrHash}
                    onChange={(e) => setInputLinkOrHash(e.target.value)}
                    placeholder="http://localhost:5173/#ws-xxx:passphrase or #ws-xxx:passphrase"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
                      placeholder="e.g. ws-87c6cb52"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Open Workspace
                </button>
              </div>
            </form>

            {/* Recent Workspaces History (So user never loses an old workspace!) */}
            {historyList.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-400" />
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
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
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
