import { and, asc, desc, eq, gte, inArray, lte, notInArray, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { ensureAnalysisSchema } from "~/db/ensureAnalysisSchema.server";
import { menstrualCycle, menstrualDaily, menstrualEvent } from "~/db/schema";

// --- Shared types (align with mini-program contracts) ---

export type AnalysisJudge = { status: string; link: string };

export type AnalysisCycleListItem = {
  cycleId: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  totalVolumeMl: number;
  level: AnalysisJudge;
  distribution: AnalysisJudge;
  color: AnalysisJudge;
  clot: AnalysisJudge;
};

export type AnalysisCycleList = {
  page: number;
  pageSize: number;
  total: number;
  list: AnalysisCycleListItem[];
};

export type AnalysisCycleDay = {
  dayIndex: number;
  date: string;
  totalVolumeMl: number;
  dayColor: string | null;
  clotCounts: { small: number; large: number };
  clotLevel: "无" | "小" | "大" | "多";
  products: Array<{
    id: number;
    eventTime: string;
    eventType: "pad" | "tampon";
    productType: string | null;
    brand: string | null;
    series: string | null;
    lengthMm: number | null;
    model: string | null;
    absorbency: string | null;
    color: string | null;
    volumeMl: number;
  }>;
  symptoms: string[];
};

export type AnalysisCycleDetail = {
  cycle: {
    cycleId: number;
    startDate: string;
    endDate: string;
    daysCount: number;
    totalVolumeMl: number;
    level: AnalysisJudge;
    distribution: AnalysisJudge;
    color: AnalysisJudge;
    clot: AnalysisJudge;
  };
  days: AnalysisCycleDay[];
  products: {
    events: Array<{
      id: number;
      date: string;
      eventTime: string;
      eventType: "pad" | "tampon";
      productType: string | null;
      brand: string | null;
      series: string | null;
      lengthMm: number | null;
      model: string | null;
      absorbency: string | null;
      color: string | null;
      volumeMl: number;
      approxBucketMl: 1 | 5 | 10 | 20;
    }>;
    settlement: {
      rows: string[][];
      stats: Array<{
        text: string;
        kind: string;
        dim: string;
        approxBucketMl: number;
        count: number;
      }>;
    };
  };
};

export type AnalysisOverview = {
  cycleCount: number;
  healthScore: number;
  trend: { status: "平稳" | "略有波动" | "剧烈波动" };
  regularity: { status: string; link: string };
  cycleTimeline: Array<{
    cycleStart: string;
    startLabel: string;
    menstrualDays: number;
    intervalDays: number | null;
    totalVolumeMl: number;
  }>;
  risks: Array<{
    title: string;
    level: "较高风险" | "中等风险";
    url: string;
    triggerText: string;
  }>;
};

export type AnalysisHealthScoreDetail = {
  cycleCount: number;
  baseScore: number;
  healthScore: number;
  totalDeduct: number;
  items: Array<{ trigger: string; deduct: number }>;
};

// --- Small date helpers (keep consistent across H5/weapp) ---

function parseYmdToUtcDate(ymd: string): Date {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error("日期非法");
  }
  return d;
}

function diffDays(aYmd: string, bYmd: string): number {
  const a = parseYmdToUtcDate(aYmd).getTime();
  const b = parseYmdToUtcDate(bYmd).getTime();
  return Math.round((a - b) / 86400000);
}

function formatStartLabel(ymd: string): string {
  const [_, m, d] = ymd.split("-");
  return `${Number(m)}.${Number(d)}`;
}

function formatEventTimeIsoZ(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const s = String(v ?? "");
  if (!s) return new Date(0).toISOString();
  // Common DB formats: "YYYY-MM-DD HH:mm:ss(.SSS)" or already ISO.
  if (s.includes("T")) {
    // If missing timezone, treat as UTC.
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
    return `${s}Z`;
  }
  if (s.includes(" ")) return `${s.replace(" ", "T")}Z`;
  return `${s}Z`;
}

// --- Rules (ported from old backend) ---

type JudgeResult = {
  status: string;
  link: string;
  abnormal: boolean;
  dbStatus: string;
};

function judgeLevel(totalVolumeMl: number): JudgeResult {
  if (totalVolumeMl < 20) {
    return {
      status: "偏低水平",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/level_1",
      abnormal: true,
      dbStatus: "偏低水平",
    };
  }
  if (totalVolumeMl <= 40) {
    return {
      status: "正常，略少水平",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/level_2",
      abnormal: false,
      dbStatus: "正常，略少水平",
    };
  }
  if (totalVolumeMl <= 60) {
    return {
      status: "正常，平均水平",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/level_3",
      abnormal: false,
      dbStatus: "正常，平均水平",
    };
  }
  if (totalVolumeMl <= 100) {
    return {
      status: "正常，略多水平",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/level_4",
      abnormal: false,
      dbStatus: "正常，略多水平",
    };
  }
  return {
    status: "偏高水平",
    link: "https://h5.yuezhihui.xyz/wiki/cautions/level_5",
    abnormal: true,
    dbStatus: "偏高水平",
  };
}

function judgeDistribution(maxDailyVolumeMl: number): JudgeResult {
  if (maxDailyVolumeMl > 80) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/distribution_1",
      abnormal: true,
      dbStatus: "异常",
    };
  }
  return {
    status: "正常",
    link: "https://h5.yuezhihui.xyz/wiki/cautions/distribution_0",
    abnormal: false,
    dbStatus: "正常",
  };
}

function judgeColor(pinkDays: number, brownDays: number, totalDays: number): JudgeResult {
  if (pinkDays >= 2) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/color_1",
      abnormal: true,
      dbStatus: "异常_1",
    };
  }
  if (totalDays > 0 && brownDays / totalDays >= 0.8) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/color_2",
      abnormal: true,
      dbStatus: "异常_2",
    };
  }
  return {
    status: "正常",
    link: "https://h5.yuezhihui.xyz/wiki/cautions/color_0",
    abnormal: false,
    dbStatus: "正常",
  };
}

