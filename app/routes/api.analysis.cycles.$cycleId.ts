import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";
import { fetchCycleDetailForUser } from "~/services/analysis.server";

const paramsSchema = z.object({
  cycleId: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().int().positive()),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const p = paramsSchema.parse({ cycleId: params.cycleId });

    const data = await fetchCycleDetailForUser(user.id, p.cycleId);
    return Response.json(ok(data), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取周期详情失败";
    const status = msg.includes("不存在") ? 404 : 500;
    return Response.json(fail(msg, status), { status });
  }
}

