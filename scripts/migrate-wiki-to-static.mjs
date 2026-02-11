import fs from "node:fs/promises";
import path from "node:path";

const sourcePagesRoot = path.resolve(process.cwd(), "app/content/wiki/pages");
const navPath = path.resolve(process.cwd(), "app/content/wiki/nav.json");
const targetWikiRoot = path.resolve(process.cwd(), "public/wiki");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateNavHtml(nav, currentPath) {
  let html = '<nav class="wiki-nav"><ul>';

  for (const group of nav) {
    html += `<li class="nav-group"><span class="nav-group-title">${escapeHtml(group.title)}</span><ul>`;

    for (const item of group.items) {
      const href = item.path === "" ? "./" : `../${item.path}/`;
      const isActive = item.path === currentPath ? ' class="active"' : "";
      html += `<li${isActive}><a href="${href}">${escapeHtml(item.title)}</a></li>`;
    }

    html += '</ul></li>';
  }

  html += '</ul></nav>';
  return html;
}

function generateFullHtml(title, contentHtml, nav, currentPath) {
  const navHtml = generateNavHtml(nav, currentPath);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 月知百科</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .wiki-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      min-height: 100vh;
    }

    .wiki-nav {
      width: 280px;
      background: #fff;
      border-right: 1px solid #e5e5e5;
      padding: 20px;
      flex-shrink: 0;
    }

    .wiki-nav ul {
      list-style: none;
    }

    .wiki-nav .nav-group {
      margin-bottom: 16px;
    }

    .wiki-nav .nav-group-title {
      font-weight: 600;
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
      display: block;
    }

    .wiki-nav li a {
      display: block;
      padding: 8px 12px;
      color: #333;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .wiki-nav li a:hover {
      background: #f0f0f0;
    }

    .wiki-nav li.active > a {
      background: #e8f4f8;
      color: #007bff;
    }

    .wiki-content {
      flex: 1;
      padding: 40px;
      background: #fff;
      max-width: calc(100% - 280px);
    }

    .wiki-content h1 {
      font-size: 28px;
      margin-bottom: 24px;
      color: #333;
    }

    .wiki-content h2 {
      font-size: 22px;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 8px;
    }

    .wiki-content h3 {
      font-size: 18px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #333;
    }

    .wiki-content h4 {
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #333;
    }

    .wiki-content p {
      margin-bottom: 16px;
      color: #555;
    }

    .wiki-content ul, .wiki-content ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }

    .wiki-content li {
      margin-bottom: 8px;
    }

    .wiki-content a {
      color: #007bff;
      text-decoration: none;
    }

    .wiki-content a:hover {
      text-decoration: underline;
    }

    .wiki-content img {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
      border-radius: 4px;
    }

    .wiki-content hr {
      border: none;
      border-top: 1px solid #e5e5e5;
      margin: 32px 0;
    }

    .wiki-content blockquote {
      background: #f9f9f9;
      border-left: 4px solid #007bff;
      padding: 16px;
      margin: 16px 0;
      color: #666;
    }

    .wiki-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .wiki-content table th,
    .wiki-content table td {
      border: 1px solid #e5e5e5;
      padding: 12px;
      text-align: left;
    }

    .wiki-content table th {
      background: #f5f5f5;
      font-weight: 600;
    }

    .footnote-ref {
      color: #007bff;
      font-size: 12px;
    }

    .footnote-backref {
      color: #007bff;
      text-decoration: none;
    }

    .headerlink {
      color: #ccc;
      text-decoration: none;
      margin-left: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    h1:hover .headerlink,
    h2:hover .headerlink,
    h3:hover .headerlink,
    h4:hover .headerlink {
      opacity: 1;
    }

    @media (max-width: 768px) {
      .wiki-container {
        flex-direction: column;
      }

      .wiki-nav {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e5e5e5;
      }

      .wiki-content {
        max-width: 100%;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="wiki-container">
    ${navHtml}
    <main class="wiki-content">
      ${contentHtml}
    </main>
  </div>
</body>
</html>`;
}

async function main() {
  // Load navigation
  const navRaw = await fs.readFile(navPath, "utf-8");
  const navData = JSON.parse(navRaw);

  // Ensure target directory exists
  await ensureDir(targetWikiRoot);

  // Generate pages
  for (const page of navData.pages) {
    const routePath = page.path;
    const title = page.title;

    // Read source HTML
    const sourcePath = routePath
      ? path.join(sourcePagesRoot, routePath, "index.html")
      : path.join(sourcePagesRoot, "index.html");

    let contentHtml;
    try {
      contentHtml = await fs.readFile(sourcePath, "utf-8");
    } catch (err) {
      console.error(`Warning: Could not read ${sourcePath}`);
      continue;
    }

    // Generate full HTML
    const fullHtml = generateFullHtml(title, contentHtml, navData.nav, routePath);

    // Write to public/wiki
    const targetPath = routePath
      ? path.join(targetWikiRoot, routePath, "index.html")
      : path.join(targetWikiRoot, "index.html");

    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, fullHtml, "utf-8");

    console.log(`Generated: ${targetPath}`);
  }

  console.log(`\nMigration complete!`);
  console.log(`Total pages: ${navData.pages.length}`);
  console.log(`Output directory: ${targetWikiRoot}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
