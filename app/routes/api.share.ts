import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";
import { createShareForUser } from "~/services/share.server";

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("period"),
    cycleId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("overview"),
    limit: z.number().int().min(1).max(20).optional(),
  }),
]);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(fail("Method Not Allowed", 405), { status: 405 });
  }

  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json());
    const data = await createShareForUser(user.id, body as any);
    return Response.json(ok(data), { status: 200 });
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "创建分享失败";
    const status = msg.includes("min") || msg.includes("max") ? 400 : msg.includes("周期不存在") ? 404 : 500;
    return Response.json(fail(msg, status), { status });
  }
}
