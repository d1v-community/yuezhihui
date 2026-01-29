import { ClientOnly } from "./ClientOnly";

export function AppFooter() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
        develop with d1v ❤️{" "}
        <ClientOnly fallback={<>@</>}>
          <>@{new Date().getFullYear()}</>
        </ClientOnly>
      </div>
    </footer>
  );
}
