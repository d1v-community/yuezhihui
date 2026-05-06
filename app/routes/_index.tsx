import { json, type LoaderFunctionArgs, type MetaFunction, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { getUserFromRequest } from "~/utils/auth.server";
import { getEnvWarningMessage } from "~/utils/env.server";
import { LandingHeader } from "~/components/landing/LandingHeader";
import { LandingFooter } from "~/components/landing/LandingFooter";
import { Reveal } from "~/components/landing/Reveal";
import { SloganReveal } from "~/components/landing/SloganReveal";
import { CycleCurve } from "~/components/landing/CycleCurve";
import { InteractiveTimelineDemo } from "~/components/landing/InteractiveTimelineDemo";
import { APP_TITLE } from "~/constants/app";

export const meta: MetaFunction = () => {
  return [
    { title: `${APP_TITLE}` },
    { name: "description", content: "女性月经精细化管理：记录、计算、理解你的身体节律。" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const envWarning = getEnvWarningMessage();

  return json({ user, envWarning });
};

type LoaderData = SerializeFrom<typeof loader>;

export default function Index() {
  const { user, envWarning } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [clientUser, setClientUser] = useState<LoaderData["user"]>(user);

  useEffect(() => {
    // Ensure client reflects latest auth state (token/cookie changes)
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.authenticated) setClientUser(d.user);
        else setClientUser(null);
      })
      .catch(() => {
        // noop: 静默处理网络错误
      });
  }, []);

  const heroCurveValues = useMemo(
    () => [0.05, 0.08, 0.18, 0.42, 0.86, 0.66, 0.38, 0.2, 0.12, 0.08, 0.06, 0.05],
    [],
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem("auth-token");
      } catch {
        // noop: 静默处理清理 token 失败
      }
      // 立即更新用户状态为null，确保UI正确反映登录状态
      setClientUser(null);
      navigate("/", { replace: true });
    }
  };

  const effectiveUser = clientUser ?? user;

  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-text">
      {envWarning ? (
        <div className="w-full bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-2 px-4">
          {envWarning}
        </div>
      ) : null}

      <LandingHeader user={effectiveUser} onLogout={handleLogout} />

      <main className="flex-1 min-h-0">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 lp-flow-bg opacity-70" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-brand-muted">
                  FemTech Data Infrastructure
                  <span className="h-1 w-1 rounded-full bg-brand-accent/60" aria-hidden />
                  Personal Body Analytics
                </div>

                <SloganReveal
                  lines={["记录月经，", "理解身体。"]}
                  className="mt-5 text-4xl font-semibold tracking-tight text-brand-text md:text-6xl"
                />

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-muted md:text-lg">
                  这不是“预测月经”的工具，而是一套把身体经验转化为可理解数据的精细化生理记录系统。
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/download"
                    className="inline-flex items-center justify-center rounded-full bg-brand-text px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90 motion-safe:animate-lp-breathe"
                  >
                    下载 App
                  </Link>
                  <Link
                    to="/app"
                    reloadDocument
                    className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/75 px-6 py-3 text-sm font-medium text-brand-text transition hover:bg-brand-primary/35"
                  >
                    立即体验
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "按日记录", desc: "出血 · 卫生用品 · 症状 · 情绪" },
                    { title: "强度模型", desc: "把“感觉”转成可计算的强度" },
                    { title: "长期趋势", desc: "节律 · 稳定性 · 异常提示" },
                  ].map((it) => (
                    <div key={it.title} className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
                      <div className="text-sm font-semibold text-brand-text">{it.title}</div>
                      <div className="mt-1 text-sm text-brand-muted">{it.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="rounded-3xl border border-black/5 bg-white/70 p-5 shadow-[0_24px_70px_rgba(43,43,43,0.10)] backdrop-blur">
                  <div className="text-sm font-medium text-brand-text">身体节律曲线（示意）</div>
                  <div className="mt-3">
                    <CycleCurve values={heroCurveValues} className="rounded-2xl bg-brand-primary/55 p-3" />
                  </div>
                  <div className="mt-3 text-sm text-brand-muted leading-relaxed">
                    数据不是冷冰冰的。它会随着你的记录，像呼吸一样缓慢浮现。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <Reveal>
              <div className="max-w-3xl">
                <div className="text-sm text-brand-muted">Problem</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
                  经期不是一个日期，而是一段“状态变化”
                </h2>
                <p className="mt-4 text-base leading-relaxed text-brand-muted">
                  传统经期 App 往往只关心“开始/结束”和“预测”。但真正有价值的是：你的出血强度、用品使用、症状与情绪，
                  在时间轴上如何一起变化。
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "身体不是黑箱",
                  desc: "把主观感受拆解成可记录的维度：出血、疼痛、疲劳、情绪、体感。",
                },
                {
                  title: "感受不是主观",
                  desc: "用品事件是强度的“客观锚点”，能帮助建立更可靠的个体模型。",
                },
                {
                  title: "数据不是冷冰冰的",
                  desc: "用“节律”而不是“打卡”来设计交互，让记录更像一次自我理解。",
                },
              ].map((it) => (
                <Reveal key={it.title} className="h-full">
                  <div className="h-full rounded-3xl border border-black/5 bg-brand-primary/30 p-6">
                    <div className="text-base font-semibold text-brand-text">{it.title}</div>
                    <div className="mt-3 text-sm leading-relaxed text-brand-muted">{it.desc}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-24">
            <Reveal>
              <div className="max-w-3xl">
                <div className="text-sm text-brand-muted">Product Demo</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
                  不是截图，而是可交互的“记录过程”
                </h2>
                <p className="mt-4 text-base leading-relaxed text-brand-muted">
                  像拖动时间一样切换日期；像添加数据点一样添加事件；然后看强度模型如何实时变化。
                </p>
              </div>
            </Reveal>

            <div className="mt-10">
              <Reveal>
                <InteractiveTimelineDemo />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="philosophy" className="bg-brand-primary/35">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <Reveal>
              <div className="max-w-4xl">
                <div className="text-sm text-brand-muted">Philosophy</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
                  记录 → 计算 → 理解
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <div className="rounded-3xl bg-white/70 border border-black/5 p-6">
                    <div className="text-sm font-semibold text-brand-text">Behavior Layer</div>
                    <div className="mt-2 text-sm text-brand-muted">按日记录行为：出血 · 卫生用品 · 症状 · 情绪</div>
                  </div>
                  <div className="rounded-3xl bg-white/70 border border-black/5 p-6">
                    <div className="text-sm font-semibold text-brand-text">Data Layer</div>
                    <div className="mt-2 text-sm text-brand-muted">计算：出血强度模型 · 周期稳定性 · 节律曲线</div>
                  </div>
                  <div className="rounded-3xl bg-white/70 border border-black/5 p-6">
                    <div className="text-sm font-semibold text-brand-text">Insight Layer</div>
                    <div className="mt-2 text-sm text-brand-muted">输出：身体画像 · 长期趋势 · 风险提示</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="privacy" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <Reveal>
              <div className="max-w-3xl">
                <div className="text-sm text-brand-muted">Privacy</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
                  数据主权，是信任的起点
                </h2>
                <p className="mt-4 text-base leading-relaxed text-brand-muted">
                  你记录的是身体，而不是“内容”。我们把隐私当成产品的一部分来设计。
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { title: "最小化收集", desc: "只收集用于建模的必要维度，拒绝不必要的画像。" },
                { title: "可迁移与可导出", desc: "你的数据可以被你带走，不被平台锁定。" },
                { title: "透明与可解释", desc: "模型的输出尽量可解释，让你知道它为什么这么说。" },
              ].map((it) => (
                <Reveal key={it.title}>
                  <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-accent/70" aria-hidden />
                      <div>
                        <div className="text-base font-semibold text-brand-text">{it.title}</div>
                        <div className="mt-2 text-sm leading-relaxed text-brand-muted">{it.desc}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-24">
            <Reveal>
              <div className="rounded-3xl border border-black/5 bg-brand-primary/35 p-8 md:p-12">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
                    从今天开始，记录你的身体节律。
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-brand-muted">
                    如果男性有经期，它早就被量化了。现在，轮到我们把自己的身体变成可理解的数据。
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/download"
                      className="inline-flex items-center justify-center rounded-full bg-brand-text px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                    >
                      下载最新版本
                    </Link>
                    <Link
                      to="/app"
                      reloadDocument
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-medium text-brand-text transition hover:bg-white"
                    >
                      打开 Web 应用
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