function judgeClot(totalSmallOrLarge: number, maxLargePerDay: number): JudgeResult {
  const cond1 = totalSmallOrLarge >= 14;
  const cond2 = maxLargePerDay >= 3;

  if (cond1 && cond2) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_12",
      abnormal: true,
      dbStatus: "异常_12",
    };
  }
  if (cond1) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_1",
      abnormal: true,
      dbStatus: "异常_1",
    };
  }
  if (cond2) {
    return {
      status: "异常",
      link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_2",
      abnormal: true,
      dbStatus: "异常_2",
    };
  }
  return {
    status: "正常",
    link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_0",
    abnormal: false,
    dbStatus: "正常",
  };
}

function volumeToApproxBucketMl(volumeMl: number): 1 | 5 | 10 | 20 {
  if (volumeMl < 3) return 1;
  if (volumeMl < 7.5) return 5;
  if (volumeMl < 15) return 10;
  return 20;
}

function computeMean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function computeStdPopulation(nums: number[]): number {
  if (nums.length === 0) return 0;
  const m = computeMean(nums);
  const v = nums.reduce((s, x) => s + (x - m) * (x - m), 0) / nums.length;
  return Math.sqrt(v);
}

type VolatilityStatus = "平稳" | "略有波动" | "剧烈波动";

function judgeVolatility(nums: number[]): VolatilityStatus {
  if (nums.length <= 1) return "平稳";
  const mean = computeMean(nums);
  if (mean <= 0) return "平稳";
  const std = computeStdPopulation(nums);
  const t1 = 1 * mean * 0.2;
  const t2 = 1.5 * mean * 0.2;
  if (std <= t1) return "平稳";
  if (std <= t2) return "略有波动";
  return "剧烈波动";
}

// --- Cycle rebuild (lazy, derived from daily/event data) ---

type DailyRowForCycle = {
  recordDate: string;
  hasBleeding: boolean;
  totalVolumeMl: number;
  dayColor: string | null;
  clotSmallCount: number;
  clotLargeCount: number;
  hasEvent: boolean;
};

type ComputedCycle = {
  startDate: string;
  endDate: string;
  daysCount: number;
  totalVolumeMl: number;
  levelStatus: string;
  distributionStatus: string;
  colorStatus: string;
  clotStatus: string;
};

function buildCycleFromDailyRows(rows: DailyRowForCycle[]): ComputedCycle {
  const startDate = rows[0].recordDate;
  const endDate = rows[rows.length - 1].recordDate;
  const daysCount = rows.reduce((c, r) => c + (r.hasBleeding || r.totalVolumeMl > 0 ? 1 : 0), 0);
  const totalVolumeMl = rows.reduce((s, r) => s + r.totalVolumeMl, 0);

  const maxDailyVolumeMl = rows.reduce((m, r) => Math.max(m, r.totalVolumeMl), 0);
  const pinkDays = rows.reduce((c, r) => c + (r.dayColor === "pink" ? 1 : 0), 0);
  const brownDays = rows.reduce((c, r) => c + (r.dayColor === "brown" ? 1 : 0), 0);
  const totalSmallOrLarge = rows.reduce((c, r) => c + r.clotSmallCount + r.clotLargeCount, 0);
  const maxLargePerDay = rows.reduce((m, r) => Math.max(m, r.clotLargeCount), 0);

  const level = judgeLevel(totalVolumeMl);
  const distribution = judgeDistribution(maxDailyVolumeMl);
  const color = judgeColor(pinkDays, brownDays, daysCount);
  const clot = judgeClot(totalSmallOrLarge, maxLargePerDay);

  return {
    startDate,
    endDate,
    daysCount,
    totalVolumeMl,
    levelStatus: level.dbStatus,
    distributionStatus: distribution.dbStatus,
    colorStatus: color.dbStatus,
    clotStatus: clot.dbStatus,
  };
}

