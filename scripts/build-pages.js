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

// Generate minimalist modern landing portal HTML
const landingHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MeshSync</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&display=swap" rel="stylesheet">
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #0a0a0a;
        --surface: #111111;
        --border: #1e1e1e;
        --border-hover: #2a2a2a;
        --text-primary: #f0f0f0;
        --text-secondary: #6b6b6b;
        --text-muted: #333333;
        --green: #22c55e;
        --blue: #3b82f6;
      }
      html, body { height: 100%; }
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--bg);
        color: var(--text-primary);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      a { text-decoration: none; color: inherit; }

      .wrap {
        max-width: 560px;
        margin: 0 auto;
        padding: 0 28px;
        width: 100%;
      }

      /* Header */
      header { padding: 44px 28px 0; max-width: 560px; margin: 0 auto; width: 100%; }
      .logo {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--text-primary);
      }
      .logo-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--green);
        flex-shrink: 0;
        animation: glow 2.4s ease-in-out infinite;
      }
      @keyframes glow {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(34,197,94,0.1); }
      }

      /* Hero */
      .hero { padding: 72px 28px 56px; max-width: 560px; margin: 0 auto; width: 100%; }
      .hero h1 {
        font-size: clamp(30px, 6vw, 44px);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.04em;
        color: var(--text-primary);
        margin-bottom: 18px;
      }
      .hero h1 em { font-style: normal; color: var(--text-secondary); }
      .hero p {
        font-size: 15px;
        line-height: 1.7;
        color: var(--text-secondary);
        font-weight: 400;
        max-width: 420px;
      }

      /* Cards */
      .cards { max-width: 560px; margin: 0 auto; padding: 0 28px; display: flex; flex-direction: column; gap: 10px; }
      .card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        transition: border-color 0.12s, background 0.12s;
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .card.green::before { background: radial-gradient(ellipse at 0% 50%, rgba(34,197,94,0.04) 0%, transparent 70%); }
      .card.blue::before  { background: radial-gradient(ellipse at 0% 50%, rgba(59,130,246,0.04) 0%, transparent 70%); }
      .card:hover { border-color: var(--border-hover); background: #141414; }
      .card:hover::before { opacity: 1; }

      .card-inner { display: flex; align-items: center; gap: 15px; position: relative; }
      .icon {
        width: 38px; height: 38px;
        border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px;
        flex-shrink: 0;
      }
      .icon.green { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.12); }
      .icon.blue  { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.12); }

      .card-name { font-size: 14px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; margin-bottom: 2px; }
      .card-desc { font-size: 12.5px; color: var(--text-secondary); font-weight: 400; line-height: 1.4; }

      .arrow {
        font-size: 16px;
        color: var(--text-muted);
        flex-shrink: 0;
        position: relative;
        transition: color 0.12s, transform 0.12s;
      }
      .card:hover .arrow { color: var(--text-secondary); transform: translateX(3px); }

      /* Footer */
      footer {
        margin-top: auto;
        padding: 44px 28px;
        max-width: 560px;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .footer-text { font-size: 12px; color: var(--text-muted); letter-spacing: 0.01em; }
      .footer-pill {
        font-size: 11px;
        color: var(--text-muted);
        border: 1px solid #1a1a1a;
        border-radius: 20px;
        padding: 4px 12px;
        letter-spacing: 0.03em;
      }

      @media (max-width: 480px) {
        .hero { padding: 52px 24px 44px; }
        header { padding-top: 32px; }
        .cards { padding: 0 24px; }
        footer { padding: 36px 24px; }
        .wrap { padding: 0 24px; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="logo">
        <span class="logo-dot"></span>
        MeshSync
      </div>
    </header>

    <main>
      <div class="hero">
        <h1>Your data,<br><em>no servers.</em></h1>
        <p>Two apps that sync directly between peers — end-to-end encrypted, offline-first, no sign-up required.</p>
      </div>

      <div class="cards">
        <a href="./splitwise/" class="card green">
          <div class="card-inner">
            <div class="icon green">💳</div>
            <div>
              <div class="card-name">PeerSplit</div>
              <div class="card-desc">Split expenses and settle debts with friends</div>
            </div>
          </div>
          <span class="arrow">→</span>
        </a>

        <a href="./bookmarks/" class="card blue">
          <div class="card-inner">
            <div class="icon blue">🔖</div>
            <div>
              <div class="card-name">MeshBookmarks</div>
              <div class="card-desc">Share and sync bookmarks across your devices</div>
            </div>
          </div>
          <span class="arrow">→</span>
        </a>
      </div>
    </main>

    <footer>
      <span class="footer-text">P2P · Encrypted · Open Source</span>
      <span class="footer-pill">Zero Servers</span>
    </footer>
  </body>
</html>
`;

fs.writeFileSync(path.join(distPagesDir, 'index.html'), landingHtml, 'utf8');
console.log('✓ Generated landing portal at dist-pages/index.html');
