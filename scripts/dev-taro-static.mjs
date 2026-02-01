import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Dev helper: continuously build Taro H5 into Remix `public/app` on file changes.
//
// Why:
// - Avoid relying on Taro H5 dev server/proxy (can be flaky on some setups).
// - Keep a single entry at Remix port (http://localhost:5173/app).
//
// Notes:
// - Build outputRoot is configured in `apps/app/config/index.ts` to be `../../public/app` for h5.
// - This script intentionally does NOT start a separate web server.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const buildScript = path.join(repoRoot, "scripts", "build-taro-h5.mjs");

// Watch only sources/config; never watch the output directory to avoid rebuild loops.
const watchRoots = [
  path.join(repoRoot, "apps", "app", "src"),
  path.join(repoRoot, "apps", "app", "config"),
  path.join(repoRoot, "apps", "app", "project.config.json"),
  path.join(repoRoot, "apps", "app", "package.json"),
  path.join(repoRoot, "apps", "app", "tsconfig.json"),
];

function isDir(p) {
  try {
    return existsSync(p) && !p.endsWith(".json") && !p.endsWith(".ts") && !p.endsWith(".js");
  } catch {
    return false;
  }
}

let building = false;
let rebuildQueued = false;
let lastBuildExit = null;

function runBuild() {
  if (building) {
    rebuildQueued = true;
    return;
  }

  building = true;
  rebuildQueued = false;
  const startedAt = Date.now();

  // eslint-disable-next-line no-console
  console.log("[taro:static] building H5 -> public/app ...");

  const child = spawn(process.execPath, [buildScript], {
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    lastBuildExit = { code, signal };
    building = false;
    const ms = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(`[taro:static] build finished (code=${code ?? "null"}, signal=${signal ?? "null"}, ${ms}ms)`);

    if (rebuildQueued) {
      runBuild();
    }
  });

  return child;
}

let debounceTimer = null;
function onChange(label) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.log(`[taro:static] change detected (${label})`);
    runBuild();
  }, 180);
}

// Initial build so `/app/index.html` exists.
runBuild();

// fs.watch({recursive:true}) works well on macOS/Windows. Keep implementation minimal.
for (const root of watchRoots) {
  if (!existsSync(root)) continue;
  const recursive = isDir(root);
  try {
    const watcher = watch(root, { recursive }, () => onChange(path.relative(repoRoot, root)));
    watcher.on("error", () => {
      // ignore; user can restart dev if the OS watcher drops
    });
  } catch {
    // ignore; if watching fails, the initial build still makes `/app` usable
  }
}

process.on("SIGINT", () => process.exit(lastBuildExit?.code ?? 0));
process.on("SIGTERM", () => process.exit(lastBuildExit?.code ?? 0));

