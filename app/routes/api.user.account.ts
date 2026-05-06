import type { ActionFunctionArgs } from "@remix-run/node";
import { deleteUserAccount } from "~/services/account.server";
import { requireUser, createLogoutHeaders } from "~/utils/auth.server";
import { fail, ok } from "~/utils/apiResponse.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return Response.json(fail("Method Not Allowed", 405), { status: 405 });
  }

  try {
    const user = await requireUser(request);
    const result = await deleteUserAccount(user.id);

    return Response.json(
      ok(
        {
          deleted: true,
          userId: result.deletedUserId,
        },
        "账号已删除",
      ),
      {
        status: 200,
        headers: createLogoutHeaders(),
      },
    );
  } catch (e: any) {
    if (e instanceof Response || e?.status === 401) {
      return Response.json(fail("登录已过期，请重新登录", 401), { status: 401 });
    }

    const msg = e?.message || "删除账号失败";
    const status = msg.includes("不存在") ? 404 : 500;
    return Response.json(fail(msg, status), { status });
  }
}
