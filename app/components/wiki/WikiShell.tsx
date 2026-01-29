import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import type { AppHeaderUser } from "~/components/AppHeader";
import { LandingFooter } from "~/components/landing/LandingFooter";
import { WikiHeader } from "~/components/wiki/WikiHeader";

interface WikiShellProps {
  user: AppHeaderUser;
  envWarning: string | null;
  children: React.ReactNode;
}

export function WikiShell({ user, envWarning, children }: WikiShellProps) {
  const navigate = useNavigate();
  const [clientUser, setClientUser] = useState<AppHeaderUser>(user);

  useEffect(() => {
    // Ensure client reflects latest auth state (token/cookie changes)
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.authenticated) setClientUser(d.user);
        else setClientUser(null);
      })
      .catch(() => {
        // noop: 静默处理网络错误
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem("auth-token");
      } catch {
        // noop: 静默处理清理 token 失败
      }
      navigate("/", { replace: true });
    }
  };

  const effectiveUser = clientUser ?? user;

  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-text">
      {envWarning ? (
        <div className="w-full bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-2 px-4">
          {envWarning}
        </div>
      ) : null}

      <WikiHeader user={effectiveUser} onLogout={handleLogout} />

      <main className="flex-1 min-h-0">{children}</main>

      <LandingFooter />
    </div>
  );
}

