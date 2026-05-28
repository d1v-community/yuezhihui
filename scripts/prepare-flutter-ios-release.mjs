#!/usr/bin/env node

import { writeFileSync } from "node:fs";

function fail(message) {
  console.error(`[flutter-ios-release] ${message}`);
  process.exit(1);
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

const versionName =
  process.env.FLUTTER_VERSION_NAME ||
  new Date().toISOString().slice(0, 10).replaceAll("-", ".");
const buildNumber =
  process.env.FLUTTER_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || "1";
const apiBaseUrl = process.env.FLUTTER_API_BASE_URL || "https://www.yuezhihui.xyz";
const parsedApiBaseUrl = ensureAbsoluteUrl("FLUTTER_API_BASE_URL", apiBaseUrl);

setOutput("version_name", versionName);
setOutput("build_number", buildNumber);
setOutput("tag_name", `ios-v${versionName}+${buildNumber}`);
setOutput("app_name", `flowcycle-ios-${versionName}+${buildNumber}-Runner.app`);
setOutput("archive_name", `flowcycle-ios-${versionName}+${buildNumber}-Runner.app.zip`);
setOutput("api_base_url", parsedApiBaseUrl.toString().replace(/\/$/, ""));