export async function rebuildUserCycles(userId: string): Promise<void> {
  // Self-heal DBs that missed `0003_analysis_cycles_share.sql` (cycle_id + menstrual_cycle).
  await ensureAnalysisSchema();

  // 1) Gather daily rows and "has event" flags.
  const eventDates = await db
    .selectDistinct({ recordDate: menstrualEvent.recordDate })
    .from(menstrualEvent)
    .where(eq(menstrualEvent.userId, userId));

  const eventDateSet = new Set(eventDates.map((r) => String(r.recordDate)));

  const dailyRows = await db
    .select({
      recordDate: menstrualDaily.recordDate,
      hasBleeding: menstrualDaily.hasBleeding,
      totalVolumeMl: menstrualDaily.totalVolumeMl,
      dayColor: menstrualDaily.dayColor,
      clotSmallCount: menstrualDaily.clotSmallCount,
      clotLargeCount: menstrualDaily.clotLargeCount,
    })
    .from(menstrualDaily)
    .where(eq(menstrualDaily.userId, userId))
    .orderBy(asc(menstrualDaily.recordDate));

  const byDate = new Map<string, Omit<DailyRowForCycle, "recordDate">>();
  for (const r of dailyRows) {
    const d = String(r.recordDate);
    byDate.set(d, {
      hasBleeding: Boolean(r.hasBleeding),
      totalVolumeMl: Number(r.totalVolumeMl ?? 0),
      dayColor: (r.dayColor as any) ?? null,
      clotSmallCount: Number(r.clotSmallCount ?? 0),
      clotLargeCount: Number(r.clotLargeCount ?? 0),
      hasEvent: eventDateSet.has(d),
    });
  }

  // Add "event-only" dates if needed (rare, but keeps cycles consistent).
  for (const d of eventDateSet) {
    if (byDate.has(d)) continue;
    byDate.set(d, {
      hasBleeding: false,
      totalVolumeMl: 0,
      dayColor: null,
      clotSmallCount: 0,
      clotLargeCount: 0,
      hasEvent: true,
    });
  }

  const rows: DailyRowForCycle[] = Array.from(byDate.entries())
    .map(([recordDate, rest]) => ({ recordDate, ...rest }))
    .filter((r) => {
      return (
        r.hasBleeding ||
        r.totalVolumeMl > 0 ||
        r.dayColor !== null ||
        r.clotSmallCount > 0 ||
        r.clotLargeCount > 0 ||
        r.hasEvent
      );
    })
    .sort((a, b) => a.recordDate.localeCompare(b.recordDate));

  // 2) Compute cycles by date gaps.
  const computed: Array<{ cycle: ComputedCycle; dates: string[] }> = [];
  if (rows.length > 0) {
    let current: DailyRowForCycle[] = [];
    for (const r of rows) {
      if (current.length === 0) {
        current.push(r);
        continue;
      }
      const prev = current[current.length - 1].recordDate;
      const gap = diffDays(r.recordDate, prev);
      if (gap >= 4) {
        computed.push({
          cycle: buildCycleFromDailyRows(current),
          dates: current.map((x) => x.recordDate),
        });
        current = [r];
      } else {
        current.push(r);
      }
    }
    if (current.length > 0) {
      computed.push({
        cycle: buildCycleFromDailyRows(current),
        dates: current.map((x) => x.recordDate),
      });
    }
  }

  const startDates = computed.map((c) => c.cycle.startDate);

  // 3) Persist cycles and set cycle_id markers.
  //
  // Important: we intentionally DO NOT use transactions here.
  // The Neon HTTP driver used by Remix/Neon doesn't support transactions, and Drizzle will throw:
  // "no transaction support neon-http driver".
  // Rebuild is idempotent; partial writes are acceptable and will be corrected on next rebuild.
  const tx = db;

  // Reset markers first (we recompute in full).
  await tx.update(menstrualDaily).set({ cycleId: null }).where(eq(menstrualDaily.userId, userId));
  await tx.update(menstrualEvent).set({ cycleId: null }).where(eq(menstrualEvent.userId, userId));

  if (startDates.length === 0) {
    await tx.delete(menstrualCycle).where(eq(menstrualCycle.userId, userId));
    return;
  }

  // Upsert cycles (by userId + startDate).
  for (const { cycle } of computed) {
    await tx
      .insert(menstrualCycle)
      .values({
        userId,
        startDate: cycle.startDate as any,
        endDate: cycle.endDate as any,
        daysCount: cycle.daysCount,
        totalVolumeMl: cycle.totalVolumeMl,
        levelStatus: cycle.levelStatus,
        distributionStatus: cycle.distributionStatus,
        colorStatus: cycle.colorStatus,
        clotStatus: cycle.clotStatus,
        // Keep updatedAt fresh for debugging/ops.
        updatedAt: sql`now()`,
      } as any)
      .onConflictDoUpdate({
        target: [menstrualCycle.userId, menstrualCycle.startDate],
        set: {
          endDate: cycle.endDate as any,
          daysCount: cycle.daysCount,
          totalVolumeMl: cycle.totalVolumeMl,
          levelStatus: cycle.levelStatus,
          distributionStatus: cycle.distributionStatus,
          colorStatus: cycle.colorStatus,
          clotStatus: cycle.clotStatus,
          updatedAt: sql`now()`,
        } as any,
      });
  }

  // Delete stale cycles.
  await tx
    .delete(menstrualCycle)
    .where(and(eq(menstrualCycle.userId, userId), notInArray(menstrualCycle.startDate, startDates as any)));

  // Resolve ids for new cycles.
  const cycleRows = await tx
    .select({ id: menstrualCycle.id, startDate: menstrualCycle.startDate, endDate: menstrualCycle.endDate })
    .from(menstrualCycle)
    .where(and(eq(menstrualCycle.userId, userId), inArray(menstrualCycle.startDate, startDates as any)));

  const idByStart = new Map<string, { id: number; endDate: string }>();
  for (const r of cycleRows) {
    idByStart.set(String(r.startDate), { id: Number(r.id), endDate: String(r.endDate) });
  }

  // Set markers.
  for (const c of computed) {
    const hit = idByStart.get(c.cycle.startDate);
    if (!hit) continue;
    if (c.dates.length > 0) {
      await tx
        .update(menstrualDaily)
        .set({ cycleId: hit.id })
        .where(and(eq(menstrualDaily.userId, userId), inArray(menstrualDaily.recordDate, c.dates as any)));
    }
    await tx
      .update(menstrualEvent)
      .set({ cycleId: hit.id })
      .where(
        and(
          eq(menstrualEvent.userId, userId),
          gte(menstrualEvent.recordDate, c.cycle.startDate as any),
          lte(menstrualEvent.recordDate, hit.endDate as any),
        ),
      );
  }
}

// --- Queries (API helpers) ---

export async function fetchCycleListForUser(userId: string, page: number, pageSize: number): Promise<AnalysisCycleList> {
  await rebuildUserCycles(userId);

  const [{ cnt } = { cnt: 0 }] =
    (await db
      .select({ cnt: sql<number>`count(*)` })
      .from(menstrualCycle)
      .where(eq(menstrualCycle.userId, userId))) ?? [];

  const total = Number(cnt ?? 0);
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: menstrualCycle.id,
      startDate: menstrualCycle.startDate,
      endDate: menstrualCycle.endDate,
      daysCount: menstrualCycle.daysCount,
      totalVolumeMl: menstrualCycle.totalVolumeMl,
      levelStatus: menstrualCycle.levelStatus,
      distributionStatus: menstrualCycle.distributionStatus,
      colorStatus: menstrualCycle.colorStatus,
      clotStatus: menstrualCycle.clotStatus,
    })
    .from(menstrualCycle)
    .where(eq(menstrualCycle.userId, userId))
    .orderBy(desc(menstrualCycle.startDate), desc(menstrualCycle.id))
    .limit(pageSize)
    .offset(offset);

  return {
    page,
    pageSize,
    total,
    list: rows.map((r) => {
      const level = judgeLevel(Number(r.totalVolumeMl ?? 0));
      const distribution =
        r.distributionStatus === "异常"
          ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/distribution_1" }
          : { status: "正常", link: "https://h5.yuezhihui.xyz/wiki/cautions/distribution_0" };

      const colorCode = String(r.colorStatus ?? "正常");
      const color =
        colorCode === "异常_1"
          ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/color_1" }
          : colorCode === "异常_2"
            ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/color_2" }
            : { status: "正常", link: "https://h5.yuezhihui.xyz/wiki/cautions/color_0" };

      const clotCode = String(r.clotStatus ?? "正常");
      const clot =
        clotCode === "异常_12"
          ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_12" }
          : clotCode === "异常_2"
            ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_2" }
            : clotCode === "异常_1"
              ? { status: "异常", link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_1" }
              : { status: "正常", link: "https://h5.yuezhihui.xyz/wiki/cautions/clot_0" };

      return {
        cycleId: Number(r.id),
        startDate: String(r.startDate),
        endDate: String(r.endDate),
        daysCount: Number(r.daysCount ?? 0),
        totalVolumeMl: Number(r.totalVolumeMl ?? 0),
        level: { status: level.status, link: level.link },
        distribution,
        color,
        clot,
      };
    }),
  };
}

