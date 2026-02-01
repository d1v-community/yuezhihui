import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";
import { fetchOverviewForUser } from "~/services/analysis.server";

const querySchema = z.object({
  limit: z.preprocess((v) => (typeof v === "string" && v ? Number(v) : 6), z.number().int().min(1).max(20)),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const q = querySchema.parse({ limit: url.searchParams.get("limit") });

    const data = await fetchOverviewForUser(user.id, q.limit);
    return Response.json(ok(data), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取总览分析失败";
    return Response.json(fail(msg, 500), { status: 500 });
  }
}

