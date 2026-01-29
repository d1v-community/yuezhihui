import fs from "node:fs/promises";
import path from "node:path";

export type WikiNavItem = { path: string; title: string };
export type WikiNavGroup = { key: string; title: string; items: WikiNavItem[] };
export type WikiNavData = { pages: WikiNavItem[]; nav: WikiNavGroup[] };

const wikiPagesRoot = path.resolve(process.cwd(), "app/content/wiki/pages");
const wikiNavPath = path.resolve(process.cwd(), "app/content/wiki/nav.json");

let navCache: WikiNavData | null = null;

async function loadNavFile(): Promise<WikiNavData> {
  const raw = await fs.readFile(wikiNavPath, "utf-8");
  const parsed = JSON.parse(raw) as WikiNavData;
  return parsed;
}

export async function getWikiNav(): Promise<WikiNavData> {
  if (navCache) return navCache;
  navCache = await loadNavFile();
  return navCache;
}

function assertSafeRoutePath(routePath: string) {
  if (routePath.includes("\0")) throw new Error("Invalid routePath");
  // No traversal
  const parts = routePath.split("/").filter(Boolean);
  if (parts.some((p) => p === ".." || p === ".")) throw new Error("Invalid routePath");
}

async function readPageInnerHtml(routePath: string): Promise<string | null> {
  assertSafeRoutePath(routePath);
  const filePath = routePath
    ? path.join(wikiPagesRoot, routePath, "index.html")
    : path.join(wikiPagesRoot, "index.html");

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

function splitUrl(url: string): { pathPart: string; suffix: string } {
  const idxQ = url.indexOf("?");
  const idxH = url.indexOf("#");
  const idx = idxQ === -1 ? idxH : idxH === -1 ? idxQ : Math.min(idxQ, idxH);
  if (idx === -1) return { pathPart: url, suffix: "" };
  return { pathPart: url.slice(0, idx), suffix: url.slice(idx) };
}

function resolveWikiRelative(baseDir: string, rawPath: string) {
  const posix = path.posix;
  const joined = posix.normalize(posix.join(baseDir || "", rawPath));
  // Clamp any unexpected upward traversal.
  return joined.replace(/^(\.\.\/)+/, "");
}

export function rewriteWikiHtml(html: string, routePath: string) {
  // Remove any scripts in the original HTML (defense-in-depth).
  let out = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  const baseDir = routePath || "";
  const urlAttr = /(href|src)=(["'])([^"']+)\2/gi;

  out = out.replace(urlAttr, (full, attr, quote, value) => {
    const raw = String(value);
    if (raw.startsWith("#")) return full;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return full;
    if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return full;

    // Avoid executing JS URLs if present.
    if (/^javascript:/i.test(raw)) {
      return `${attr}=${quote}#${quote}`;
    }

    if (raw.startsWith("/")) {
      // Keep absolute URLs as-is (rare in MkDocs article body).
      return full;
    }

    const { pathPart, suffix } = splitUrl(raw);
    const resolved = resolveWikiRelative(baseDir, pathPart);
    const url = resolved ? `/wiki/${resolved}${suffix}` : `/wiki/${suffix}`;
    return `${attr}=${quote}${url}${quote}`;
  });

  // External links should open in a new tab (SSR-safe).
  out = out.replace(
    /<a\b([^>]*?)href=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi,
    (m, pre, q, href, post) => {
      const attrs = `${pre}href=${q}${href}${q}${post}`;
      if (/target=/.test(attrs)) return `<a${attrs}>`;
      return `<a${attrs} target="_blank" rel="noreferrer noopener">`;
    },
  );

  return out;
}

export async function getWikiPage(routePath: string) {
  const nav = await getWikiNav();
  const page = nav.pages.find((p) => p.path === routePath) ?? null;
  const html = await readPageInnerHtml(routePath);
  if (!page || !html) return null;
  return {
    ...page,
    html: rewriteWikiHtml(html, routePath),
  };
}

function renderCategoryIndexHtml(group: WikiNavGroup) {
  const items = group.items
    .map((it) => {
      const prefix = `${group.key}/`;
      const href =
        it.path === group.key
          ? "./"
          : it.path.startsWith(prefix)
            ? `${it.path.slice(prefix.length)}/`
            : `/wiki/${it.path}`;
      return `<li><a href="${href}">${it.title}</a></li>`;
    })
    .join("\n");

  return `
<h1>${group.title}</h1>
<p>按主题浏览本分类下的条目。</p>
<ul>
${items}
</ul>
`.trim();
}

/**
 * Returns:
 * - a real wiki page when available (imported from MkDocs)
 * - otherwise, a generated "category index" for top-level sections like /wiki/basic
 */
export async function getWikiContent(routePath: string) {
  const nav = await getWikiNav();

  const page = await getWikiPage(routePath);
  if (page) return page;

  // Auto category index pages like /wiki/basic, /wiki/aub, ...
  if (routePath && !routePath.includes("/")) {
    const group = nav.nav.find((g) => g.key === routePath) ?? null;
    if (group) {
      return {
        path: routePath,
        title: group.title,
        html: rewriteWikiHtml(renderCategoryIndexHtml(group), routePath),
      };
    }
  }

  return null;
}
