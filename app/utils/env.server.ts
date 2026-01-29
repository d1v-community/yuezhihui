import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url().default("http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),
  RESEND_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().default("your-secret-key-change-in-production"),
});

const parsed = envSchema.safeParse(process.env);

// Do not throw here. If env vars are misconfigured we log an error and
// let route loaders decide how to surface a friendly message.
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
}

export const env = {
  NODE_ENV: parsed.success
    ? parsed.data.NODE_ENV
    : (process.env.NODE_ENV as string) ?? "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  APP_URL: parsed.success
    ? parsed.data.APP_URL
    : process.env.APP_URL ?? "http://localhost:5173",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  RESEND_API_KEY: parsed.success
    ? parsed.data.RESEND_API_KEY
    : process.env.RESEND_API_KEY,
  JWT_SECRET: parsed.success
    ? parsed.data.JWT_SECRET
    : (process.env.JWT_SECRET ?? "your-secret-key-change-in-production"),
};

export const isProd = env.NODE_ENV === "production";

// Returns a human-readable warning for missing/invalid env vars so
// the UI can show a banner instead of crashing the function.
export function getEnvWarningMessage(): string | null {
  if (parsed.success) return null;

  const vars = parsed.error.issues
    .map((issue) => issue.path[0])
    .filter(Boolean) as string[];

  if (vars.length === 0) {
    return "Environment variables are invalid. Please verify your deployment configuration.";
  }

  const unique = Array.from(new Set(vars));

  return `⚠️ Missing or invalid environment variables: ${unique.join(
    ", ",
  )}. Please configure them in your deployment platform (for example, D1V Project > Chat > Env Settings Icon -> Sync or Import).`;
}
