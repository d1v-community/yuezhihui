import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/db/db.server";
import { users } from "~/db/schema";
import { requireUser } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

export const openApi = {
  actionMethods: ["patch"],
};

const schema = z.object({
  displayName: z.string().trim().min(1).max(64).optional(),
  avatarUrl: z.string().trim().url().max(2048).optional(),
  useTampon: z.boolean().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "PATCH") {
    return Response.json(fail("Method Not Allowed", 405), { status: 405 });
  }

  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    if (body.displayName === undefined && body.avatarUrl === undefined && body.useTampon === undefined) {
      return Response.json(fail("至少提供一个字段", 400), { status: 400 });
    }

    await db
      .update(users)
      .set({
        ...(body.displayName ? { displayName: body.displayName } : {}),
        ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.useTampon !== undefined ? { useTampon: body.useTampon } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return Response.json(ok({ ok: true }), { status: 200 });
  } catch (e: any) {
    if (e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }
    const msg = e?.message || "更新资料失败";
    const status = msg.includes("url") || msg.includes("至少提供") ? 400 : 500;
    return Response.json(fail(msg, status), { status });
  }
}
