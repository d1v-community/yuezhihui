#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const androidDir = path.join(repoRoot, "apps", "flutter_app", "android");
const keystoreFile = path.join(androidDir, "upload-keystore.jks");
const keyPropertiesFile = path.join(androidDir, "key.properties");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const writeSigning = args.has("--write-signing");

function fail(message) {
  console.error(`[flutter-release] ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[flutter-release] ${message}`);
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, {
      encoding: "utf8",
      flag: "a",
    });
  } else {
    console.log(`${name}=${value}`);
  }
}

function ensureAbsoluteUrl(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${name} must be an absolute URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    fail(`${name} must start with http:// or https://`);
  }
  return parsed;
}

const versionName = process.env.FLUTTER_VERSION_NAME || new Date().toISOString().slice(0, 10).replaceAll("-", ".");
const buildNumber = process.env.FLUTTER_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || "1";
const apiBaseUrl = process.env.FLUTTER_API_BASE_URL || "https://www.yuezhihui.xyz";
const parsedApiBaseUrl = ensureAbsoluteUrl("FLUTTER_API_BASE_URL", apiBaseUrl);

const signingEnv = {
  keystoreBase64: process.env.ANDROID_KEYSTORE_BASE64 || "",
  storePassword: process.env.ANDROID_KEYSTORE_PASSWORD || "",
  keyAlias: process.env.ANDROID_KEY_ALIAS || "",
  keyPassword: process.env.ANDROID_KEY_PASSWORD || "",
};

const hasAnySigningValue = Object.values(signingEnv).some((value) => value.trim() !== "");
const hasAllSigningValues = Object.values(signingEnv).every((value) => value.trim() !== "");

if (hasAnySigningValue && !hasAllSigningValues) {
  fail(
    "ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, and ANDROID_KEY_PASSWORD must be set together",
  );
}

if (hasAllSigningValues && writeSigning && !dryRun) {
  mkdirSync(androidDir, { recursive: true });
  writeFileSync(keystoreFile, Buffer.from(signingEnv.keystoreBase64, "base64"));
  writeFileSync(
    keyPropertiesFile,
    [
      `storeFile=${path.basename(keystoreFile)}`,
      `storePassword=${signingEnv.storePassword}`,
      `keyAlias=${signingEnv.keyAlias}`,
      `keyPassword=${signingEnv.keyPassword}`,
      "",
    ].join("\n"),
    "utf8",
  );
} else if (hasAllSigningValues && dryRun) {
  warn("signing secrets look complete; dry-run skipped writing keystore files");
} else {
  warn("release signing secrets are not configured; workflow will fall back to debug signing");
}

setOutput("version_name", versionName);
setOutput("build_number", buildNumber);
setOutput("tag_name", `android-v${versionName}+${buildNumber}`);
setOutput("apk_name", `flowcycle-android-${versionName}+${buildNumber}-release.apk`);
setOutput("api_base_url", parsedApiBaseUrl.toString().replace(/\/$/, ""));
setOutput("signing_mode", hasAllSigningValues ? "release" : "debug");
