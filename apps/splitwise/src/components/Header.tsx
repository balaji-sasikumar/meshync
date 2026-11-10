import React, { useState } from 'react';
import {
  Radio,
  Share2,
  Check
} from 'lucide-react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import type { GroupMeta } from '../domain/schema.ts';
import { getAvatarColor } from '../domain/ui-helpers.ts';

interface HeaderProps {
  kernel: MeshKernel | null;
  status: MeshKernelStatus;
  groupMeta: GroupMeta | null;
  currentUserName: string;
  onOpenMeshModal: () => void;
  onOpenSwitchUser: () => void;
  onOpenNewGroup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  groupMeta,
  currentUserName,
  onOpenMeshModal,
  onOpenSwitchUser,
  onOpenNewGroup
}) => {
  const [copied, setCopied] = useState(false);
  const userColor = getAvatarColor(currentUserName || 'You');

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="px-5 pt-5 pb-3 flex items-center justify-between">
      {/* User Greeting & Group Subtitle */}
      <div>
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <span>Hi, {currentUserName || 'Friend'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        </p>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {groupMeta?.name || 'Split your bill'}
        </h1>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2">
        {/* Mesh Status Pill / Icon (Active mesh details hidden behind this icon as requested) */}
        <button
          onClick={onOpenMeshModal}
          title="P2P Mesh Network Details"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 text-xs font-bold transition shadow-sm active:scale-95"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status.peersCount > 0
                ? 'bg-emerald-500 animate-pulse'
                : status.isSimulatedOffline
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <Radio className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[11px] font-mono">
            {status.peersCount > 0 ? `${status.peersCount}` : 'P2P'}
          </span>
        </button>

        {/* Share Group Link Button */}
        <button
          onClick={handleShare}
          title="Copy Encrypted Share Link"
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 transition shadow-sm active:scale-95 relative"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Profile Avatar (Click to switch identity) */}
        <button
          onClick={onOpenSwitchUser}
          title={`Signed in as ${currentUserName}. Tap to switch user`}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm border-2 border-white ring-2 ring-sky-200 active:scale-95 transition ${userColor.bg} ${userColor.text}`}
        >
          {currentUserName ? currentUserName.substring(0, 2).toUpperCase() : 'ME'}
        </button>
      </div>
    </header>
  );
};
