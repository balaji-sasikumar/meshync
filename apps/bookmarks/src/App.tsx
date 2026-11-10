import React, { useState, useMemo } from 'react';
import { useMeshKernel, useCollection } from '@localfirst/mesh-sync';
import type { Bookmark } from './domain/schema.ts';
import { Header } from './components/Header.tsx';
import { PeerMeshInspector } from './components/PeerMeshInspector.tsx';
import { BookmarkForm } from './components/BookmarkForm.tsx';
import { BookmarkCard } from './components/BookmarkCard.tsx';
import { TagFilter } from './components/TagFilter.tsx';
import { Bookmark as BookmarkIcon, Loader2, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { kernel, status, isReady, error } = useMeshKernel();

  // Strongly-typed reactive collection abstraction
  const {
    items: bookmarks,
    add: addBookmark,
    update: updateBookmark,
    remove: removeBookmark
  } = useCollection<Bookmark>(kernel, 'bookmarks');

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Compute all unique tags across all stored bookmarks
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      for (const t of b.tags) set.add(t);
    }
    return Array.from(set).sort();
  }, [bookmarks]);

  // Filtered bookmarks list: pinned first, then chronological
  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => {
        if (!showArchived && b.archived) return false;
        if (showArchived && !b.archived) return false;

        if (selectedTag && !b.tags.includes(selectedTag)) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(q);
          const matchUrl = b.url.toLowerCase().includes(q);
          const matchDesc = b.description?.toLowerCase().includes(q);
          const matchTag = b.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchUrl && !matchDesc && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned bookmarks first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [bookmarks, selectedTag, searchTerm, showArchived]);

  const handleAddBookmark = (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    addBookmark({
      ...data,
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  };

  const handleTogglePin = (id: string, current: boolean) => {
    updateBookmark(id, { pinned: !current, updatedAt: Date.now() });
  };

  const handleToggleArchive = (id: string, current: boolean) => {
    updateBookmark(id, { archived: !current, updatedAt: Date.now() });
  };

  const handleSwitchWorkspace = (newHash: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = newHash;
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `bookmarks-${kernel?.credentials.workspaceId || 'backup'}-${Date.now()}.json`;
    a.click();
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-rose-200">Mesh Sync Initialization Error</h2>
          <p className="text-xs text-rose-300/80 mt-1 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-slate-300">Initializing Mesh Engine...</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">Deriving Keys & Loading Local Storage</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Header
        kernel={kernel}
        status={status}
        onSwitchWorkspace={handleSwitchWorkspace}
        onExportJson={handleExportJson}
        onExportSnapshot={handleExportSnapshot}
      />

      <main className="max-w-6xl mx-auto px-4 pb-16 flex-1 w-full">
        {/* Peer Mesh Inspector */}
        <PeerMeshInspector kernel={kernel} status={status} />

        {/* Add Bookmark Form */}
        <BookmarkForm onAddBookmark={handleAddBookmark} existingTags={allTags} />

        {/* Filter Bar */}
        <TagFilter
          tags={allTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived(!showArchived)}
          totalCount={bookmarks.length}
          filteredCount={filteredBookmarks.length}
        />

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-2">
            <BookmarkIcon className="w-10 h-10 mx-auto text-slate-700" />
            <p className="font-semibold text-sm text-slate-400">No bookmarks found</p>
            <p className="text-xs text-slate-600">
              {bookmarks.length === 0
                ? 'Save your first link above to synchronize across tabs and peers!'
                : 'No links match your current search and tag filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookmarks.map((bm) => (
              <BookmarkCard
                key={bm.id}
                bookmark={bm}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                onDelete={removeBookmark}
                onSelectTag={(t) => setSelectedTag(t)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        MeshBookmarks • Zero-Server Local-First Architecture • Web Crypto + Yjs CRDT + WebRTC + IPFS
      </footer>
    </div>
  );
};
