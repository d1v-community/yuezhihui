import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";
import { fetchCycleListForUser } from "~/services/analysis.server";

const querySchema = z.object({
  page: z.preprocess((v) => (typeof v === "string" && v ? Number(v) : 1), z.number().int().min(1)),
  pageSize: z.preprocess((v) => (typeof v === "string" && v ? Number(v) : 10), z.number().int().min(1).max(50)),
});

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const q = querySchema.parse({
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
    });

    const data = await fetchCycleListForUser(user.id, q.page, q.pageSize);
    return Response.json(ok(data), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "获取周期列表失败";
    return Response.json(fail(msg, 500), { status: 500 });
  }
}

