# Zero-Server Local-First Mesh Monorepo

> **Production-ready, zero-server local-first monorepo decoupling a reusable headless synchronization engine (`@localfirst/mesh-sync`) from client-facing application layers.**

This architecture eliminates all custom backend servers, managed databases, and cloud infrastructure costs. The system operates entirely client-side using a peer-to-peer torrent-style mesh with decentralized asynchronous fallback storage.

---

## 🏛 System Architecture & Decoupled Layers

```
+-----------------------------------------------------------------------------------+
|                              CLIENT FRONTENDS                                     |
|                                                                                   |
|    +----------------------------------+    +----------------------------------+   |
|    |      P2P Splitwise Clone         |    |       Shared Bookmark Hub        |   |
|    |      (`apps/splitwise`)          |    |       (`apps/bookmarks`)         |   |
|    |  - Expense CRDT Schema           |    |  - Bookmark CRDT Schema          |   |
|    |  - Cash-Flow Minimization Tree   |    |  - Search & Tag-Filtered Grid    |   |
|    |  - Optimal Debt Payoffs          |    |  - Pinned & Archive States       |   |
|    +----------------------------------+    +----------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         │
                   Typed Collection API (add, update, delete, get, observe)
                                         ▼
+-----------------------------------------------------------------------------------+
|               HEADLESS SYNC KERNEL (`@localfirst/mesh-sync`)                       |
|                                                                                   |
|  +-------------------------+  +--------------------------+  +-------------------+ |
|  |  Identity & Web Crypto  |  |  Local Storage Adapter   |  |   CRDT Engine     | |
|  |  - URL Hash Credentials |  |  - IndexedDB Persistence |  |   - Yjs Doc Sync  | |
|  |  - PBKDF2 (100k iters)  |  |  - Zero-Latency Boot     |  |   - State Vectors | |
|  |  - AES-GCM 256-bit + IV |  |  - Offline Delta Buffer  |  |   - Symmetric     | |
|  |  - Sealed Envelopes     |  |  - Auto-Compaction       |  |     Delta Diffs   | |
|  +-------------------------+  +--------------------------+  +-------------------+ |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  |        Real-Time WebRTC Mesh        |  |    IPFS Cold Relay & Persistence   |  |
|  |  - WebRTC DataChannels (P2P)        |  |  - "All peers offline" fallback    |  |
|  |  - Multi-Broker Signaling Relay     |  |  - Debounced Encrypted Snapshots   |  |
|  |  - Polite Peer Glare Resolution    |  |  - CIDv1 (raw/sha2-256) Multihash  |  |
|  |  - Local BroadcastChannel Sync      |  |  - Async Rehydration & Pinning     |  |
|  +-------------------------------------+  +------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 📦 Monorepo Workspace Layout

```
.
├── package.json                          # Monorepo workspaces config
├── tsconfig.base.json                    # Strict TypeScript base configuration
├── packages/
│   └── mesh-sync/                        # Headless Sync Kernel (`@localfirst/mesh-sync`)
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.test.json
│       ├── src/
│       │   ├── crypto/
│       │   │   ├── cipher.ts             # PBKDF2 + AES-GCM 256-bit encryption with fresh IVs
│       │   │   └── types.ts              # EncryptedEnvelope protocol schema
│       │   ├── identity/
│       │   │   └── credentials.ts        # Zero-leakage URL hash `#workspaceId:passphrase`
│       │   ├── crdt/
│       │   │   └── doc.ts                # CRDT vector clocks, binary deltas, and state export
│       │   ├── storage/
│       │   │   └── indexeddb-adapter.ts  # Workspace-isolated IndexedDB with auto-compaction
│       │   ├── transport/
│       │   │   ├── types.ts              # Wire message definitions
│       │   │   ├── signaling.ts          # Resilient multi-broker signaling client
│       │   │   └── webrtc-mesh.ts        # WebRTC DataChannels + BroadcastChannel sync
│       │   ├── relay/
│       │   │   └── ipfs-relay.ts         # IPFS snapshot debouncing, CIDv1, and rehydration
│       │   ├── collection/
│       │   │   ├── types.ts              # Collection abstraction interface
│       │   │   └── collection.ts         # Reactive CRDTCollection implementation
│       │   ├── react/
│       │   │   └── index.ts              # `useMeshKernel` & `useCollection` React hooks
│       │   ├── kernel.ts                 # MeshKernel lifecycle orchestrator
│       │   └── index.ts                  # Public package entrypoint
│       └── test/
│           └── kernel.test.ts            # Unit tests for crypto, CRDT, and CID generation
└── apps/
    ├── splitwise/                        # App 1: P2P Splitwise Clone
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── src/
    │   │   ├── domain/
    │   │   │   ├── schema.ts             # Expense, participant, and settlement types
    │   │   │   └── debt-simplification.ts# Greedy cash-flow minimization algorithm
    │   │   ├── components/
    │   │   │   ├── Header.tsx            # Workspace hash sharing & switching
    │   │   │   ├── PeerMeshInspector.tsx # Real-time WebRTC, crypto & IPFS diagnostics
    │   │   │   ├── ExpenseForm.tsx       # Expense creation with auto-split
    │   │   │   ├── ExpenseList.tsx       # Transaction history with filtering
    │   │   │   ├── DebtSettlementView.tsx# Net balance trees & visual payoff graph
    │   │   │   └── StatsCard.tsx         # Group statistics & saved transactions
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   └── test/
    │       └── debt-simplification.test.ts# Min-flow algorithm test suite
    └── bookmarks/                        # App 2: Shared Bookmark Hub
        ├── package.json
        ├── vite.config.ts
        ├── src/
        │   ├── domain/
        │   │   └── schema.ts             # Bookmark schema with tags and flags
        │   ├── components/
        │   │   ├── Header.tsx
        │   │   ├── BookmarkCard.tsx      # Favicon, pin/archive toggles, tags
        │   │   ├── BookmarkForm.tsx      # Add bookmark modal
        │   │   ├── TagFilter.tsx         # Multi-tag filter and instant search
        │   │   └── PeerMeshInspector.tsx # Kernel diagnostics
        │   ├── App.tsx
        │   └── main.tsx
