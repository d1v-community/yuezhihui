import { and, eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { menstrualCycle, shareRecord, users } from "~/db/schema";
import { fetchCycleDetailForUser, fetchOverviewForUser, rebuildUserCycles } from "~/services/analysis.server";

export type ShareCreateResp = {
  shareCode: string;
  expireAt: string;
  path: string;
};

export type ShareGetResp = {
  shareCode: string;
  type: "period" | "overview";
  createdAt: string;
  expireAt: string | null;
  owner: {
    nickname: string | null;
    avatarUrl: string | null;
  };
  data: unknown;
};

function nowPlusDays(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function parseMaybeJson(v: unknown): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function formatIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const s = String(v ?? "");
  if (!s) return new Date(0).toISOString();
  if (s.includes("T")) {
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
    return `${s}Z`;
  }
  if (s.includes(" ")) return `${s.replace(" ", "T")}Z`;
  return `${s}Z`;
}

export async function createShareForUser(
  userId: string,
  body: { type: "period"; cycleId: number } | { type: "overview"; limit?: number },
): Promise<ShareCreateResp> {
  if (body.type === "period") {
    await rebuildUserCycles(userId);
    const hit = await db
      .select({ id: menstrualCycle.id })
      .from(menstrualCycle)
      .where(and(eq(menstrualCycle.userId, userId), eq(menstrualCycle.id, body.cycleId)))
      .limit(1);
    if (hit.length === 0) {
      throw new Error("周期不存在");
    }
  }

  const shareCode = crypto.randomUUID().replaceAll("-", "");
  const expireAt = nowPlusDays(30);
  const params = body.type === "period" ? { cycleId: body.cycleId } : { limit: body.limit ?? 6 };

  await db.insert(shareRecord).values({
    ownerUserId: userId,
    shareCode,
    shareType: body.type,
    paramsJson: params as any,
    expireAt,
  } as any);

  return {
    shareCode,
    expireAt: expireAt.toISOString(),
    path: `/share/${encodeURIComponent(shareCode)}`,
  };
}

export async function getShareByCode(shareCode: string): Promise<ShareGetResp> {
  const rows = await db
    .select({
      ownerUserId: shareRecord.ownerUserId,
      shareCode: shareRecord.shareCode,
      shareType: shareRecord.shareType,
      paramsJson: shareRecord.paramsJson,
      expireAt: shareRecord.expireAt,
      createdAt: shareRecord.createdAt,
    })
    .from(shareRecord)
    .where(eq(shareRecord.shareCode, shareCode))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("分享不存在");
  }

  const share = rows[0];
  const expireAtIso = share.expireAt ? formatIso(share.expireAt) : null;
  if (expireAtIso) {
    const ts = Date.parse(expireAtIso);
    if (Number.isFinite(ts) && Date.now() > ts) {
      throw new Error("分享已过期");
    }
  }

  const paramsObj = parseMaybeJson(share.paramsJson);
  let data: unknown;
  if (share.shareType === "period") {
    const cycleId = Number((paramsObj as any)?.cycleId);
    if (!Number.isFinite(cycleId) || cycleId <= 0) throw new Error("分享参数非法");
    data = await fetchCycleDetailForUser(String(share.ownerUserId), Math.floor(cycleId));
  } else {
    const limit = Number((paramsObj as any)?.limit ?? 6);
    const lim = Number.isFinite(limit) ? Math.max(1, Math.min(20, Math.floor(limit))) : 6;
    data = await fetchOverviewForUser(String(share.ownerUserId), lim);
  }

  const ownerRows = await db
    .select({ username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, String(share.ownerUserId)))
    .limit(1);
  const owner = ownerRows[0] ?? { username: null, displayName: null, avatarUrl: null };

  return {
    shareCode: String(share.shareCode),
    type: share.shareType as "period" | "overview",
    createdAt: formatIso(share.createdAt),
    expireAt: expireAtIso,
    owner: {
      nickname: owner.displayName ?? owner.username ?? null,
      avatarUrl: owner.avatarUrl ?? null,
    },
    data,
  };
}

