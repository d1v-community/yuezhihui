import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Build Taro H5 in a CI-friendly way:
// - Force HOME/XDG_CACHE_HOME into the repo so the build won't try to write to ~/.taro4.0
// - Output is already configured to emit into `public/app` (see apps/app/config/index.ts)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const taroHome = path.join(repoRoot, ".taro-home");
mkdirSync(taroHome, { recursive: true });

const child = spawn("pnpm", ["-C", "apps/app", "run", "build:h5"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    HOME: taroHome,
    XDG_CACHE_HOME: path.join(taroHome, ".cache"),
  },
});

child.on("exit", (code) => {
  process.exit(typeof code === "number" ? code : 1);
});

