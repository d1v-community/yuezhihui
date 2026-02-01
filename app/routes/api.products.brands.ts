import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { productBrands } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

const querySchema = z.object({
  type: z.enum(["pad", "tampon"]),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = querySchema.parse({ type: url.searchParams.get("type") ?? "" });

    const rows = await db
      .select({
        id: productBrands.id,
        type: productBrands.type,
        name: productBrands.name,
        sort: productBrands.sort,
      })
      .from(productBrands)
      .where(eq(productBrands.type, q.type))
      .orderBy(asc(productBrands.sort), asc(productBrands.id));

    return Response.json(
      ok(
        rows.map((r) => ({
          id: Number(r.id),
          type: r.type as any,
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
    const msg = e?.message || "获取品牌列表失败";
    const status = msg.includes("Invalid") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}

