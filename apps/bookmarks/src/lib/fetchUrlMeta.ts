/**
 * fetchUrlMeta.ts
 *
 * Auto-fills title + description when the user pastes a URL.
 *
 * Primary : microlink.io — headless-browser service, handles JS-rendered
 *           pages, authenticated-looking pages, and most bot-blocked sites.
 *           Free tier, no API key required.
 *           Tested working: GitHub, Substack, goldprice.org, YouTube, etc.
 *
 * Fallback : parallel HTML proxy scrape (corsproxy.io + allorigins.win)
 *           for the rare case microlink itself is down.
 *
 * Layer 3 : Chrome Built-in AI (Gemini Nano, Chrome 138+) — if the page
 *           had no description, generate one on-device from body text.
 */

export interface UrlMeta {
  title: string;
  description: string;
  aiEnhanced?: boolean;
}

// ─── Chrome Built-in AI stubs ─────────────────────────────────────────────────
interface ChromeSummarizer {
  summarize(text: string): Promise<string>;
  destroy(): void;
}
interface SummarizerStatic {
  availability(options?: object): Promise<string>;
  create(options?: object): Promise<ChromeSummarizer>;
}
declare global {
  interface Window { Summarizer?: SummarizerStatic; }
}
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 10_000;

interface OgResult {
  title: string;
  description: string;
  bodyText: string;
}

function timedSignal(outer: AbortSignal, ms = TIMEOUT_MS): AbortSignal {
  return AbortSignal.any([outer, AbortSignal.timeout(ms)]);
}

// ─── Primary: microlink.io ────────────────────────────────────────────────────
// Verified working: GitHub, Substack, goldprice.org, YouTube, etc.
async function tryMicrolink(url: string, outer: AbortSignal): Promise<OgResult | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`,
      { signal: timedSignal(outer) },
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      status?: string;
      data?: { title?: string; description?: string };
    };
    if (data.status !== 'success') return null;
    const title       = (data.data?.title ?? '').trim();
    const description = (data.data?.description ?? '').trim();
    if (!title && !description) return null;
    return { title, description, bodyText: description };
  } catch {
    return null;
  }
}

// ─── Fallback: raw CORS-proxy HTML scraping ───────────────────────────────────
function parseHtmlMeta(html: string): OgResult | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const q = (sel: string, attr: string) =>
    doc.querySelector(sel)?.getAttribute(attr)?.trim() ?? '';

  const title = q('meta[property="og:title"]', 'content')
    || q('meta[name="twitter:title"]', 'content')
    || doc.querySelector('title')?.textContent?.trim()
    || '';

  const description = q('meta[property="og:description"]', 'content')
    || q('meta[name="twitter:description"]', 'content')
    || q('meta[name="description"]', 'content')
    || '';

  const bodyText = doc.body?.innerText?.slice(0, 3000) ?? '';
  return (title || description) ? { title, description, bodyText } : null;
}

async function tryHtmlProxies(url: string, outer: AbortSignal): Promise<OgResult | null> {
  if (outer.aborted) return null;
  const enc = encodeURIComponent(url);

  // Run both proxies in parallel, take first success
  const tryCors = async (): Promise<OgResult> => {
    const res = await fetch(`https://corsproxy.io/?url=${enc}`, { signal: timedSignal(outer) });
    if (!res.ok) throw new Error(`cors ${res.status}`);
    const r = parseHtmlMeta(await res.text());
    if (!r) throw new Error('cors: no meta');
    return r;
  };

  const tryAllOrigins = async (): Promise<OgResult> => {
    const res = await fetch(`https://api.allorigins.win/get?url=${enc}`, { signal: timedSignal(outer) });
    if (!res.ok) throw new Error(`ao ${res.status}`);
    const data = await res.json() as { contents?: string };
    if (!data.contents) throw new Error('ao: empty');
    const r = parseHtmlMeta(data.contents);
    if (!r) throw new Error('ao: no meta');
    return r;
  };

  try {
    return await Promise.any([tryCors(), tryAllOrigins()]);
  } catch {
    return null;
  }
}

// ─── Chrome on-device AI (optional description) ───────────────────────────────
async function tryAiSummarize(text: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.Summarizer) return null;
    const avail = await window.Summarizer.availability({ type: 'teaser', length: 'short' });
    if (avail === 'unavailable') return null;
    const s = await window.Summarizer.create({ type: 'teaser', format: 'plain-text', length: 'short' });
    const result = await s.summarize(text);
    s.destroy();
    return result?.trim() || null;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchUrlMeta(
  url: string,
  signal?: AbortSignal,
  useAi = true,
): Promise<UrlMeta | null> {
  if (!url) return null;

  const normalized = url.startsWith('http://') || url.startsWith('https://')
    ? url : `https://${url}`;

  const effectiveSignal = signal ?? new AbortController().signal;

  // Try microlink first; fall back to raw HTML proxies
  const ogData = (await tryMicrolink(normalized, effectiveSignal))
    ?? (await tryHtmlProxies(normalized, effectiveSignal));

  if (!ogData || effectiveSignal.aborted) return null;

  let { title, description, bodyText } = ogData;

  // Chrome on-device AI: generate description when the page had none
  let aiEnhanced = false;
  if (useAi && !description && bodyText.length > 100) {
    const aiDesc = await tryAiSummarize(bodyText);
    if (aiDesc) { description = aiDesc; aiEnhanced = true; }
  }

  return { title: title.trim(), description: description.trim(), aiEnhanced };
}
