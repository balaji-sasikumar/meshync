import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distPagesDir = path.join(rootDir, 'dist-pages');
const splitwiseDist = path.join(rootDir, 'apps', 'splitwise', 'dist');
const bookmarksDist = path.join(rootDir, 'apps', 'bookmarks', 'dist');

// Clean and recreate dist-pages
if (fs.existsSync(distPagesDir)) {
  fs.rmSync(distPagesDir, { recursive: true, force: true });
}
fs.mkdirSync(distPagesDir, { recursive: true });

// Copy splitwise app to dist-pages/splitwise
if (fs.existsSync(splitwiseDist)) {
  fs.cpSync(splitwiseDist, path.join(distPagesDir, 'splitwise'), { recursive: true });
  console.log('✓ Copied PeerSplit to dist-pages/splitwise');
} else {
  console.warn('⚠ Splitwise dist directory not found. Please run npm run build first.');
}

// Copy bookmarks app to dist-pages/bookmarks
if (fs.existsSync(bookmarksDist)) {
  fs.cpSync(bookmarksDist, path.join(distPagesDir, 'bookmarks'), { recursive: true });
  console.log('✓ Copied MeshBookmarks to dist-pages/bookmarks');
} else {
  console.warn('⚠ Bookmarks dist directory not found. Please run npm run build first.');
}

// Generate sleek landing portal HTML
const landingHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zero-Server Local-First Mesh Suite</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #070a12; color: #f1f5f9; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
  </head>
  <body class="min-h-screen flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
    <div class="max-w-5xl mx-auto px-4 py-16 flex-1 w-full space-y-12">
      <!-- Header -->
      <div class="text-center space-y-4 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Zero-Server • 100% Client-Side
        </div>
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Local-First P2P Mesh Suite
        </h1>
        <p class="text-slate-400 text-sm sm:text-base leading-relaxed">
          Decoupled architecture powered by the <code class="text-emerald-400 font-mono">@localfirst/mesh-sync</code> kernel.
          Runs entirely in your browser using Web Crypto, Yjs CRDTs, WebRTC DataChannels, and decentralized IPFS snapshots.
        </p>
      </div>

      <!-- App Launch Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- App 1: PeerSplit -->
        <div class="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-emerald-500/20">
              💳
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">PeerSplit</h2>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Expense Mesh
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                P2P Splitwise clone with pure client-side deterministic debt simplification. Computes minimal cash-flow settlements from the CRDT event log without a coordinator.
              </p>
            </div>

            <div class="space-y-1.5 text-xs text-slate-500 font-mono">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">✓</span> Cash-Flow Minimization Tree
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">✓</span> Multi-Currency & Equal Splits
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">✓</span> Visual Payoff Graph with 1-Click Settle
              </div>
            </div>
          </div>

          <div class="pt-6">
            <a
              href="./splitwise/"
              class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>Launch PeerSplit</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- App 2: MeshBookmarks -->
        <div class="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
              🔖
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">MeshBookmarks</h2>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Shared Hub
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Collaborative bookmark repository with instant peer synchronization. Features multi-tag filtering, real-time search, pinned bookmarks, and sovereign offline storage.
              </p>
            </div>

            <div class="space-y-1.5 text-xs text-slate-500 font-mono">
              <div class="flex items-center gap-2">
                <span class="text-indigo-400">✓</span> Multi-Tag Picker & Live Filter
              </div>
              <div class="flex items-center gap-2">
                <span class="text-indigo-400">✓</span> Pinning & Archive Management
              </div>
              <div class="flex items-center gap-2">
                <span class="text-indigo-400">✓</span> Favicon Resolution & Instant Launch
              </div>
            </div>
          </div>

          <div class="pt-6">
            <a
              href="./bookmarks/"
              class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Launch MeshBookmarks</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Architectural Pillars -->
      <div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
          Headless Sync Kernel Specifications
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <strong class="text-emerald-400 block mb-1">E2E Web Crypto</strong>
            <p class="text-slate-400 text-[11px]">PBKDF2 key derivation from URL hash fragments + AES-GCM 256-bit with fresh IV per transmission.</p>
          </div>
          <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <strong class="text-cyan-400 block mb-1">IndexedDB Durability</strong>
            <p class="text-slate-400 text-[11px]">Zero-latency instant boot, append-only offline delta buffering, and automated compaction.</p>
          </div>
          <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <strong class="text-indigo-400 block mb-1">WebRTC DataChannels</strong>
            <p class="text-slate-400 text-[11px]">Direct peer-to-peer binary mesh transport with symmetric vector-clock reconciliation.</p>
          </div>
          <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <strong class="text-amber-400 block mb-1">IPFS Cold Relay</strong>
            <p class="text-slate-400 text-[11px]">Debounced binary snapshots with CIDv1 (raw/sha2-256) identifiers for asynchronous rehydration.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
      Local-First Monorepo Suite • Zero Servers • 100% Client-Side Sovereign Data
    </footer>
  </body>
</html>
`;

fs.writeFileSync(path.join(distPagesDir, 'index.html'), landingHtml, 'utf8');
console.log('✓ Generated landing portal at dist-pages/index.html');