export async function fetchCycleDetailForUser(userId: string, cycleId: number): Promise<AnalysisCycleDetail> {
  await rebuildUserCycles(userId);

  const cycleRows = await db
    .select({
      id: menstrualCycle.id,
      startDate: menstrualCycle.startDate,
      endDate: menstrualCycle.endDate,
      daysCount: menstrualCycle.daysCount,
      totalVolumeMl: menstrualCycle.totalVolumeMl,
    })
    .from(menstrualCycle)
    .where(and(eq(menstrualCycle.userId, userId), eq(menstrualCycle.id, cycleId)))
    .limit(1);

  if (cycleRows.length === 0) {
    throw new Error("周期不存在");
  }

  const cycle = cycleRows[0];

  const dailyRows = await db
    .select({
      recordDate: menstrualDaily.recordDate,
      totalVolumeMl: menstrualDaily.totalVolumeMl,
      dayColor: menstrualDaily.dayColor,
      clotSmallCount: menstrualDaily.clotSmallCount,
      clotLargeCount: menstrualDaily.clotLargeCount,
    })
    .from(menstrualDaily)
    .where(
      and(
        eq(menstrualDaily.userId, userId),
        gte(menstrualDaily.recordDate, String(cycle.startDate) as any),
        lte(menstrualDaily.recordDate, String(cycle.endDate) as any),
        sql`(${menstrualDaily.hasBleeding} = true OR ${menstrualDaily.totalVolumeMl} > 0)` as any,
      ),
    )
    .orderBy(asc(menstrualDaily.recordDate));

  const eventRows = await db
    .select({
      id: menstrualEvent.id,
      recordDate: menstrualEvent.recordDate,
      eventTime: menstrualEvent.eventTime,
      eventType: menstrualEvent.eventType,
      volumeMl: menstrualEvent.volumeMl,
      color: menstrualEvent.color,
      productType: menstrualEvent.productType,
      brand: menstrualEvent.brand,
      series: menstrualEvent.series,
      lengthMm: menstrualEvent.lengthMm,
      model: menstrualEvent.model,
      absorbency: menstrualEvent.absorbency,
      symptomName: menstrualEvent.symptomName,
    })
    .from(menstrualEvent)
    .where(
      and(
        eq(menstrualEvent.userId, userId),
        gte(menstrualEvent.recordDate, String(cycle.startDate) as any),
        lte(menstrualEvent.recordDate, String(cycle.endDate) as any),
      ),
    )
    .orderBy(asc(menstrualEvent.eventTime), asc(menstrualEvent.id));

  const eventsByDate = new Map<string, typeof eventRows>();
  for (const e of eventRows) {
    const d = String(e.recordDate);
    const list = eventsByDate.get(d) ?? [];
    list.push(e);
    eventsByDate.set(d, list);
  }

  const productEvents = eventRows
    .filter((e) => e.eventType === "pad" || e.eventType === "tampon")
    .map((e) => ({
      id: Number(e.id),
      date: String(e.recordDate),
      eventTime: formatEventTimeIsoZ(e.eventTime),
      eventType: e.eventType as "pad" | "tampon",
      productType: (e.productType as any) ?? null,
      brand: (e.brand as any) ?? null,
      series: (e.series as any) ?? null,
      lengthMm: (e.lengthMm as any) ?? null,
      model: (e.model as any) ?? null,
      absorbency: (e.absorbency as any) ?? null,
      color: (e.color as any) ?? null,
      volumeMl: Number(e.volumeMl ?? 0),
      approxBucketMl: volumeToApproxBucketMl(Number(e.volumeMl ?? 0)),
    }));

  const settlementTokens = productEvents.map((e) => {
    const kind = e.productType || (e.eventType === "tampon" ? "棉条" : "卫生巾");
    const dim =
      typeof e.lengthMm === "number" && e.lengthMm > 0 ? `${e.lengthMm}mm` : e.absorbency || e.model || "";
    const dimText = dim ? ` ${dim}` : "";
    return `${kind}${dimText} 约${e.approxBucketMl}mL`;
  });

  const settlementRows: string[][] = [];
  for (let i = 0; i < settlementTokens.length; i += 8) {
    settlementRows.push(settlementTokens.slice(i, i + 8));
  }

  const settlementStatsMap = new Map<string, { kind: string; dim: string; bucket: number; count: number }>();
  for (const e of productEvents) {
    const kind = e.productType || (e.eventType === "tampon" ? "棉条" : "卫生巾");
    const dim =
      typeof e.lengthMm === "number" && e.lengthMm > 0 ? `${e.lengthMm}mm` : e.absorbency || e.model || "";
    const key = `${kind}|${dim}|${e.approxBucketMl}`;
    const prev = settlementStatsMap.get(key);
    if (prev) prev.count += 1;
    else settlementStatsMap.set(key, { kind, dim, bucket: e.approxBucketMl, count: 1 });
  }

  const settlementStats = Array.from(settlementStatsMap.values())
    .sort((a, b) => (a.kind + a.dim).localeCompare(b.kind + b.dim) || a.bucket - b.bucket)
    .map((s) => {
      const dimText = s.dim ? ` ${s.dim}` : "";
      return {
        text: `${s.kind}${dimText} 约${s.bucket}mL *${s.count}`,
        kind: s.kind,
        dim: s.dim,
        approxBucketMl: s.bucket,
        count: s.count,
      };
    });

  const days: AnalysisCycleDay[] = dailyRows.map((d, idx) => {
    const totalClots = Number(d.clotSmallCount ?? 0) + Number(d.clotLargeCount ?? 0);
    const clotLevel: "无" | "小" | "大" | "多" =
      totalClots >= 2
        ? "多"
        : Number(d.clotLargeCount ?? 0) >= 1
          ? "大"
          : Number(d.clotSmallCount ?? 0) >= 1
            ? "小"
            : "无";

    const dateEvents = eventsByDate.get(String(d.recordDate)) ?? [];
    const symptoms = dateEvents
      .filter((e) => e.eventType === "symptom")
      .map((e) => e.symptomName)
      .filter((v): v is string => Boolean(v));

    const products = dateEvents
      .filter((e) => e.eventType === "pad" || e.eventType === "tampon")
      .map((e) => ({
        id: Number(e.id),
        eventTime: formatEventTimeIsoZ(e.eventTime),
        eventType: e.eventType as "pad" | "tampon",
        productType: (e.productType as any) ?? null,
        brand: (e.brand as any) ?? null,
        series: (e.series as any) ?? null,
        lengthMm: (e.lengthMm as any) ?? null,
        model: (e.model as any) ?? null,
        absorbency: (e.absorbency as any) ?? null,
        color: (e.color as any) ?? null,
        volumeMl: Number(e.volumeMl ?? 0),
      }));

    return {
      dayIndex: idx + 1,
      date: String(d.recordDate),
      totalVolumeMl: Number(d.totalVolumeMl ?? 0),
      dayColor: (d.dayColor as any) ?? null,
      clotCounts: { small: Number(d.clotSmallCount ?? 0), large: Number(d.clotLargeCount ?? 0) },
      clotLevel,
      products,
      symptoms,
    };
  });

  const level = judgeLevel(Number(cycle.totalVolumeMl ?? 0));
  const distribution = judgeDistribution(days.reduce((m, r) => Math.max(m, r.totalVolumeMl), 0));
  const pinkDays = days.reduce((c, r) => c + (r.dayColor === "pink" ? 1 : 0), 0);
  const brownDays = days.reduce((c, r) => c + (r.dayColor === "brown" ? 1 : 0), 0);
  const color = judgeColor(pinkDays, brownDays, days.length);
  const clotTotalSmallOrLarge = days.reduce((c, r) => c + r.clotCounts.small + r.clotCounts.large, 0);
  const clotMaxLarge = days.reduce((m, r) => Math.max(m, r.clotCounts.large), 0);
  const clot = judgeClot(clotTotalSmallOrLarge, clotMaxLarge);

  return {
    cycle: {
      cycleId: Number(cycle.id),
      startDate: String(cycle.startDate),
      endDate: String(cycle.endDate),
      daysCount: Number(cycle.daysCount ?? 0),
      totalVolumeMl: Number(cycle.totalVolumeMl ?? 0),
      level: { status: level.status, link: level.link },
      distribution: { status: distribution.status, link: distribution.link },
      color: { status: color.status, link: color.link },
      clot: { status: clot.status, link: clot.link },
    },
    days,
    products: {
      events: productEvents,
      settlement: {
        rows: settlementRows,
        stats: settlementStats,
      },
    },
  };
}

