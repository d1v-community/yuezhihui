import { useEffect, useMemo, useRef, useState } from "react";
import { CycleCurve } from "./CycleCurve";

type DayRecord = {
  bleeding: boolean;
  intensity: 0 | 1 | 2 | 3;
  pads: number;
  tampons: number;
};

function baseFlow(dayIndex: number) {
  // A soft "cycle" curve: peak around day 2-3, then fades.
  const x = dayIndex;
  const peak = Math.exp(-0.5 * Math.pow((x - 2.5) / 1.4, 2)); // gaussian
  const tail = Math.exp(-0.5 * Math.pow((x - 5.5) / 2.4, 2)) * 0.35;
  return Math.min(1, peak * 0.95 + tail);
}

function flowToIntensity(flow: number): DayRecord["intensity"] {
  if (flow < 0.12) return 0;
  if (flow < 0.32) return 1;
  if (flow < 0.62) return 2;
  return 3;
}

function computeFlowValue(dayIndex: number, r: DayRecord) {
  if (!r.bleeding) return 0;
  const base = baseFlow(dayIndex);
  const intensityBoost = r.intensity * 0.08;
  const productsBoost = (r.pads + r.tampons) * 0.02;
  return Math.max(0, Math.min(1, base + intensityBoost + productsBoost));
}

function cloneRecords(records: DayRecord[]) {
  return records.map((r) => ({ ...r }));
}

