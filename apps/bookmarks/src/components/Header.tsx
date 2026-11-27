import React from 'react';
import {
  Bookmark,
  Radio,
  ShieldCheck,
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
  bookmarkCount: number;
  currentUserName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMeshModal: () => void;
  onOpenSwitchUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  bookmarkCount,
  currentUserName,
  isDark,
  onToggleTheme,
  onOpenMeshModal,
  onOpenSwitchUser
}) => {
  const userColor = getAvatarColor(currentUserName || 'Friend');

  return (
    <header className="px-4 py-3.5 flex items-center justify-between gap-3">
      {/* Brand Icon & Space Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-600/15 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Bookmark className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-[-0.015em] leading-tight truncate">
            LinkVault
          </h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" strokeWidth={2} />
            <span className="truncate">
              {bookmarkCount} {bookmarkCount === 1 ? 'link' : 'links'} · Encrypted
            </span>
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-500 dark:text-slate-300 flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          )}
        </button>

        {/* Subtle Mesh Status Button */}
        <button
          type="button"
          onClick={onOpenMeshModal}
          title="Space, Share & P2P Mesh"
          aria-label="Space, Share & P2P Mesh"
          className="h-8 px-2.5 rounded-full bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.peersCount > 0
                ? 'bg-teal-500'
                : status.isSimulatedOffline
                ? 'bg-rose-500'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
          <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
          {status.peersCount > 0 && (
            <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-300">
              {status.peersCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          type="button"
          onClick={onOpenSwitchUser}
          title={`Active user: ${currentUserName}. Tap to switch`}
          aria-label={`Active user: ${currentUserName}. Tap to switch`}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-white dark:border-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95 transition ${userColor.bg} ${userColor.text}`}
        >
          {currentUserName ? currentUserName.substring(0, 2).toUpperCase() : 'ME'}
        </button>
      </div>
    </header>
  );
};