type RiskItem = { title: string; level: "较高风险" | "中等风险"; url: string; triggerText: string };

function hasConsecutive(bools: boolean[], need: number): boolean {
  if (need <= 1) return bools.some(Boolean);
  let streak = 0;
  for (const v of bools) {
    if (v) {
      streak += 1;
      if (streak >= need) return true;
    } else {
      streak = 0;
    }
  }
  return false;
}

function buildRisks(input: {
  cyclesDesc: {
    startDate: string;
    menstrualDays: number;
    totalVolumeMl: number;
    distributionStatus: string;
    colorStatus: string;
    clotStatus: string;
  }[];
  avgTotalVolume: number;
  avgMenstrualDays: number;
  intervalDaysSeq: number[];
  regularityStatus: string;
  clotAbnormalCount: number;
}): RiskItem[] {
  const cycles = input.cyclesDesc;
  const anyTotalOver100 = cycles.some((c) => c.totalVolumeMl > 100);
  const anyTotalOver150 = cycles.some((c) => c.totalVolumeMl > 150);
  const anyTotalOver100AndClotAbnormal = cycles.some((c) => c.totalVolumeMl > 100 && c.clotStatus.startsWith("异常"));
  const anyTotalOver150AndClotAbnormal = cycles.some((c) => c.totalVolumeMl > 150 && c.clotStatus.startsWith("异常"));

  const anyClotAbnormal = cycles.some((c) => c.clotStatus.startsWith("异常"));
  const clotAbnormalCount = input.clotAbnormalCount;

  const distAbnormalCount = cycles.reduce((n, c) => n + (c.distributionStatus === "异常" ? 1 : 0), 0);

  const consecutive2DistAbnormal = hasConsecutive(cycles.map((c) => c.distributionStatus === "异常"), 2);
  const consecutive2ColorAbnormal = hasConsecutive(cycles.map((c) => c.colorStatus.startsWith("异常")), 2);
  const consecutive2LowVolume = hasConsecutive(cycles.map((c) => c.totalVolumeMl < 20), 2);
  const consecutive2ShortDays = hasConsecutive(cycles.map((c) => c.menstrualDays <= 3), 2);
  const consecutive2LongDays = hasConsecutive(cycles.map((c) => c.menstrualDays >= 9), 2);
  const consecutive3IntervalsOver45 = hasConsecutive(input.intervalDaysSeq.map((d) => d > 45), 3);

  const intervalOver40Count = input.intervalDaysSeq.reduce((n, d) => n + (d > 40 ? 1 : 0), 0);
  const avgIntervalDays = computeMean(input.intervalDaysSeq);

  const risks: RiskItem[] = [];
  const pushUniqueTitle = (item: RiskItem) => {
    if (risks.some((r) => r.title === item.title)) return;
    risks.push(item);
  };

  if (input.avgTotalVolume > 120 || clotAbnormalCount >= 2) {
    pushUniqueTitle({
      title: "月经过多",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/hmb",
      triggerText:
        input.avgTotalVolume > 120 && clotAbnormalCount >= 2
          ? "所有周期平均总流量 > 120ml 或所有周期中 ≥2次 血块异常"
          : input.avgTotalVolume > 120
            ? "所有周期平均总流量 > 120ml"
            : "所有周期中 ≥2次 血块异常",
    });
  } else if (anyTotalOver100 || clotAbnormalCount >= 1) {
    pushUniqueTitle({
      title: "月经过多",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/hmb",
      triggerText:
        anyTotalOver100 && clotAbnormalCount >= 1
          ? "所有周期有 ≥1次 总流量> 100ml 或所有周期中 ≥1次 血块异常"
          : anyTotalOver100
            ? "所有周期有 ≥1次 总流量> 100ml"
            : "所有周期中 ≥1次 血块异常",
    });
  }

  if (input.avgTotalVolume < 20) {
    pushUniqueTitle({
      title: "月经过少",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/scanty-menstruation",
      triggerText: "所有周期平均总流量 < 20ml",
    });
  } else if (input.avgTotalVolume < 25) {
    pushUniqueTitle({
      title: "月经过少",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/scanty-menstruation",
      triggerText: "所有周期平均总流量 < 25ml",
    });
  }

  if (input.regularityStatus === "剧烈波动" || input.regularityStatus.startsWith("剧烈波动")) {
    pushUniqueTitle({
      title: "异常子宫出血",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/aub",
      triggerText: "周期规律性 = 剧烈波动",
    });
  } else if (input.regularityStatus === "略有波动") {
    pushUniqueTitle({
      title: "异常子宫出血",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/aub",
      triggerText: "周期规律性 = 略有波动",
    });
  }

  if (input.avgTotalVolume > 120) {
    pushUniqueTitle({
      title: "缺铁性贫血",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/iron-deficiency-anemia",
      triggerText: "所有周期平均总流量 > 120ml",
    });
  } else if (input.avgTotalVolume > 100) {
    pushUniqueTitle({
      title: "缺铁性贫血",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/iron-deficiency-anemia",
      triggerText: "所有周期平均总流量 > 100ml",
    });
  }

  if (anyTotalOver150AndClotAbnormal) {
    pushUniqueTitle({
      title: "子宫肌瘤",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/uterine-fibroids",
      triggerText: "任一周期：总流量 > 150ml 且 血块异常",
    });
  } else if (anyTotalOver150 || anyTotalOver100) {
    pushUniqueTitle({
      title: "子宫肌瘤",
      level: anyTotalOver150 ? "较高风险" : "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/uterine-fibroids",
      triggerText: anyTotalOver150 ? "任一周期：总流量 > 150ml" : "任一周期：总流量 > 100ml",
    });
  }

  if (consecutive2DistAbnormal) {
    pushUniqueTitle({
      title: "子宫内膜异常",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/endometrial-abnormalities",
      triggerText: "连续2个周期：流量分布异常",
    });
  } else if (cycles.length > 0 && distAbnormalCount / cycles.length >= 0.25) {
    pushUniqueTitle({
      title: "子宫内膜异常",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/endometrial-abnormalities",
      triggerText: "所有周期中 ≥25% 的周期 流量分布异常",
    });
  }

  if ((input.regularityStatus === "剧烈波动" || input.regularityStatus.startsWith("剧烈波动")) && avgIntervalDays > 45) {
    pushUniqueTitle({
      title: "多囊卵巢综合征（PCOS）",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/pcos",
      triggerText: "周期规律性 = 剧烈波动 且 间隔天数平均值 >45 天",
    });
  } else if (input.regularityStatus === "略有波动") {
    pushUniqueTitle({
      title: "多囊卵巢综合征（PCOS）",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/pcos",
      triggerText: "周期规律性 = 略有波动",
    });
  }

  if (consecutive2LowVolume) {
    pushUniqueTitle({
      title: "黄体功能不足",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/luteal-phase-defect",
      triggerText: "连续2个周期：总流量 < 20ml",
    });
  } else if (input.avgTotalVolume < 25) {
    pushUniqueTitle({
      title: "黄体功能不足",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/luteal-phase-defect",
      triggerText: "所有周期平均总流量 < 25ml",
    });
  }

  if (anyTotalOver100AndClotAbnormal) {
    pushUniqueTitle({
      title: "子宫腺肌症",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/adenomyosis",
      triggerText: "任一周期：血块异常 且 总流量 > 100ml",
    });
  } else if (anyClotAbnormal) {
    pushUniqueTitle({
      title: "子宫腺肌症",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/adenomyosis",
      triggerText: "任一周期：血块异常",
    });
  }

  if (consecutive2ColorAbnormal && input.regularityStatus !== "平稳") {
    pushUniqueTitle({
      title: "内分泌紊乱",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/endocrine-disorders",
      triggerText: "连续2个周期颜色异常 且 周期规律性 = 剧烈波动或略有波动",
    });
  } else if (consecutive2ColorAbnormal) {
    pushUniqueTitle({
      title: "内分泌紊乱",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/endocrine-disorders",
      triggerText: "连续2个周期颜色异常",
    });
  }

  if (consecutive3IntervalsOver45) {
    pushUniqueTitle({
      title: "排卵障碍",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/ovulation-disorders",
      triggerText: "连续3个周期 周期间隔 > 45天",
    });
  } else if (intervalOver40Count >= 2) {
    pushUniqueTitle({
      title: "排卵障碍",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/ovulation-disorders",
      triggerText: "所有周期中 ≥2次 周期间隔 > 40天",
    });
  }

  if (input.avgMenstrualDays <= 3 && cycles.length > 0) {
    pushUniqueTitle({
      title: "经期过短综合征",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/short-period-syndrome",
      triggerText: "所有周期 平均经期 ≤ 3天",
    });
  } else if (consecutive2ShortDays) {
    pushUniqueTitle({
      title: "经期过短综合征",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/short-period-syndrome",
      triggerText: "连续2个周期 经期 ≤ 3天",
    });
  }

  if (input.avgMenstrualDays >= 9 && cycles.length > 0) {
    pushUniqueTitle({
      title: "经期过长综合征",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/prolonged-period-syndrome",
      triggerText: "所有周期 平均经期 ≥ 9天",
    });
  } else if (consecutive2LongDays) {
    pushUniqueTitle({
      title: "经期过长综合征",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/aub/prolonged-period-syndrome",
      triggerText: "连续2个周期 经期 ≥ 9天",
    });
  }

  if (input.avgTotalVolume > 120 && clotAbnormalCount >= 2) {
    pushUniqueTitle({
      title: "慢性失血或出血性疾病",
      level: "较高风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/chronic-bleeding-disorders",
      triggerText: "所有周期平均总流量 > 120ml 且所有周期中 ≥2次 血块异常",
    });
  } else if (input.avgTotalVolume > 100 || clotAbnormalCount >= 2) {
    pushUniqueTitle({
      title: "慢性失血或出血性疾病",
      level: "中等风险",
      url: "https://h5.yuezhihui.xyz/wiki/physiology/chronic-bleeding-disorders",
      triggerText:
        input.avgTotalVolume > 100 && clotAbnormalCount >= 2
          ? "所有周期平均总流量 > 100ml 或所有周期中 ≥2次 血块异常"
          : input.avgTotalVolume > 100
            ? "所有周期平均总流量 > 100ml"
            : "所有周期中 ≥2次 血块异常",
    });
  }

  return risks;
}

