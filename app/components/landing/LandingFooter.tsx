import { Link } from "@remix-run/react";
import { GITHUB_REPO_URL } from "~/constants/app";

export function LandingFooter() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-brand-muted">
            身体不是黑箱。感受不是主观。数据不是冷冰冰的。
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-brand-muted">
            <Link to="/download" className="hover:text-brand-text transition-colors">
              下载 App
            </Link>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-brand-text transition-colors">
              GitHub
            </a>
            <div className="flex items-center gap-1">
              <span>© {new Date().getFullYear()} ·</span>
              <a
                href="https://d1v.ai"
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-text transition-colors"
              >
                Built with d1v.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
