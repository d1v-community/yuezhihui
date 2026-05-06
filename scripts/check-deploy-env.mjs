#!/usr/bin/env node

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.split("=");
    return [key, value];
  }),
);

const target = args.get("--target") || "web";

function fail(message) {
  console.error(`[deploy-check] ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[deploy-check] ${message}`);
}

function ok(message) {
  console.log(`[deploy-check] ${message}`);
}

function ensureNode20Plus() {
  const major = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
  if (major < 20) {
    fail(`Node.js 20+ is required, current=${process.version}`);
  }
}

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`${name} is required for ${target} deployment`);
  }
  return value;
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

function ensureWebDeployEnv() {
  const databaseUrl = readRequired("DATABASE_URL");
  const jwtSecret = readRequired("JWT_SECRET");
  const appUrl = readRequired("APP_URL");

  let parsedDatabaseUrl;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    fail("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
    fail("DATABASE_URL must use postgres:// or postgresql://");
  }
  if (parsedDatabaseUrl.searchParams.get("sslmode") != "require") {
    fail("DATABASE_URL must include sslmode=require");
  }

  if (jwtSecret.length < 32) {
    fail("JWT_SECRET must be at least 32 characters");
  }
  if (
    jwtSecret === "your-secret-key-change-in-production" ||
    jwtSecret === "your-super-secret-jwt-key-change-in-production"
  ) {
    fail("JWT_SECRET is still using the default placeholder value");
  }

  const parsedAppUrl = ensureAbsoluteUrl("APP_URL", appUrl);
  if (
    (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") &&
    parsedAppUrl.protocol !== "https:"
  ) {
    fail("APP_URL must use https:// in production");
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    warn("RESEND_API_KEY is not set; login codes will not be emailed in production");
  }

  ok("web deployment environment looks valid");
}

ensureNode20Plus();

switch (target) {
  case "web":
    ensureWebDeployEnv();
    break;
  default:
    fail(`unsupported target: ${target}`);
}