export async function fetchOverviewForUser(userId: string, limit: number): Promise<AnalysisOverview> {
  await rebuildUserCycles(userId);

  const cycleRows = await db
    .select({
      id: menstrualCycle.id,
      startDate: menstrualCycle.startDate,
      endDate: menstrualCycle.endDate,
      daysCount: menstrualCycle.daysCount,
      totalVolumeMl: menstrualCycle.totalVolumeMl,
      distributionStatus: menstrualCycle.distributionStatus,
      colorStatus: menstrualCycle.colorStatus,
      clotStatus: menstrualCycle.clotStatus,
    })
    .from(menstrualCycle)
    .where(eq(menstrualCycle.userId, userId))
    .orderBy(desc(menstrualCycle.startDate), desc(menstrualCycle.id))
    .limit(limit);

  const cyclesDesc = cycleRows.map((r) => ({
    id: Number(r.id),
    startDate: String(r.startDate),
    endDate: String(r.endDate),
    menstrualDays: Number(r.daysCount ?? 0),
    totalVolumeMl: Number(r.totalVolumeMl ?? 0),
    distributionStatus: String(r.distributionStatus ?? "正常"),
    colorStatus: String(r.colorStatus ?? "正常"),
    clotStatus: String(r.clotStatus ?? "正常"),
  }));

  if (cyclesDesc.length === 0) {
    return {
      cycleCount: 0,
      healthScore: 100,
      trend: { status: "平稳" },
      regularity: { status: "平稳", link: "https://h5.yuezhihui.xyz/wiki/cautions/regularity_0" },
      cycleTimeline: [],
      risks: [],
    };
  }

  const totalVolumes = cyclesDesc.map((c) => c.totalVolumeMl);
  const trendStatus: VolatilityStatus = judgeVolatility(totalVolumes);

  const menstrualDaysSeq = cyclesDesc.map((c) => c.menstrualDays);
  const intervalDaysSeq = cyclesDesc
    .map((c, idx) => {
      const next = cyclesDesc[idx + 1];
      if (!next) return null;
      return diffDays(c.startDate, next.startDate);
    })
    .filter((v): v is number => v !== null);

  const menstrualDaysVol = judgeVolatility(menstrualDaysSeq);
  const intervalDaysVol = judgeVolatility(intervalDaysSeq);

  const regularityTriggers: { code: string; label: string }[] = [];
  if (menstrualDaysVol === "略有波动") regularityTriggers.push({ code: "1", label: "月经天数略有波动" });
  if (menstrualDaysVol === "剧烈波动") regularityTriggers.push({ code: "2", label: "月经天数剧烈波动" });
  if (intervalDaysVol === "略有波动") regularityTriggers.push({ code: "3", label: "间隔天数略有波动" });
  if (intervalDaysVol === "剧烈波动") regularityTriggers.push({ code: "4", label: "间隔天数剧烈波动" });

  let regularityStatus: string;
  let regularityLink: string;
  if (regularityTriggers.length === 0) {
    regularityStatus = "平稳";
    regularityLink = "https://h5.yuezhihui.xyz/wiki/cautions/regularity_0";
  } else if (regularityTriggers.length >= 2) {
    regularityStatus = "剧烈波动（以更高的波动为准）";
    regularityLink = "https://h5.yuezhihui.xyz/wiki/cautions/regularity_14";
  } else {
    const only = regularityTriggers[0].code;
    regularityStatus = only === "1" || only === "3" ? "略有波动" : "剧烈波动";
    regularityLink = `https://h5.yuezhihui.xyz/wiki/cautions/regularity_${only}`;
  }

  const avgTotalVolume = computeMean(totalVolumes);
  const avgLevel = judgeLevel(avgTotalVolume);
  let healthScore = 100;
  if (avgLevel.abnormal) healthScore -= 30;

  const distributionAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.distributionStatus === "异常" ? 1 : 0), 0);
  const colorAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.colorStatus.startsWith("异常") ? 1 : 0), 0);
  const clotAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.clotStatus.startsWith("异常") ? 1 : 0), 0);

  healthScore -= Math.min(10, distributionAbnormalCount * 5);
  healthScore -= Math.min(10, colorAbnormalCount * 5);
  healthScore -= Math.min(10, clotAbnormalCount * 5);

  if (trendStatus === "略有波动") healthScore -= 5;
  if (trendStatus === "剧烈波动") healthScore -= 10;

  let regularityDeduct = 0;
  if (menstrualDaysVol === "略有波动") regularityDeduct += 5;
  if (menstrualDaysVol === "剧烈波动") regularityDeduct += 10;
  if (intervalDaysVol === "略有波动") regularityDeduct += 5;
  if (intervalDaysVol === "剧烈波动") regularityDeduct += 10;
  healthScore -= Math.min(20, regularityDeduct);

  healthScore = Math.max(0, Math.min(100, healthScore));

  const timeline = cyclesDesc.map((c, idx) => {
    const next = cyclesDesc[idx + 1];
    const intervalDays = next ? diffDays(c.startDate, next.startDate) : null;
    return {
      cycleStart: c.startDate,
      startLabel: formatStartLabel(c.startDate),
      menstrualDays: c.menstrualDays,
      intervalDays,
      totalVolumeMl: c.totalVolumeMl,
    };
  });

  const risks = buildRisks({
    cyclesDesc,
    avgTotalVolume,
    avgMenstrualDays: computeMean(menstrualDaysSeq),
    intervalDaysSeq,
    regularityStatus,
    clotAbnormalCount,
  });

  return {
    cycleCount: cyclesDesc.length,
    healthScore,
    trend: { status: trendStatus },
    regularity: { status: regularityStatus, link: regularityLink },
    cycleTimeline: timeline,
    risks,
  };
}

