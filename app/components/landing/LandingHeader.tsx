import { Link } from "@remix-run/react";
import type { AppHeaderUser } from "~/components/AppHeader";
import { APP_TITLE } from "~/constants/app";

interface LandingHeaderProps {
  user: AppHeaderUser;
  onLogout: () => void;
}

export function LandingHeader({ user, onLogout }: LandingHeaderProps) {
  const displayName = user?.displayName || user?.username || user?.email;

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold tracking-tight text-brand-text hover:text-black">
            {APP_TITLE}
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-brand-muted">
            <Link to="/wiki" className="hover:text-brand-text transition-colors">
              百科
            </Link>
            <a href="#problem" className="hover:text-brand-text transition-colors">
              痛点
            </a>
            <a href="#demo" className="hover:text-brand-text transition-colors">
              Demo
            </a>
            <a href="#philosophy" className="hover:text-brand-text transition-colors">
              理念
            </a>
            <a href="#privacy" className="hover:text-brand-text transition-colors">
              隐私
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="rounded-full bg-brand-text px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition"
            >
              进入应用
            </Link>

            {user ? (
              <div className="relative group">
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-brand-text hover:bg-brand-primary/35 transition"
                >
                  {displayName}
                </button>
                <div className="absolute right-0 mt-2 hidden group-hover:block">
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
