export function LandingFooter() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-brand-muted">
            身体不是黑箱。感受不是主观。数据不是冷冰冰的。
          </div>
          <div className="text-sm text-brand-muted">
            © {new Date().getFullYear()} · Built with Remix
          </div>
        </div>
      </div>
    </footer>
  );
}

