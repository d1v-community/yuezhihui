import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { AppShell } from "~/components/AppShell";
import { APP_TITLE } from "~/constants/app";
import { getUserFromRequest } from "~/utils/auth.server";
import { getEnvWarningMessage } from "~/utils/env.server";

export const meta: MetaFunction = () => {
  return [
    { title: `账号设置 · ${APP_TITLE}` },
    { name: "description", content: "管理登录信息、查看账号状态，并在应用内删除账号与相关数据。" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    const url = new URL(request.url);
    return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  return json({
    envWarning: getEnvWarningMessage(),
    user: {
      displayName: user.displayName,
      email: user.email,
      username: user.username,
    },
  });
}

export default function AccountPage() {
  const { user, envWarning } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem("auth-token");
      } catch {
        // noop
      }
      navigate("/", { replace: true });
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('请输入 "DELETE" 以确认删除账号。');
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "删除账号失败");
      }

      try {
        localStorage.removeItem("auth-token");
      } catch {
        // noop
      }

      navigate("/?accountDeleted=1", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除账号失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell user={user} envWarning={envWarning}>
      <div className="min-h-full bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_18px_60px_rgba(43,43,43,0.06)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Account</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-text">账号设置</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
              你可以在这里查看当前登录身份、退出登录，或按苹果审核要求直接删除账号与相关个人数据。
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-black/5 bg-[#fff8f3] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Display Name</div>
                <div className="mt-2 text-lg font-semibold text-brand-text">{user.displayName || "未设置"}</div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#fffdfa] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Email</div>
                <div className="mt-2 text-lg font-semibold text-brand-text">{user.email}</div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#fffdfa] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Username</div>
                <div className="mt-2 text-lg font-semibold text-brand-text">{user.username || "未设置"}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-brand-text transition hover:bg-brand-primary/35"
              >
                退出登录
              </button>
              <button
                type="button"
                onClick={() => navigate("/app")}
                className="inline-flex items-center justify-center rounded-full bg-brand-text px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
              >
                返回应用
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#d98a92]/30 bg-[linear-gradient(180deg,#fff5f4_0%,#fff0ef_100%)] p-7 shadow-[0_18px_60px_rgba(127,39,68,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d98a92]/30 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#8f3d4f]">
              Dangerous Action
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-brand-text">删除账号</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              删除后将清除当前账号及其关联数据，并立即使当前登录状态失效。该操作不可撤销。
            </p>

            <div className="mt-6 rounded-[1.6rem] border border-[#d98a92]/25 bg-white/85 p-5">
              <div className="text-sm font-semibold text-brand-text">将被删除的数据</div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b94a62]" aria-hidden />
                  <span>账号资料与登录凭证</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b94a62]" aria-hidden />
                  <span>经期记录、分析结果、分享数据等用户关联内容</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b94a62]" aria-hidden />
                  <span>该邮箱对应的验证码记录</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <label htmlFor="delete-confirm" className="block text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
                输入 DELETE 确认
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value.trim())}
                placeholder="DELETE"
                className="mt-2 w-full rounded-2xl border border-[#d98a92]/35 bg-white px-4 py-3 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-[#b94a62] focus:ring-2 focus:ring-[#b94a62]/15"
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#8f2439] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#761d30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "正在删除账号..." : "永久删除账号"}
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