export function InteractiveTimelineDemo() {
  const days = 28;
  const [selected, setSelected] = useState(3);
  const [records, setRecords] = useState<DayRecord[]>(
    Array.from({ length: days }, (_, i) => {
      const f = baseFlow(i);
      return {
        bleeding: f >= 0.08,
        intensity: flowToIntensity(f),
        pads: f >= 0.25 ? 2 : f >= 0.12 ? 1 : 0,
        tampons: 0,
      };
    }),
  );
  const [lastSubmitted, setLastSubmitted] = useState<DayRecord[]>(() => cloneRecords(records));
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");

  const dirty = useMemo(() => {
    for (let i = 0; i < records.length; i++) {
      const a = records[i]!;
      const b = lastSubmitted[i]!;
      if (
        a.bleeding !== b.bleeding ||
        a.intensity !== b.intensity ||
        a.pads !== b.pads ||
        a.tampons !== b.tampons
      ) return true;
    }
    return false;
  }, [records, lastSubmitted]);

  const curveValues = useMemo(
    () => records.map((r, i) => computeFlowValue(i, r)),
    [records],
  );

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startScrollLeft: number } | null>(null);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const activeItem = el.querySelector<HTMLButtonElement>(`button[data-day="${selected}"]`);
    activeItem?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  const updateDay = (patch: Partial<DayRecord>) => {
    setRecords((prev) => {
      const next = prev.slice();
      next[selected] = { ...next[selected]!, ...patch };
      return next;
    });
  };

  const onSubmit = async () => {
    if (!dirty || submitState === "submitting") return;
    setSubmitState("submitting");
    await new Promise((r) => setTimeout(r, 750));
    setLastSubmitted(cloneRecords(records));
    setSubmitState("success");
    window.setTimeout(() => setSubmitState("idle"), 1200);
  };

  const selectedRecord = records[selected]!;

  return (
    <div className="rounded-3xl border border-black/5 bg-white/70 backdrop-blur p-5 shadow-[0_24px_70px_rgba(43,43,43,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-brand-muted">Product Demo</div>
          <div className="text-lg font-semibold tracking-tight text-brand-text">拖动时间轴，模拟记录</div>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className={[
            "rounded-full px-4 py-2 text-sm font-medium transition",
            dirty && submitState === "idle" ? "motion-safe:animate-lp-breathe" : "",
            submitState === "submitting" ? "opacity-70 cursor-wait" : "",
            "bg-brand-text text-white hover:bg-black/90",
          ].filter(Boolean).join(" ")}
          aria-live="polite"
        >
          {submitState === "submitting" ? "提交中…" : submitState === "success" ? "已记录" : dirty ? "提交" : "提交"}
        </button>
      </div>

      <div className="mt-4">
        <CycleCurve values={curveValues} className="rounded-2xl bg-brand-primary/55 p-3" />
        <div className="mt-2 text-xs text-brand-muted">
          数据不会“画出来”，而是像呼吸一样浮现（示意）。
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-brand-text">生理时间轴（28 天）</div>
          <div className="text-xs text-brand-muted">Day {selected + 1}</div>
        </div>

        <div
          ref={timelineRef}
          className="mt-2 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]"
          onPointerDown={(e) => {
            const el = timelineRef.current;
            if (!el) return;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            dragRef.current = { active: true, startX: e.clientX, startScrollLeft: el.scrollLeft };
          }}
          onPointerMove={(e) => {
            const el = timelineRef.current;
            const drag = dragRef.current;
            if (!el || !drag?.active) return;
            el.scrollLeft = drag.startScrollLeft - (e.clientX - drag.startX);
          }}
          onPointerUp={() => {
            if (dragRef.current) dragRef.current.active = false;
          }}
          onPointerCancel={() => {
            if (dragRef.current) dragRef.current.active = false;
          }}
        >
          {Array.from({ length: days }, (_, i) => {
            const active = i === selected;
            const f = curveValues[i] ?? 0;
            return (
              <button
                key={i}
                type="button"
                data-day={i}
                onClick={() => setSelected(i)}
                className={[
                  "shrink-0 rounded-2xl border px-3 py-2 text-left transition",
                  active ? "border-brand-accent/40 bg-brand-primary" : "border-black/5 bg-white hover:bg-brand-primary/35",
                ].join(" ")}
              >
                <div className="text-xs text-brand-muted">Day {i + 1}</div>
                <div className="mt-1 h-1.5 w-14 rounded-full bg-black/5">
                  <div
                    className="h-1.5 rounded-full bg-brand-accent/70 transition-[width] duration-500 ease-in-out"
                    style={{ width: `${Math.round(f * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="text-sm font-medium text-brand-text">当天记录</div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-brand-text">有出血吗？</div>
              <button
                type="button"
                onClick={() => updateDay({ bleeding: !selectedRecord.bleeding })}
                className={[
                  "relative h-8 w-14 rounded-full border transition",
                  selectedRecord.bleeding ? "border-brand-accent/35 bg-brand-primary" : "border-black/10 bg-black/[0.03]",
                ].join(" ")}
                aria-pressed={selectedRecord.bleeding}
              >
                <span
                  className={[
                    "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    selectedRecord.bleeding ? "translate-x-6" : "translate-x-0",
                  ].join(" ")}
                />
                {/* subtle "diffusion" highlight */}
                <span
                  className={[
                    "pointer-events-none absolute inset-0 rounded-full transition",
                    selectedRecord.bleeding ? "bg-brand-secondary/25" : "bg-transparent",
                  ].join(" ")}
                  style={{ transform: selectedRecord.bleeding ? "scale(1)" : "scale(0.96)" }}
                />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-brand-text">出血强度</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  { v: 0 as const, label: "无" },
                  { v: 1 as const, label: "轻" },
                  { v: 2 as const, label: "中" },
                  { v: 3 as const, label: "重" },
                ] as const).map((it) => (
                  <button
                    key={it.v}
                    type="button"
                    onClick={() => updateDay({ intensity: it.v, bleeding: it.v === 0 ? false : true })}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      selectedRecord.intensity === it.v
                        ? "border-brand-accent/40 bg-brand-primary text-brand-text"
                        : "border-black/10 bg-white text-brand-muted hover:bg-brand-primary/35",
                    ].join(" ")}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-brand-text">卫生用品事件</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateDay({ pads: selectedRecord.pads + 1 })}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-muted hover:bg-brand-primary/35 transition"
                >
                  卫生巾 +1
                </button>
                <button
                  type="button"
                  onClick={() => updateDay({ tampons: selectedRecord.tampons + 1 })}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-muted hover:bg-brand-primary/35 transition"
                >
                  棉条 +1
                </button>
                <button
                  type="button"
                  onClick={() => updateDay({ pads: 0, tampons: 0 })}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-muted hover:bg-brand-primary/35 transition"
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-brand-primary/45 p-4">
            <div className="text-sm font-medium text-brand-text">实时反馈</div>
            <div className="mt-2 text-sm text-brand-muted leading-relaxed">
              记录 → 计算 → 理解。你添加的每一个事件，都会即时影响当天的“强度模型”（示意）。
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-white/70 border border-black/5 p-3">
                <div className="text-xs text-brand-muted">估算强度</div>
                <div className="mt-1 text-lg font-semibold text-brand-text">
                  {selectedRecord.bleeding ? ["无", "轻", "中", "重"][selectedRecord.intensity] : "无"}
                </div>
              </div>
              <div className="rounded-xl bg-white/70 border border-black/5 p-3">
                <div className="text-xs text-brand-muted">用品计数</div>
                <div className="mt-1 text-sm text-brand-text">
                  卫生巾 {selectedRecord.pads} · 棉条 {selectedRecord.tampons}
                </div>
              </div>
              <div className="rounded-xl bg-white/70 border border-black/5 p-3">
                <div className="text-xs text-brand-muted">提示（示意）</div>
                <div className="mt-1 text-sm text-brand-text">
                  {computeFlowValue(selected, selectedRecord) > 0.75
                    ? "强度偏高，注意休息与补水。"
                    : computeFlowValue(selected, selectedRecord) > 0.35
                      ? "节律稳定，继续记录更有价值。"
                      : "今天的身体还没有被记录完。"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

