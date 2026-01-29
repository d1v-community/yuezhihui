import { spawn } from "node:child_process";

// Start Remix (API + landing) and Taro frontend in parallel with proper signal handling.
//
// Usage:
//   pnpm run dev:all            # Remix + Taro H5
//   TARO_TARGET=weapp pnpm run dev:all
//
// Notes:
// - Taro H5 dev writes to `public/app` (configured in apps/app/config/index.ts).
// - For weapp dev, open `apps/app` in WeChat DevTools after starting the watcher.

const taroTarget = process.env.TARO_TARGET || "h5";
const taroScript = taroTarget === "weapp" ? "dev:weapp" : "dev:h5";

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true, // use user's shell resolution for pnpm/npm on different OSes
    ...opts,
  });
  return child;
}

const remix = run("pnpm", ["run", "dev"]);
const taro = run("pnpm", ["-C", "apps/app", "run", taroScript]);

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  // Forward signal to both processes.
  try {
    remix.kill(signal);
  } catch {}
  try {
    taro.kill(signal);
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
exitFrom(taro, `taro:${taroTarget}`);

