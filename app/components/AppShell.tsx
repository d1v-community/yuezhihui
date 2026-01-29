import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { AppFooter } from "~/components/AppFooter";
import { AppHeader, type AppHeaderUser } from "~/components/AppHeader";

interface AppShellProps {
  user: AppHeaderUser;
  envWarning: string | null;
  children: React.ReactNode;
}

export function AppShell({ user, envWarning, children }: AppShellProps) {
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
      navigate("/login", { replace: true });
    }
  };

  const effectiveUser = clientUser ?? user;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {envWarning ? (
        <div className="w-full bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-2 px-4 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
          {envWarning}
        </div>
      ) : null}

      <AppHeader user={effectiveUser} onLogout={handleLogout} />

      <main className="flex-1 min-h-0">{children}</main>

      <AppFooter />
    </div>
  );
}

