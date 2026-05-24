import { useEffect, useRef, useState } from "react";
import { ThemeToggleButton } from "~/components/ThemeToggleButton";
import { ClientOnly } from "~/components/ClientOnly";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import appLogoUrl from "~/assets/branding/app_logo_master.png";
import { getUserFromRequest } from "~/utils/auth.server";

const APP_H5_PATH = "/app";
const CODE_PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);
  if (user) {
    return redirect(APP_H5_PATH);
  }
  return null;
}

export default function Login() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const codeSectionRef = useRef<HTMLDivElement | null>(null);

  // Client-side guard: if token exists and is valid, redirect
  useEffect(() => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d?.authenticated) {
            window.location.assign(APP_H5_PATH);
          }
        })
        .catch(() => {
          // noop: 静默处理网络错误
        });
    } catch {
      // noop: 静默处理初始化错误
    }
  }, []);

  useEffect(() => {
    if (step !== "code") return;
    codeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "发送验证码失败");
      }

      // Show development code or success info
      if (data.dev && data.code) {
        setDevCode(String(data.code));
        setInfo("开发模式下，验证码已展示在下方。");
      } else {
        setDevCode(null);
        setInfo("验证码已发送，请检查你的邮箱。");
      }

      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitVerifyCode();
  };

  const submitVerifyCode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "验证码无效");
      }

      localStorage.setItem("auth-token", data.token);

      // Attempt to request Storage Access for third-party iframes (Safari/Chrome SAA)
      try {
        if (typeof document.hasStorageAccess === "function") {
          const hasAccess = await document.hasStorageAccess();
          if (!hasAccess && typeof document.requestStorageAccess === "function") {
            await document.requestStorageAccess();
          }
        }
      } catch {
        // ignore SAA failures
      }

      // Sync server cookie from Authorization if cookies were previously blocked
      try {
        await fetch("/api/auth/sync-cookie", { method: "POST" });
      } catch {
        // noop: 静默处理同步 cookie 失败
      }

      window.location.assign(APP_H5_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setError("");
    setInfo("");
    setDevCode(null);
  };

  const handleBack = () => {
    window.history.back();
  };

  const appendCodeDigit = (digit: string) => {
    if (loading) return;
    setCode((prev) => `${prev.replace(/\D/g, "").slice(0, 6)}${digit}`.slice(0, 6));
  };

  const deleteCodeDigit = () => {
    if (loading) return;
    setCode((prev) => prev.replace(/\D/g, "").slice(0, -1));
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-start sm:items-center justify-center p-4 sm:py-8 relative">
      <ThemeToggleButton className="absolute top-4 right-4" />
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100 transition"
        aria-label="Go back to previous page"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </button>
      <div className="max-w-md sm:max-w-lg w-full">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/30 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="mb-6 text-left sm:text-center">
            <img
              src={appLogoUrl}
              alt="月知会 logo"
              className="mb-4 h-20 w-20 rounded-[1.5rem] shadow-xl shadow-slate-900/10 sm:mx-auto"
            />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-slate-50">月知会</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">使用邮箱验证码登录，继续你的记录与分析。</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium tracking-[0.08em] uppercase text-gray-700 dark:text-slate-200 mb-2">
                  邮箱地址
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 dark:bg-sky-500 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-sky-600 focus:ring-4 focus:ring-blue-200 dark:focus:ring-sky-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  验证码已发送至
                </p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{email}</p>
              </div>

              {info && (
                <div className="bg-blue-50 dark:bg-sky-950/40 border border-blue-200 dark:border-sky-900 text-blue-700 dark:text-sky-300 px-4 py-3 rounded-lg">
                  {info}
                </div>
              )}

              {devCode && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-200 px-4 py-3 rounded-lg">
                  <p className="mb-1 font-medium">开发模式</p>
                  <p>
                    当前验证码：<span className="font-mono font-semibold">{devCode}</span>
                  </p>
                </div>
              )}

              <div ref={codeSectionRef}>
                <label htmlFor="code" className="block text-xs font-medium tracking-[0.08em] uppercase text-gray-700 dark:text-slate-200 mb-2">
                  验证码
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl font-mono tracking-widest"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                  可直接使用系统键盘输入，或点击下方数字键盘。
                </p>
                <p className="mt-4 mb-2 text-xs font-medium tracking-[0.08em] uppercase text-gray-700 dark:text-slate-300">
                  数字键盘
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {CODE_PAD_KEYS.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      disabled={loading}
                      onClick={() => appendCodeDigit(digit)}
                      className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-3 text-lg font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={loading || code.length === 0}
                    onClick={deleteCodeDigit}
                    className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => appendCodeDigit("0")}
                    className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-3 text-lg font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={loading || code.length !== 6}
                    onClick={() => void submitVerifyCode()}
                    className="rounded-lg border border-blue-600 dark:border-sky-500 bg-blue-600 dark:bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-blue-700 dark:hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="w-full sm:flex-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-100 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                >
                  返回
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-blue-600 dark:bg-sky-500 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-sky-600 focus:ring-4 focus:ring-blue-200 dark:focus:ring-sky-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "验证中..." : "验证并登录"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                className="w-full text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium transition"
              >
                没收到验证码？重新发送
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
            <p>安全邮箱验证登录</p>
          </div>
        </div>
      </div>
    </div>
    </ClientOnly>
  );
}
