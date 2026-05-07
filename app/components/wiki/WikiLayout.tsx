import { Link, NavLink } from "@remix-run/react";
import { useEffect, useRef } from "react";
import type { WikiNavGroup } from "~/utils/wiki.server";

interface WikiLayoutProps {
  nav: WikiNavGroup[];
  routePath: string;
  title: string;
  html: string;
}

export function WikiLayout({ nav, routePath, title, html }: WikiLayoutProps) {
  const current = routePath ? `/wiki/${routePath}` : "/wiki";
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const cleanups: Array<() => void> = [];
    const images = Array.from(article.querySelectorAll("img"));

    for (const image of images) {
      const applyFallback = () => {
        if (image.dataset.broken === "true") return;
        image.dataset.broken = "true";
        const fallback = document.createElement("div");
        fallback.className = "wiki-image-fallback";
        fallback.textContent = image.alt ? `图片暂未提供：${image.alt}` : "图片暂未提供";
        image.insertAdjacentElement("afterend", fallback);
      };

      image.addEventListener("error", applyFallback);
      cleanups.push(() => image.removeEventListener("error", applyFallback));

      if (image.complete && image.naturalWidth === 0) {
        applyFallback();
      }
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [html]);

  return (
    <div className="bg-brand-primary/20">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="text-xs tracking-[0.14em] uppercase text-brand-muted">Knowledge</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
            {title}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-brand-muted">
            <Link to="/" className="hover:text-brand-text transition-colors">
              首页
            </Link>
            <span aria-hidden>/</span>
            <Link to="/wiki" className="hover:text-brand-text transition-colors">
              百科
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="rounded-3xl border border-black/5 bg-white/80 p-4 shadow-sm">
            <div className="mb-3 text-xs font-medium tracking-[0.12em] uppercase text-brand-muted">
              目录
            </div>

            <div className="flex flex-col gap-1.5">
              <NavLink
                to="/wiki"
                end
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-brand-primary/60 text-brand-text"
                      : "text-brand-muted hover:text-brand-text hover:bg-brand-primary/35"
                  }`
                }
              >
                月知百科
              </NavLink>

              {nav.map((g) => (
                <div key={g.key} className="mt-3">
                  <Link
                    to={`/wiki/${g.key}`}
                    className="block px-3 py-1 text-xs font-medium tracking-[0.12em] uppercase text-brand-muted hover:text-brand-text transition-colors"
                  >
                    {g.title}
                  </Link>
                  <div className="mt-1 flex flex-col gap-1">
                    {g.items.map((it) => {
                      const to = it.path ? `/wiki/${it.path}` : "/wiki";
                      const active = to === current;
                      return (
                        <Link
                          key={it.path}
                          to={to}
                          className={`rounded-2xl px-3 py-2 text-sm transition ${
                            active
                              ? "bg-brand-primary/60 text-brand-text"
                              : "text-brand-muted hover:text-brand-text hover:bg-brand-primary/35"
                          }`}
                        >
                          {it.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <article ref={articleRef} className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm md:p-8">
            <div className="wiki-article" dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
      </div>
    </div>
  );
}
