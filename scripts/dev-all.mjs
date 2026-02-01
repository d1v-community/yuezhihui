import { spawn } from "node:child_process";

// Start Remix (API + landing) and Taro frontend in parallel with proper signal handling.
//
// Usage:
//   pnpm run dev:all            # Remix + Taro H5
//   TARO_TARGET=weapp pnpm run dev:all
//
// Notes:
// - In H5 mode, we build Taro into `public/app` (configured in apps/app/config/index.ts)
//   and let Remix serve it at `/app/*` without a separate dev server.
// - For weapp dev, open `apps/app` in WeChat DevTools after starting the watcher.

const taroTarget = process.env.TARO_TARGET || "h5";
const taroScript = taroTarget === "weapp" ? "dev:weapp" : null;

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true, // use user's shell resolution for pnpm/npm on different OSes
    ...opts,
  });
  return child;
}

const remix = run("pnpm", ["run", "dev:remix"]);

let taro = null;
let taroRestartDelayMs = 800;
function startTaro() {
  if (taroTarget === "weapp") {
    taro = run("pnpm", ["-C", "apps/app", "run", taroScript]);
  } else {
    // H5: build to `public/app` on file changes (no separate server).
    taro = run("node", ["scripts/dev-taro-static.mjs"]);
  }
  taro.on("exit", (code, signal) => {
    // Keep Remix running even if Taro fails; auto-restart Taro so `/app` becomes available once it compiles.
    // eslint-disable-next-line no-console
    console.log(`[dev:all] taro:${taroTarget} exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    if (shuttingDown) return;
    const delay = taroRestartDelayMs;
    taroRestartDelayMs = Math.min(10_000, Math.floor(taroRestartDelayMs * 1.35));
    // eslint-disable-next-line no-console
    console.log(`[dev:all] restarting taro:${taroTarget} in ${delay}ms...`);
    setTimeout(() => {
      if (shuttingDown) return;
      startTaro();
    }, delay);
  });
}

startTaro();

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  // Forward signal to both processes.
  try {
    remix.kill(signal);
  } catch {}
  try {
    taro?.kill?.(signal);
  } catch {}
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function exitFrom(child, name) {
  child.on("exit", (code, signal) => {
    // If one process exits, stop the other to avoid orphaned watch processes.
    shutdown(signal || "SIGTERM");
    const exitCode = typeof code === "number" ? code : 1;
    // eslint-disable-next-line no-console
    console.log(`[dev:all] ${name} exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    process.exit(exitCode);
  });
}

exitFrom(remix, "remix");
