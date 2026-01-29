import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), ".."); // /Users/apple/project/Yuezhihui
const sourceRoot = path.join(repoRoot, "h5.yuezhihui.xyz_20260129", "wiki");

const targetPagesRoot = path.join(process.cwd(), "app", "content", "wiki", "pages");
const targetNavPath = path.join(process.cwd(), "app", "content", "wiki", "nav.json");
const targetPublicWikiRoot = path.join(process.cwd(), "public", "wiki");

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".ico",
]);

function decodeHtmlEntities(input) {
  // Enough for <title> content from MkDocs; keep it dependency-free.
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return null;
  const raw = decodeHtmlEntities(m[1].trim());
  return raw.replace(/\s+-\s+女性健康知识百科\s*$/, "").trim();
}

function extractArticleInnerHtml(html) {
  const marker = '<article class="md-content__inner md-typeset">';
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const openEnd = html.indexOf(">", start + marker.length - 1);
  if (openEnd === -1) return null;
  const end = html.indexOf("</article>", openEnd);
  if (end === -1) return null;
  return html.slice(openEnd + 1, end).trim();
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(full);
    } else if (ent.isFile()) {
      yield full;
    }
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyFileIfChanged(src, dest) {
  await ensureDir(path.dirname(dest));
  // Best-effort: overwrite to keep in sync.
  await fs.copyFile(src, dest);
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function main() {
  if (!(await exists(sourceRoot))) {
    console.error(`Source wiki folder not found: ${sourceRoot}`);
    process.exit(1);
  }

  await ensureDir(targetPagesRoot);
  await ensureDir(targetPublicWikiRoot);

  const pages = [];

  for await (const file of walk(sourceRoot)) {
    const rel = path.relative(sourceRoot, file);
    const ext = path.extname(file).toLowerCase();

    if (ext === ".html") {
      // Only import "page" HTMLs (MkDocs outputs directory/index.html).
      if (path.basename(file) !== "index.html") continue;
      const relDir = path.dirname(rel); // "." for root
      const routePath = relDir === "." ? "" : toPosix(relDir);

      const html = await fs.readFile(file, "utf-8");
      const title = extractTitle(html) ?? (routePath || "Wiki");
      const articleInner = extractArticleInnerHtml(html);
      if (!articleInner) {
        console.warn(`Skip (cannot extract article): ${rel}`);
        continue;
      }

      const dest = routePath
        ? path.join(targetPagesRoot, routePath, "index.html")
        : path.join(targetPagesRoot, "index.html");

      await ensureDir(path.dirname(dest));
      await fs.writeFile(dest, articleInner + "\n", "utf-8");

      pages.push({ path: routePath, title });
      continue;
    }

    if (IMAGE_EXTS.has(ext)) {
      const dest = path.join(targetPublicWikiRoot, rel);
      await copyFileIfChanged(file, dest);
    }
  }

  pages.sort((a, b) => a.path.localeCompare(b.path, "en"));

  // Build a simple grouped nav: first segment -> pages
  const groupLabel = {
    aub: "异常子宫出血（AUB）",
    basic: "基础知识",
    physiology: "月经相关疾病",
    symptom: "常见症状",
    otherbleed: "其他出血",
    "how-to-participate": "共创",
  };

  const groupsMap = new Map();
  for (const p of pages) {
    if (p.path === "") continue; // homepage; shown separately
    const key = p.path.split("/")[0];
    const groupTitle = groupLabel[key] ?? key;
    const group = groupsMap.get(key) ?? { key, title: groupTitle, items: [] };
    group.items.push(p);
    groupsMap.set(key, group);
  }

  const nav = Array.from(groupsMap.values()).map((g) => ({
    ...g,
    items: g.items.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans")),
  }));
  nav.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans"));

  await ensureDir(path.dirname(targetNavPath));
  await fs.writeFile(targetNavPath, JSON.stringify({ pages, nav }, null, 2) + "\n", "utf-8");

  console.log(`Imported ${pages.length} pages`);
  console.log(`- pages: ${targetPagesRoot}`);
  console.log(`- nav:   ${targetNavPath}`);
  console.log(`- assets:${targetPublicWikiRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

