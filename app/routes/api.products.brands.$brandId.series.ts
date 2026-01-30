import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { productSeries } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

const paramsSchema = z.object({
  brandId: z.string().regex(/^\d+$/, "brandId 非法"),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    await requireUser(request);
    const { brandId } = paramsSchema.parse(params);
    const id = Number(brandId);

    const rows = await db
      .select({
        id: productSeries.id,
        brandId: productSeries.brandId,
        name: productSeries.name,
        sort: productSeries.sort,
      })
      .from(productSeries)
      .where(eq(productSeries.brandId, id))
      .orderBy(asc(productSeries.sort), asc(productSeries.id));

    return Response.json(
      ok(
        rows.map((r) => ({
          id: Number(r.id),
          brandId: Number(r.brandId),
          name: r.name,
          sort: Number(r.sort ?? 0),
        })),
      ),
      { status: 200 },
    );
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取系列列表失败";
    const status = msg.includes("brandId") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}

