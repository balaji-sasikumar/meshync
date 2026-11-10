import React, { useState } from 'react';
import {
  Bookmark,
  Radio,
  Share2,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import type { MeshKernel, MeshKernelStatus } from '@localfirst/mesh-sync';
import type { SpaceMeta } from '../domain/schema.ts';
import { getAvatarColor } from '../domain/schema.ts';

interface HeaderProps {
  kernel: MeshKernel | null;
  status: MeshKernelStatus;
  spaceMeta: SpaceMeta | null;
  currentUserName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMeshModal: () => void;
  onOpenSwitchUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  spaceMeta,
  currentUserName,
  isDark,
  onToggleTheme,
  onOpenMeshModal,
  onOpenSwitchUser
}) => {
  const [copied, setCopied] = useState(false);
  const userColor = getAvatarColor(currentUserName || 'Friend');

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
      {/* Brand Icon & Space Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25">
          <Bookmark className="w-4 h-4 fill-white/20" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            {spaceMeta?.name || 'Shared Bookmarks'}
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
            <span>By {currentUserName || 'Friend'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          </p>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        {/* Mesh Status Pill */}
        <button
          onClick={onOpenMeshModal}
          title="P2P Mesh Network Details"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm active:scale-95"
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
          <Radio className="w-3 h-3 text-slate-600 dark:text-slate-400" />
          <span className="text-[10px] font-mono">
            {status.peersCount > 0 ? `${status.peersCount}` : 'P2P'}
          </span>
        </button>

        {/* Share Space Link Button */}
        <button
          onClick={handleShare}
          title="Copy Encrypted Share Link"
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition shadow-sm active:scale-95"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenSwitchUser}
          title={`Active user: ${currentUserName}. Tap to switch`}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm border-2 border-white dark:border-slate-900 ring-1 ring-slate-300 dark:ring-slate-700 active:scale-95 transition ${userColor.bg} ${userColor.text}`}
        >
          {currentUserName ? currentUserName.substring(0, 2).toUpperCase() : 'ME'}
        </button>
      </div>
    </header>
  );
};