```

---

## 🔑 Headless Sync Kernel Core Specifications

### 1. Identity & Cryptography
* **Zero-Leakage Hash Fragments:** Workspace identities and passphrases live solely in client-side URL hash fragments (`#workspaceId:passphrase`). Under RFC 3986, hash fragments are strictly client-side only and are never transmitted over HTTP request headers.
* **PBKDF2 Key Derivation:** Uses 100,000 iterations of SHA-256 with a domain-separated salt derived from `workspaceId` to generate an AES-GCM 256-bit symmetric key.
* **AES-GCM Authenticated Encryption:** Every state payload leaving the browser is encrypted with a cryptographically secure 12-byte random initialization vector (`crypto.getRandomValues`) paired with an authenticated integrity tag. Any payload tampering or invalid passphrase immediately fails decryption.
* **Cryptographic Routing Fingerprints:** Computes a SHA-256 hash prefix (`computeWorkspaceFingerprint`) used as the signaling room name, allowing public brokers to route traffic without seeing the workspace ID or passphrase.

### 2. Local Durability & CRDT Engine
* **Conflict-Free Replicated Data Types:** Built on Yjs CRDTs to guarantee convergence across concurrent edits by disconnected peers.
* **Browser-Native IndexedDB Adapter:**
  * Opens instantly on app launch with zero latency.
  * Buffers offline updates in an append-only transaction store.
  * Auto-compacts delta updates into consolidated snapshots when exceeding thresholds.

### 3. Real-Time Peer-to-Peer Mesh (WebRTC)
* **Direct WebRTC DataChannels:** Low-latency peer-to-peer binary message transport directly between browsers without intermediate storage.
* **Multi-Broker Signaling Relay:** Connects to public WebRTC signaling relays (`wss://signaling.yjs.dev`, `wss://y-webrtc-signaling-eu.herokuapp.com`) with automatic fallback and exponential backoff.
* **Symmetric Vector-Clock Reconciliation:**
  1. On connection open, peers exchange encrypted state vectors (`SYNC_STEP_1`).
  2. The receiving peer computes missing delta updates (`SYNC_STEP_2`) using `getDelta(remoteVector)`.
  3. Live mutations broadcast encrypted deltas (`SYNC_UPDATE`) to all active DataChannels and the local `BroadcastChannel`.
