import { json, type LoaderFunctionArgs, type MetaFunction, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import appLogoUrl from "~/assets/branding/app_logo_master.png";
import { LandingFooter } from "~/components/landing/LandingFooter";
import { LandingHeader } from "~/components/landing/LandingHeader";
import { Reveal } from "~/components/landing/Reveal";
import { APP_TITLE, GITHUB_REPO_URL } from "~/constants/app";
import { getReleaseSummaries, getRepoSummary, type ReleaseSummary } from "~/services/github.server";
import { getUserFromRequest } from "~/utils/auth.server";
import { getEnvWarningMessage } from "~/utils/env.server";

export const meta: MetaFunction = () => {
  return [
    { title: `下载 App · ${APP_TITLE}` },
    {
      name: "description",
      content: "下载 FlowSense App，查看 GitHub 自动打包版本、资产文件与更新记录。",
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, repo, releases] = await Promise.all([
    getUserFromRequest(request),
    getRepoSummary(),
    getReleaseSummaries(6),
  ]);
  const envWarning = getEnvWarningMessage();

  return json({ envWarning, releases, repo, user });
};

function formatReleaseDate(input: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(input));
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderInlineText(text: string) {
  const changelogMatch = text.match(/\*\*Full Changelog\*\*:\s+(https?:\/\/\S+)/);
  if (changelogMatch) {
    return (
      <>
        <span className="text-brand-muted">完整提交记录：</span>{" "}
        <a href={changelogMatch[1]} target="_blank" rel="noreferrer" className="underline decoration-black/20 underline-offset-4 hover:decoration-black/60">
          GitHub Changelog
        </a>
      </>
    );
  }

  return text;
}

function ReleaseNotes({ body }: { body: string }) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

        if (block.startsWith("## ")) {
          return (
            <h3 key={`${block}-${index}`} className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-muted">
              {block.replace(/^##\s+/, "")}
            </h3>
          );
        }

        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={`${block}-${index}`} className="space-y-2 text-sm leading-relaxed text-brand-text">
              {lines.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent/70" aria-hidden />
                  <span>{line.replace(/^- /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${index}`} className="text-sm leading-relaxed text-brand-text">
            {renderInlineText(block)}
          </p>
        );
      })}
    </div>
  );
}

function PrimaryDownloadCard({ release }: { release: ReleaseSummary }) {
  const primaryAsset = release.assets[0];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-[#fffaf6] p-6 shadow-[0_28px_80px_rgba(77,39,47,0.10)] md:p-8">
      <div className="absolute inset-0 download-radial-bg opacity-90" aria-hidden />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-brand-muted">
            Latest Release
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            GitHub Actions
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-brand-text md:text-6xl">
            下载自动打包的最新 App 版本。
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-muted md:text-lg">
            每次 Flutter 端 release 工作流完成后，这里会自动展示新的 APK、发布时间和更新记录。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryAsset ? (
              <a
                href={primaryAsset.url}
                className="inline-flex items-center justify-center rounded-full bg-brand-text px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90"
              >
                下载 {primaryAsset.name}
              </a>
            ) : null}
            <a
              href={release.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-medium text-brand-text transition hover:bg-white"
            >
              查看 Release 页面
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white/78 p-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">版本</div>
              <div className="mt-2 text-lg font-semibold text-brand-text">{release.tagName}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/78 p-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">发布时间</div>
              <div className="mt-2 text-lg font-semibold text-brand-text">{formatReleaseDate(release.publishedAt)}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/78 p-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">文件体积</div>
              <div className="mt-2 text-lg font-semibold text-brand-text">
                {primaryAsset ? formatFileSize(primaryAsset.size) : "待生成"}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
          <div className="absolute inset-x-12 bottom-6 top-12 rounded-full bg-[#cf6375]/18 blur-3xl" aria-hidden />
          <div className="relative w-full overflow-hidden rounded-[2.4rem] border border-white/70 bg-[linear-gradient(180deg,#7f2744_0%,#c55b68_48%,#f6c3b0_100%)] p-5 text-white shadow-[0_35px_90px_rgba(95,31,48,0.28)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/70">
              <span>FlowSense App</span>
              <span>Android</span>
            </div>
            <div className="mt-6 rounded-[2rem] bg-white/12 p-5 backdrop-blur-sm">
              <img src={appLogoUrl} alt="FlowSense App logo" className="h-20 w-20 rounded-[1.25rem] shadow-2xl" />
              <div className="mt-5 text-3xl font-semibold tracking-tight">{release.name}</div>
              <div className="mt-2 text-sm leading-relaxed text-white/78">
                开源仓库自动产出，面向真实安装与持续更新。
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {release.assets.slice(0, 3).map((asset) => (
                <div key={asset.name} className="rounded-[1.4rem] border border-white/15 bg-black/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-sm font-medium text-white">{asset.name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/72">
                    <span>{formatFileSize(asset.size)}</span>
                    <span>{asset.downloadCount} downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const { envWarning, releases, repo, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [clientUser, setClientUser] = useState<SerializeFrom<typeof loader>["user"]>(user);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.authenticated) setClientUser(data.user);
        else setClientUser(null);
      })
      .catch(() => {
        // noop
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem("auth-token");
      } catch {
        // noop
      }
      setClientUser(null);
      navigate("/download", { replace: true });
    }
  };

  const latestRelease = releases[0];

  return (
    <div className="min-h-screen bg-[#fffdf9] text-brand-text">
      {envWarning ? (
        <div className="w-full bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-2 px-4">
          {envWarning}
        </div>
      ) : null}

      <LandingHeader user={clientUser ?? user} onLogout={handleLogout} />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,195,176,0.26),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(127,39,68,0.10),transparent_28%),linear-gradient(180deg,#fffdf9_0%,#fff8f1_100%)]" aria-hidden />

        <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 md:pb-20 md:pt-16">
          <Reveal>
            {latestRelease ? (
              <PrimaryDownloadCard release={latestRelease} />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/80 p-10 text-center">
                <div className="text-2xl font-semibold tracking-tight text-brand-text">首个公开 release 正在准备</div>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">
                  仓库已经公开。等 GitHub Actions 完成自动打包后，这里会直接展示可下载的安装包和变更说明。
                </p>
                <div className="mt-6 flex justify-center">
                  <a
                    href={`${GITHUB_REPO_URL}/releases`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-brand-text px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                  >
                    打开 GitHub Releases
                  </a>
                </div>
              </div>
            )}
          </Reveal>
        </section>

        <section className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-[0.78fr_1.22fr] md:pb-24">
          <Reveal className="h-full">
            <aside className="h-full rounded-[2rem] border border-black/5 bg-white/78 p-6 shadow-[0_18px_60px_rgba(43,43,43,0.06)] backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Open Source</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text">GitHub 仓库已公开</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                下载页直接面向公开仓库数据，版本、资产和更新记录都来自 GitHub Releases。
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-black/5 bg-[#fff8f3] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Repository</div>
                  <div className="mt-2 text-lg font-semibold text-brand-text">
                    {repo.owner}/{repo.name}
                  </div>
                  <div className="mt-2 text-sm text-brand-muted">{repo.description ?? "Open source FlowSense repository"}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Visibility</div>
                    <div className="mt-2 text-lg font-semibold text-brand-text">{repo.visibility.toUpperCase()}</div>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Stars</div>
                    <div className="mt-2 text-lg font-semibold text-brand-text">{repo.stars}</div>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Issues</div>
                    <div className="mt-2 text-lg font-semibold text-brand-text">{repo.issues}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-brand-text px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                >
                  查看 GitHub 仓库
                </a>
                <Link
                  to="/app"
                  reloadDocument
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-brand-text transition hover:bg-brand-primary/35"
                >
                  打开 Web 版本
                </Link>
              </div>
            </aside>
          </Reveal>

          <div className="space-y-5">
            <Reveal>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Release Feed</div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">版本与更新记录</h2>
                </div>
                <a href={`${GITHUB_REPO_URL}/releases`} target="_blank" rel="noreferrer" className="text-sm text-brand-muted underline decoration-black/15 underline-offset-4 hover:text-brand-text hover:decoration-black/50">
                  查看全部 Releases
                </a>
              </div>
            </Reveal>

            {releases.map((release, index) => (
              <Reveal key={release.tagName}>
                <article className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_18px_60px_rgba(43,43,43,0.05)]">
                  <div className="border-b border-black/5 bg-[#fff8f1] px-6 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-brand-muted">
                          <span>{index === 0 ? "Latest" : "Archive"}</span>
                          {release.isPrerelease ? <span className="rounded-full bg-black/5 px-2 py-0.5 tracking-normal">Pre-release</span> : null}
                        </div>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-text">{release.name}</h3>
                        <p className="mt-2 text-sm text-brand-muted">
                          {release.tagName} · 发布于 {formatReleaseDate(release.publishedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {release.assets.map((asset) => (
                          <a
                            key={asset.name}
                            href={asset.url}
                            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-brand-text transition hover:bg-brand-primary/35"
                          >
                            下载 {asset.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 px-6 py-6 lg:grid-cols-[0.86fr_1.14fr]">
                    <div className="space-y-3">
                      {release.assets.length > 0 ? (
                        release.assets.map((asset) => (
                          <div key={asset.name} className="rounded-2xl border border-black/5 bg-[#fffdf9] p-4">
                            <div className="text-sm font-semibold text-brand-text">{asset.name}</div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-muted">
                              <span>{formatFileSize(asset.size)}</span>
                              <span>{asset.downloadCount} 次下载</span>
                              <span>{asset.contentType || "binary asset"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-black/10 bg-[#fffdf9] p-4 text-sm text-brand-muted">
                          该 release 暂无可下载资产。
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-[#fffdfa] p-5">
                      <ReleaseNotes body={release.body || "暂无更新记录。"} />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
