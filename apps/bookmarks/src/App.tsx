import React, { useState, useMemo, useEffect } from 'react';
import { useMeshKernel, useCollection } from '@localfirst/mesh-sync';
import type { Bookmark, SpaceMeta } from './domain/schema.ts';
import { Header } from './components/Header.tsx';
import { BookmarkItem } from './components/BookmarkItem.tsx';
import { AddBookmarkModal } from './components/AddBookmarkModal.tsx';
import { TagFilter } from './components/TagFilter.tsx';
import { MeshInspectorModal } from './components/MeshInspectorModal.tsx';
import { UserOnboardingModal } from './components/UserOnboardingModal.tsx';
import { SyncToast } from './components/SyncToast.tsx';
import { Bookmark as BookmarkIcon, Loader2, ShieldAlert, Plus } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Decoupled headless mesh kernel
  const { kernel, status, isReady, error } = useMeshKernel();

  // 2. CRDT Collections
  const {
    items: spaceMetaList,
    add: addSpaceMeta,
    update: updateSpaceMeta
  } = useCollection<SpaceMeta>(kernel, 'space_meta');

  const {
    items: bookmarks,
    add: addBookmark,
    update: updateBookmark,
    remove: removeBookmark
  } = useCollection<Bookmark>(kernel, 'bookmarks');

  const spaceMeta: SpaceMeta | null = spaceMetaList[0] || null;

  // 3. Theme State (Light / Dark mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mesh_bookmarks_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mesh_bookmarks_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mesh_bookmarks_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // 4. User Identity & Onboarding State
  const workspaceId = kernel?.credentials.workspaceId || 'default';
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Detect whether opened via an existing shared link (#workspaceId:passphrase)
  const isSharedLink = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.location.hash && window.location.hash.includes(':'));
  }, []);

  useEffect(() => {
    if (!isReady || !workspaceId) return;

    const storageKey = `mesh_bookmarks_user_${workspaceId}`;
    const savedWorkspaceUser = localStorage.getItem(storageKey);
    const savedLastUser = localStorage.getItem('mesh_bookmarks_last_user');

    const isValidName = (name: string | null) => Boolean(name && name.toLowerCase() !== 'you');

    if (isValidName(savedWorkspaceUser)) {
      setCurrentUserName(savedWorkspaceUser!);
      setIsOnboardingOpen(false);
    } else if (isValidName(savedLastUser) && spaceMeta?.members?.some(m => m.toLowerCase() === savedLastUser!.toLowerCase())) {
      setCurrentUserName(savedLastUser!);
      localStorage.setItem(storageKey, savedLastUser!);
      setIsOnboardingOpen(false);
    } else {
      setIsOnboardingOpen(true);
    }
  }, [isReady, workspaceId, spaceMeta?.members]);

  const handleSelectUser = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCurrentUserName(trimmed);
    localStorage.setItem(`mesh_bookmarks_user_${workspaceId}`, trimmed);
    localStorage.setItem('mesh_bookmarks_last_user', trimmed);
    setIsOnboardingOpen(false);

    // Sync member into space_meta so other peers see the new member
    if (spaceMeta) {
      if (!spaceMeta.members.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
        updateSpaceMeta(spaceMeta.id, {
          members: [...spaceMeta.members, trimmed]
        });
      }
    } else {
      addSpaceMeta({
        id: 'space_root',
        name: 'Shared Bookmarks',
        members: [trimmed],
        createdAt: Date.now()
      });
    }
  };

  // 5. Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [initialUrl, setInitialUrl] = useState('');
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);

  // 6. Search & Filters State
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterPinned, setFilterPinned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Compute all unique tags across bookmarks
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      for (const t of b.tags || []) set.add(t);
    }
    return Array.from(set).sort();
  }, [bookmarks]);

  const activeCount = useMemo(() => {
    return bookmarks.filter(b => !b.archived).length;
  }, [bookmarks]);

  const archivedCount = useMemo(() => {
    return bookmarks.filter(b => b.archived).length;
  }, [bookmarks]);

  const pinnedCount = useMemo(() => {
    return bookmarks.filter(b => b.pinned && (!showArchived ? !b.archived : b.archived)).length;
  }, [bookmarks, showArchived]);

  // Filtered bookmarks list: pinned first, then chronological
  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter(b => {
        if (!showArchived && b.archived) return false;
        if (showArchived && !b.archived) return false;
        if (filterPinned && !b.pinned) return false;
        if (selectedTag && !b.tags.includes(selectedTag)) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(q);
          const matchUrl = b.url.toLowerCase().includes(q);
          const matchDesc = b.description?.toLowerCase().includes(q);
          const matchAuthor = b.author?.toLowerCase().includes(q);
          const matchTag = b.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchUrl && !matchDesc && !matchAuthor && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [bookmarks, selectedTag, filterPinned, searchTerm, showArchived]);

  // 7. Handlers for Bookmarks
  const handleSaveBookmark = (
    data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      updateBookmark(editId, {
        ...data,
        updatedAt: Date.now()
      });
    } else {
      addBookmark({
        ...data,
        id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        author: currentUserName || 'Anonymous',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    setIsAddModalOpen(false);
    setEditingBookmark(null);
  };

  const handleEditClick = (bm: Bookmark) => {
    setInitialUrl('');
    setEditingBookmark(bm);
    setIsAddModalOpen(true);
  };

  const isLikelyUrl = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;
    if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) return true;
    return /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(trimmed);
  };

  const handleOpenNewBookmark = async () => {
    let prefill = '';
    try {
      if (navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (isLikelyUrl(text)) {
          prefill = text;
        }
      }
    } catch {
      // Clipboard permission not granted or unavailable; proceed with normal save link flow
    }
    setEditingBookmark(null);
    setInitialUrl(prefill);
    setIsAddModalOpen(true);
  };

  const handleTogglePin = (id: string, current: boolean) => {
    updateBookmark(id, { pinned: !current, updatedAt: Date.now() });
  };

  const handleToggleArchive = (id: string, current: boolean) => {
    updateBookmark(id, { archived: !current, updatedAt: Date.now() });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `bookmarks-${workspaceId}-${Date.now()}.json`;
    a.click();
  };

  const handleImportJson = (items: any[]): number => {
    let imported = 0;
    for (const item of items) {
      if (item && item.url && item.title) {
        addBookmark({
          id: item.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: item.url,
          title: item.title,
          description: item.description || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          pinned: Boolean(item.pinned),
          archived: Boolean(item.archived),
          author: item.author || currentUserName || 'Imported',
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now()
        });
        imported++;
      }
    }
    return imported;
  };

  const handleExportSnapshot = async () => {
    if (!kernel) return;
    const meta = await kernel.ipfsRelay.createAndPublishSnapshot();
    if (meta) {
      const blockJson = await kernel.storageAdapter.getMeta<string>(`ipfs_block_${meta.cid}`);
      if (blockJson) {
        const blob = new Blob([blockJson], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meta.cid}.encrypted-snapshot.bin`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 max-w-sm text-center shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-rose-800 dark:text-rose-200">Mesh Engine Error</h2>
          <p className="text-xs text-rose-600 dark:text-rose-300/80 mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isReady || !status) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B0E14] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Connecting to P2P Mesh...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B0E14] flex justify-center transition-colors duration-200">
      {/* Seamless App Column blending naturally into the viewport */}
      <div className="w-full max-w-md bg-[#F5F7FA] dark:bg-[#0B0E14] min-h-screen flex flex-col relative">
        {/* Floating Minimal Sync Toast */}
        <SyncToast status={status} />

        {/* STICKY TOP CONTAINER: Header */}
        <div className="sticky top-0 z-30 bg-[#F5F7FA]/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-200">
          <Header
            kernel={kernel}
            status={status}
            spaceMeta={spaceMeta}
            bookmarkCount={activeCount}
            currentUserName={currentUserName}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenMeshModal={() => setIsMeshModalOpen(true)}
            onOpenSwitchUser={() => setIsOnboardingOpen(true)}
          />
        </div>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="px-4 pt-3.5 pb-24 flex-1 space-y-3.5">
          {/* Search & Filters */}
          <TagFilter
            tags={allTags}
            totalCount={activeCount}
            archivedCount={archivedCount}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            filterPinned={filterPinned}
            onToggleFilterPinned={() => setFilterPinned(p => !p)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showArchived={showArchived}
            onToggleShowArchived={() => setShowArchived(a => !a)}
            pinnedCount={pinnedCount}
          />

          {/* Bookmarks Card Feed */}
          {filteredBookmarks.length === 0 ? (
            <div className="bg-white dark:bg-[#121721] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <BookmarkIcon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                {bookmarks.length === 0 ? 'Your library is empty' : 'No matching links'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {bookmarks.length === 0
                  ? 'Tap Save link below to add your first bookmark to this encrypted P2P space.'
                  : 'Try clearing your search or selected tag filter.'}
              </p>
              {bookmarks.length === 0 && (
                <button
                  type="button"
                  onClick={handleOpenNewBookmark}
                  className="mt-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition active:scale-95 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Add First Bookmark</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBookmarks.map(bm => (
                <BookmarkItem
                  key={bm.id}
                  bookmark={bm}
                  currentUserName={currentUserName}
                  showAuthor={(spaceMeta?.members?.length || 1) > 1}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onDelete={removeBookmark}
                  onEdit={handleEditClick}
                  onSelectTag={t => setSelectedTag(t)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Anchored Primary Action Pill (checks clipboard URL automatically) */}
      <div className="fixed bottom-5 pb-[env(safe-area-inset-bottom)] left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex justify-end pointer-events-none z-30">
        <button
          type="button"
          onClick={handleOpenNewBookmark}
          className="pointer-events-auto h-9 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-slate-900/15 flex items-center gap-1.5 text-xs font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          title="Save link with title, tags, and notes"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Save link</span>
        </button>
      </div>

      {/* Add / Edit Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(null);
          setInitialUrl('');
        }}
        onSubmit={handleSaveBookmark}
        editingBookmark={editingBookmark}
        initialUrl={initialUrl}
        existingTags={allTags}
        currentUserName={currentUserName}
      />

      {/* User Onboarding / Identity Modal */}
      <UserOnboardingModal
        isOpen={isOnboardingOpen}
        currentUserName={currentUserName}
        existingMembers={spaceMeta?.members || []}
        onSelectUser={handleSelectUser}
        onClose={() => setIsOnboardingOpen(false)}
        isSharedLink={isSharedLink}
        peersCount={status?.peersCount || 0}
      />

      {/* Decentralized P2P Mesh Network Modal */}
      <MeshInspectorModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        kernel={kernel}
        status={status}
        spaceMeta={spaceMeta}
        onUpdateSpaceMeta={meta => updateSpaceMeta(meta.id, meta)}
        onExportJson={handleExportJson}
        onExportSnapshot={handleExportSnapshot}
        onImportJson={handleImportJson}
      />
    </div>
  );
};