export async function fetchHealthScoreDetailForUser(userId: string, limit: number): Promise<AnalysisHealthScoreDetail> {
  // Keep the score consistent with overview, but also expose deduction triggers.
  await rebuildUserCycles(userId);

  const cycleRows = await db
    .select({
      id: menstrualCycle.id,
      startDate: menstrualCycle.startDate,
      daysCount: menstrualCycle.daysCount,
      totalVolumeMl: menstrualCycle.totalVolumeMl,
      distributionStatus: menstrualCycle.distributionStatus,
      colorStatus: menstrualCycle.colorStatus,
      clotStatus: menstrualCycle.clotStatus,
    })
    .from(menstrualCycle)
    .where(eq(menstrualCycle.userId, userId))
    .orderBy(desc(menstrualCycle.startDate), desc(menstrualCycle.id))
    .limit(limit);

  const cyclesDesc = cycleRows.map((r) => ({
    startDate: String(r.startDate),
    menstrualDays: Number(r.daysCount ?? 0),
    totalVolumeMl: Number(r.totalVolumeMl ?? 0),
    distributionStatus: String(r.distributionStatus ?? "正常"),
    colorStatus: String(r.colorStatus ?? "正常"),
    clotStatus: String(r.clotStatus ?? "正常"),
  }));

  const baseScore = 100;
  if (cyclesDesc.length === 0) {
    return { cycleCount: 0, baseScore, healthScore: 100, totalDeduct: 0, items: [] };
  }

  const items: Array<{ trigger: string; deduct: number }> = [];
  const totalVolumes = cyclesDesc.map((c) => c.totalVolumeMl);
  const trendStatus: VolatilityStatus = judgeVolatility(totalVolumes);

  const menstrualDaysSeq = cyclesDesc.map((c) => c.menstrualDays);
  const intervalDaysSeq = cyclesDesc
    .map((c, idx) => {
      const next = cyclesDesc[idx + 1];
      if (!next) return null;
      return diffDays(c.startDate, next.startDate);
    })
    .filter((v): v is number => v !== null);

  const menstrualDaysVol = judgeVolatility(menstrualDaysSeq);
  const intervalDaysVol = judgeVolatility(intervalDaysSeq);

  let healthScore = baseScore;

  const avgTotalVolume = computeMean(totalVolumes);
  const avgLevel = judgeLevel(avgTotalVolume);
  if (avgLevel.abnormal) {
    healthScore -= 30;
    items.push({ trigger: `平均总流量异常（${avgLevel.status}）`, deduct: 30 });
  }

  const distributionAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.distributionStatus === "异常" ? 1 : 0), 0);
  const colorAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.colorStatus.startsWith("异常") ? 1 : 0), 0);
  const clotAbnormalCount = cyclesDesc.reduce((c, r) => c + (r.clotStatus.startsWith("异常") ? 1 : 0), 0);

  const distDeduct = Math.min(10, distributionAbnormalCount * 5);
  if (distDeduct > 0) items.push({ trigger: `流量分布异常（${distributionAbnormalCount}次）`, deduct: distDeduct });
  healthScore -= distDeduct;

  const colorDeduct = Math.min(10, colorAbnormalCount * 5);
  if (colorDeduct > 0) items.push({ trigger: `颜色异常（${colorAbnormalCount}次）`, deduct: colorDeduct });
  healthScore -= colorDeduct;

  const clotDeduct = Math.min(10, clotAbnormalCount * 5);
  if (clotDeduct > 0) items.push({ trigger: `血块异常（${clotAbnormalCount}次）`, deduct: clotDeduct });
  healthScore -= clotDeduct;

  if (trendStatus === "略有波动") {
    healthScore -= 5;
    items.push({ trigger: "总流量波动略有波动", deduct: 5 });
  } else if (trendStatus === "剧烈波动") {
    healthScore -= 10;
    items.push({ trigger: "总流量波动剧烈波动", deduct: 10 });
  }

  // Regularity (capped at 20 in overview)
  const regParts: Array<{ label: string; deduct: number }> = [];
  if (menstrualDaysVol === "略有波动") regParts.push({ label: "月经天数略有波动", deduct: 5 });
  if (menstrualDaysVol === "剧烈波动") regParts.push({ label: "月经天数剧烈波动", deduct: 10 });
  if (intervalDaysVol === "略有波动") regParts.push({ label: "间隔天数略有波动", deduct: 5 });
  if (intervalDaysVol === "剧烈波动") regParts.push({ label: "间隔天数剧烈波动", deduct: 10 });

  const regSum = regParts.reduce((s, p) => s + p.deduct, 0);
  const regDeduct = Math.min(20, regSum);
  if (regDeduct > 0) {
    // If capped, keep the most important signals while matching final deduct.
    let remaining = regDeduct;
    for (const p of regParts.sort((a, b) => b.deduct - a.deduct)) {
      if (remaining <= 0) break;
      const take = Math.min(p.deduct, remaining);
      items.push({ trigger: p.label, deduct: take });
      remaining -= take;
    }
    healthScore -= regDeduct;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    cycleCount: cyclesDesc.length,
    baseScore,
    healthScore,
    totalDeduct: baseScore - healthScore,
    items,
  };
}
