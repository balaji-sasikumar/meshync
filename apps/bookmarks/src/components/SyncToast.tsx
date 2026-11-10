import React, { useEffect, useState } from 'react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import { Wifi, Radio, HardDrive, CheckCircle2, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  type: 'peer' | 'sync' | 'storage' | 'ipfs';
  timestamp: number;
}

interface Props {
  kernel: MeshKernel | null;
  status: MeshKernelStatus | null;
}

export const SyncToast: React.FC<Props> = ({ kernel, status }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [prevPeerCount, setPrevPeerCount] = useState<number>(0);
  const [prevCid, setPrevCid] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;

    if (status.peersCount > prevPeerCount && prevPeerCount > 0) {
      addToast({
        id: `peer_${Date.now()}`,
        title: 'New WebRTC Peer Connected',
        detail: `${status.peersCount} peer(s) in active mesh`,
        type: 'peer',
        timestamp: Date.now()
      });
    }
    setPrevPeerCount(status.peersCount);

    if (status.latestIpfsCid && status.latestIpfsCid !== prevCid && prevCid !== null) {
      addToast({
        id: `cid_${Date.now()}`,
        title: 'Encrypted IPFS Snapshot Published',
        detail: `CID: ${status.latestIpfsCid.slice(0, 16)}...`,
        type: 'ipfs',
        timestamp: Date.now()
      });
    }
    setPrevCid(status.latestIpfsCid);
  }, [status]);

  useEffect(() => {
    if (!kernel) return;

    const unsubscribe = kernel.docManager.subscribeToUpdates((event) => {
      if (event.origin === 'remote-mesh') {
        addToast({
          id: `update_${Date.now()}`,
          title: 'Bookmarks Synced from Peer',
          detail: 'Symmetric vector-clock state merged without conflicts',
          type: 'sync',
          timestamp: Date.now()
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [kernel]);

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [toast, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-xl p-3 flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 fade-in"
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              {toast.type === 'peer' && <Radio className="w-4 h-4 text-indigo-400" />}
              {toast.type === 'sync' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'ipfs' && <HardDrive className="w-4 h-4 text-amber-400" />}
              {toast.type === 'storage' && <Wifi className="w-4 h-4 text-cyan-400" />}
            </div>
            <div>
              <span className="font-semibold text-slate-100 block">{toast.title}</span>
              {toast.detail && <span className="text-slate-400 text-[11px] font-mono">{toast.detail}</span>}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
