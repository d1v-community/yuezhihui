import { Link, NavLink } from "@remix-run/react";
import type { AppHeaderUser } from "~/components/AppHeader";
import { APP_TITLE } from "~/constants/app";

interface WikiHeaderProps {
  user: AppHeaderUser;
  onLogout: () => void;
}

export function WikiHeader({ user, onLogout }: WikiHeaderProps) {
  const displayName = user?.displayName || user?.username || user?.email;

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold tracking-tight text-brand-text hover:text-black">
            {APP_TITLE}
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-brand-muted">
            <NavLink
              to="/wiki"
              className={({ isActive }) => isActive ? "text-brand-text" : "hover:text-brand-text transition-colors"}
              end
            >
              百科
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) => isActive ? "text-brand-text" : "hover:text-brand-text transition-colors"}
            >
              问答
            </NavLink>
            <Link to="/" className="hover:text-brand-text transition-colors">
              首页
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/app"
              reloadDocument
              className="rounded-full bg-brand-text px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition"
            >
              进入应用
            </Link>

            {user ? (
              <div className="relative group">
                <span className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-brand-text hover:bg-brand-primary/35 transition cursor-pointer">
                  {displayName}
                </span>
                <div className="absolute right-0 mt-2 hidden group-hover:block z-50">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-brand-text shadow-sm hover:bg-brand-primary/35 transition"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-primary/35 transition"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
