import React, { useEffect, useState } from 'react';
import type { MeshKernelStatus } from '@localfirst/mesh-sync';

interface SyncToastProps {
  status: MeshKernelStatus;
}

export const SyncToast: React.FC<SyncToastProps> = ({ status }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prevPeerCount, setPrevPeerCount] = useState(status.peersCount);

  useEffect(() => {
    if (status.peersCount > prevPeerCount) {
      setToastMessage(`Peer joined mesh (${status.peersCount} active)`);
    } else if (status.peersCount < prevPeerCount && prevPeerCount > 0) {
      setToastMessage(`Peer left (${status.peersCount} active)`);
    }
    setPrevPeerCount(status.peersCount);
  }, [status.peersCount]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white backdrop-blur-md shadow-lg border border-white/15 text-xs font-medium flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
