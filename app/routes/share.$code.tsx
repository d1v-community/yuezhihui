import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { getShareByCode } from "~/services/share.server";

const paramsSchema = z.object({ code: z.string().length(32) });

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.type === "period" ? "月经周期分享" : "月经总览分享";
  return [{ title }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const p = paramsSchema.parse({ code: params.code });
  const data = await getShareByCode(p.code);
  return json(data);
}

function formatDateLike(v: any): string {
  const s = String(v ?? "");
  if (!s) return "";
  return s.replace("T", " ").replace("Z", "").slice(0, 19);
}

export default function SharePage() {
  const share = useLoaderData<typeof loader>() as any;
  const data = share?.data as any;

  const title = share?.type === "period" ? "周期分享" : "总览分享";
  const owner = share?.owner?.nickname ? `来自 ${share.owner.nickname}` : "来自用户分享";
  const createdAt = formatDateLike(share?.createdAt);
  const expireAt = share?.expireAt ? formatDateLike(share.expireAt) : null;

  const isOverview = share?.type === "overview";
  const isPeriod = share?.type === "period";

  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      alert("已复制链接");
    } catch {
      // Fallback: select + copy
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("已复制链接");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-neutral-600">{owner}</p>
              <p className="mt-2 text-xs text-neutral-500">
                创建时间：{createdAt || "未知"}
                {expireAt ? ` · 过期：${expireAt}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              复制链接
            </button>
          </div>
        </div>

        {isOverview ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-700">健康分</div>
                <div className="text-3xl font-black tracking-tight">{Number(data?.healthScore ?? 0)}</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-500">趋势</div>
                  <div className="mt-1 text-sm font-semibold">{data?.trend?.status ?? "-"}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-500">规律性</div>
                  <div className="mt-1 text-sm font-semibold">{data?.regularity?.status ?? "-"}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-500">周期数</div>
                  <div className="mt-1 text-sm font-semibold">{Number(data?.cycleCount ?? 0)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-neutral-700">风险提示</div>
              {Array.isArray(data?.risks) && data.risks.length ? (
                <div className="mt-3 space-y-3">
                  {data.risks.slice(0, 8).map((r: any) => (
                    <div key={String(r.title) + String(r.level)} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{r.title}</div>
                        <div className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700">
                          {r.level}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">{r.triggerText}</div>
                      {r.url ? (
                        <div className="mt-2 text-xs text-neutral-500">
                          解释链接：<code className="break-all">{r.url}</code>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">暂无风险提示。</p>
              )}
            </div>
          </div>
        ) : null}

        {isPeriod ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-neutral-700">周期</div>
              <div className="mt-2 text-sm text-neutral-700">
                {data?.cycle?.startDate} ~ {data?.cycle?.endDate} · {data?.cycle?.daysCount}天 · {data?.cycle?.totalVolumeMl}mL
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {data?.cycle?.level?.status ? (
                  <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5">{data.cycle.level.status}</span>
                ) : null}
                {data?.cycle?.distribution?.status ? (
                  <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5">分布{data.cycle.distribution.status}</span>
                ) : null}
                {data?.cycle?.color?.status ? (
                  <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5">颜色{data.cycle.color.status}</span>
                ) : null}
                {data?.cycle?.clot?.status ? (
                  <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5">血块{data.cycle.clot.status}</span>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-neutral-700">日明细</div>
              {Array.isArray(data?.days) && data.days.length ? (
                <div className="mt-3 space-y-3">
                  {data.days.map((d: any) => (
                    <div key={String(d.date)} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="text-sm font-semibold">D{d.dayIndex} · {d.date}</div>
                        <div className="text-sm font-semibold">{d.totalVolumeMl}mL</div>
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        颜色：{d.dayColor || "未记录"}；血块：{d.clotLevel}
                        {Array.isArray(d.symptoms) && d.symptoms.length ? `；症状：${d.symptoms.join("、")}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">暂无日明细。</p>
              )}
            </div>
          </div>
        ) : null}

        {!isOverview && !isPeriod ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-600">该分享类型暂不支持展示。</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

