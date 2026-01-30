import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { existsSync } from "node:fs";
import path from "node:path";

// Keep the product entry stable: `/app` -> `/app/index.html`
// - In dev, Taro H5 runs in watch mode and emits static files into `public/app`.
// - In prod, `pnpm run build` also emits `public/app` and Vercel serves it.
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.pathname !== "/app" && url.pathname !== "/app/") {
    return redirect("/app/index.html");
  }

  // During dev startup, Taro may not have produced `public/app/index.html` yet.
  // Avoid a confusing 404 by showing a short "building" page.
  const entry = path.join(process.cwd(), "public", "app", "index.html");
  if (existsSync(entry)) return redirect("/app/index.html");

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1;url=/app/index.html" />
    <title>正在构建应用…</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; margin:0; background:#fbfaf8; color:rgba(0,0,0,.86)}
      .wrap{max-width:560px; margin:0 auto; padding:24px 16px}
      .card{background:rgba(255,255,255,.92); border:1px solid rgba(0,0,0,.08); border-radius:16px; padding:16px}
      .t{font-size:18px; font-weight:700}
      .d{margin-top:8px; font-size:14px; line-height:20px; color:rgba(0,0,0,.55)}
      code{background:rgba(0,0,0,.04); padding:2px 6px; border-radius:8px}
      a{color:rgba(0,0,0,.86)}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="t">正在构建应用…</div>
        <div class="d">Taro H5 首次编译可能需要几十秒。页面会自动重试进入。</div>
        <div class="d">如果一直停留在这里，请确认你在仓库根目录运行：<code>pnpm run dev</code></div>
        <div class="d"><a href="/app/index.html">手动进入</a></div>
      </div>
    </div>
  </body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
