import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
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
  const exitCode = typeof code === "number" ? code : 1;
  if (exitCode === 0) {
    // Write a tiny build marker into the output dir so we can verify
    // Vercel really rebuilt and deployed the latest Taro bundle.
    const outDir = path.join(repoRoot, "public", "app");
    const meta = {
      builtAt: new Date().toISOString(),
      vercel: {
        env: process.env.VERCEL_ENV || null,
        url: process.env.VERCEL_URL || null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
    };
    try {
      writeFileSync(path.join(outDir, "build-meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
    } catch {
      // Ignore marker write failures; don't break CI.
    }
  }
  process.exit(exitCode);
});
