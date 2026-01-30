import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { db } from "~/db/db.server";
import { feedback } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

const schema = z.object({
  typeIndex: z.number().int().min(0).max(10),
  content: z.string().trim().min(5).max(2000),
  contact: z.string().trim().max(200).optional(),
  images: z.array(z.string().max(2000)).max(6).optional(),
  meta: z.record(z.any()).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(fail("Method Not Allowed", 405), { status: 405 });
  }

  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const id = crypto.randomUUID();
    await db.insert(feedback).values({
      id,
      userId: user.id,
      typeIndex: body.typeIndex,
      content: body.content,
      contact: body.contact ?? null,
      images: body.images ?? null,
      meta: body.meta ?? null,
    } as any);

    return Response.json(ok({ id }), { status: 200 });
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "提交反馈失败";
    const status = msg.includes("min") || msg.includes("max") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}

