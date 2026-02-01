import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { fail, ok } from "~/utils/apiResponse.server";
import { getShareByCode } from "~/services/share.server";

const paramsSchema = z.object({ code: z.string().length(32) });

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const p = paramsSchema.parse({ code: params.code });
    const data = await getShareByCode(p.code);
    return Response.json(ok(data), { status: 200 });
  } catch (e: any) {
    const msg = e?.message || "获取分享失败";
    const status = msg.includes("length") ? 400 : msg.includes("不存在") || msg.includes("过期") ? 404 : 500;
    return Response.json(fail(msg, status), { status });
  }
}
