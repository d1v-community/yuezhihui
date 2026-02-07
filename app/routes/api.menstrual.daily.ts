import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "~/db/db.server";
import { menstrualDaily } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date 格式应为 YYYY-MM-DD");

const querySchema = z.object({
  start: dateSchema,
  end: dateSchema,
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);

    const url = new URL(request.url);
    const start = url.searchParams.get("start") ?? "";
    const end = url.searchParams.get("end") ?? "";
    const q = querySchema.parse({ start, end });
    if (q.start > q.end) {
      return Response.json(fail("start 不能大于 end", 400), { status: 400 });
    }

    const rows = await db
      .select({
        recordDate: menstrualDaily.recordDate,
        hasBleeding: menstrualDaily.hasBleeding,
        totalVolumeMl: menstrualDaily.totalVolumeMl,
        dayColor: menstrualDaily.dayColor,
      })
      .from(menstrualDaily)
      .where(
        and(
          eq(menstrualDaily.userId, user.id),
          gte(menstrualDaily.recordDate, q.start as any),
          lte(menstrualDaily.recordDate, q.end as any),
        ),
      )
      .orderBy(asc(menstrualDaily.recordDate));

    return Response.json(
      ok(
        rows.map((r) => ({
          date: String(r.recordDate),
          hasBleeding: Boolean(r.hasBleeding),
          totalVolumeMl: Number(r.totalVolumeMl ?? 0),
          dayColor: (r.dayColor as any) ?? null,
        })),
      ),
      { status: 200 },
    );
  } catch (e: any) {
    if (e instanceof Response) {
      if (e.status === 401) {
        return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
      }
      return e;
    }
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取每日记录区间数据失败";
    return Response.json(fail(msg, 500), { status: 500 });
  }
}
