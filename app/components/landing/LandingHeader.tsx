import { Link } from "@remix-run/react";
import type { AppHeaderUser } from "~/components/AppHeader";
import { APP_TITLE } from "~/constants/app";

interface LandingHeaderProps {
  user: AppHeaderUser;
  onLogout: () => void;
}

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, hash: string) {
  e.preventDefault();
  const element = document.querySelector(hash);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update URL without triggering scroll
    history.pushState(null, '', hash);
  }
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

          <nav className="hidden md:flex items-center gap-1 text-sm text-brand-muted">
            <Link
              to="/wiki"
              className="px-3 py-2 -mx-1 hover:text-brand-text transition-colors active:opacity-70"
            >
              百科
            </Link>
            <a
              href="#problem"
              onClick={(e) => scrollToSection(e, '#problem')}
              className="px-3 py-2 -mx-1 hover:text-brand-text transition-colors active:opacity-70 cursor-pointer"
            >
              痛点
            </a>
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, '#demo')}
              className="px-3 py-2 -mx-1 hover:text-brand-text transition-colors active:opacity-70 cursor-pointer"
            >
              Demo
            </a>
            <a
              href="#philosophy"
              onClick={(e) => scrollToSection(e, '#philosophy')}
              className="px-3 py-2 -mx-1 hover:text-brand-text transition-colors active:opacity-70 cursor-pointer"
            >
              理念
            </a>
            <a
              href="#privacy"
              onClick={(e) => scrollToSection(e, '#privacy')}
              className="px-3 py-2 -mx-1 hover:text-brand-text transition-colors active:opacity-70 cursor-pointer"
            >
              隐私
            </a>
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
