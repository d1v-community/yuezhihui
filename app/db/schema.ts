import { pgTable, text, timestamp, index, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

// Email verification codes
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    purpose: text("purpose").notNull().default("login"),
    expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
    used: text("used").notNull().default("false"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("verification_codes_email_idx").on(table.email),
    emailPurposeIdx: index("verification_codes_email_purpose_idx").on(table.email, table.purpose),
  })
);

// Onboarding sessions (V2)
export const onboardingSessions = pgTable(
  "onboarding_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: text("version").notNull().default("v2"),
    status: text("status").notNull().default("in_progress"),
    currentQuestionId: text("current_question_id"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: false }),
  },
  (table) => ({
    userIdIdx: index("onboarding_sessions_user_id_idx").on(table.userId),
    // Mirrors the partial unique index in SQL migration.
    // Note: Drizzle doesn't enforce the `WHERE status = 'in_progress'` part at the type level.
    userVersionInProgressUq: uniqueIndex("onboarding_sessions_user_version_in_progress_uq").on(
      table.userId,
      table.version
    ),
  })
);

// Per-question answers for onboarding sessions
export const onboardingAnswers = pgTable(
  "onboarding_answers",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => onboardingSessions.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    // Store a structured answer payload (single/multi/number/date/text etc.)
    answer: jsonb("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    sessionQuestionUq: uniqueIndex("onboarding_answers_session_question_uq").on(
      table.sessionId,
      table.questionId
    ),
    sessionIdIdx: index("onboarding_answers_session_id_idx").on(table.sessionId),
  })
);

export type User = typeof users.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type OnboardingAnswer = typeof onboardingAnswers.$inferSelect;