* **Polite Peer Glare Resolution:** Follows the WebRTC standard polite/impolite pattern based on peer ID comparison to deterministically resolve offer collisions.

### 4. Asynchronous IPFS Relay (Cold Persistence)
* **Solving "All Peers Offline at Different Times":** Debounces local state mutations into encrypted binary snapshots.
* **Standard IPFS CIDv1:** Computes standard IPFS CIDv1 identifiers (`raw` codec / `sha2-256` multihash, Base32 encoded `bafkrei...`).
* **Decentralized Rehydration:** When a peer rejoins with no active peers online, it checks the latest known snapshot CID from local storage or public IPFS gateways (`https://ipfs.io/ipfs/`, `https://dweb.link/ipfs/`, `https://gateway.pinata.cloud/ipfs/`), downloads the encrypted snapshot, decrypts it, and applies it to the CRDT document.

### 5. Generic Consumer Abstraction
* **Typed Collection Interface:**
  ```typescript
  interface Collection<T extends { id: string }> {
    readonly name: string;
    add(item: T): T;
    update(id: string, partial: Partial<Omit<T, 'id'>>): T | null;
    delete(id: string): boolean;
    get(id: string): T | undefined;
    getAll(): T[];
    query(predicate?: (item: T) => boolean): T[];
    observe(callback: (items: T[]) => void): () => void;
    count(): number;
    clear(): void;
  }
  ```
* **React Integration:** Provides `useMeshKernel()` and `useCollection<T>(kernel, collectionName)` for reactive state binding.

---

## 🚀 Applications Built on the Kernel

### 1. P2P Splitwise Clone (`apps/splitwise`)
* **Pure Deterministic Debt Simplification:** Computes net balance trees per currency. Employs a greedy cash-flow minimization algorithm that sorts debtors and creditors to compute the optimal payoff graph in at most $N - 1$ transactions without a centralized coordinator.
* **Interactive Dashboard:**
  * Add expenses with multi-participant equal splits and custom currencies (`USD`, `EUR`, `GBP`, `INR`, `JPY`, `CAD`).
  * Real-time transaction history with instant search and category filters.
  * Net balance trees highlighting who owes whom.
  * Visual payoff graph with one-click "Settle Up" action to clear debts.
  * Peer mesh inspector with live peer counts, ping latencies, and IPFS snapshot CIDs.

### 2. Shared Bookmark Hub (`apps/bookmarks`)
* **Collaborative Bookmarking:**
  * URL, title, tags, description, pinned and archive states.
  * Tag-filtered grid with instant search across active tabs and peers.
  * Pin bookmarks to the top of the shared workspace.
  * Favicon resolution and one-click external link opening.

---

## 🛠 Quickstart & Build Commands

### Prerequisites
* **Node.js:** v18+ (tested on Node v24.18.0)
* **npm:** v9+

### Installation
```bash
npm install
```

### Running Tests
Execute the full test suite across the monorepo (Web Crypto, CRDT, IPFS CIDv1, and Debt Simplification):
```bash
npm test
```

### Building All Workspaces
Build the headless sync kernel and both application static bundles:
```bash
npm run build
```

### Running Applications in Development
* **P2P Splitwise App:**
  ```bash
  npm run dev:splitwise
  # Runs on http://localhost:5173
  ```
* **Shared Bookmark Hub:**
  ```bash
  npm run dev:bookmarks
  # Runs on http://localhost:5174
  ```

### Static Deployment
Both applications build into purely static distribution bundles in `apps/splitwise/dist` and `apps/bookmarks/dist`. They can be deployed directly to:
* Cloudflare Pages
* GitHub Pages
* Netlify
* Vercel
* IPFS (via `ipfs add -r apps/splitwise/dist`)
