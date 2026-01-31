import { pgTable, text, timestamp, index, jsonb, uniqueIndex, integer, boolean, date, serial, bigserial } from "drizzle-orm/pg-core";

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

// --- Menstrual (daily + events) ---

export const menstrualDaily = pgTable(
  "menstrual_daily",
  {
    // Composite PK in SQL migration: (user_id, record_date)
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordDate: date("record_date").notNull(),
    hasBleeding: boolean("has_bleeding").notNull().default(false),
    totalVolumeMl: integer("total_volume_ml").notNull().default(0),
    dayColor: text("day_color"),
    clotSmallCount: integer("clot_small_count").notNull().default(0),
    clotLargeCount: integer("clot_large_count").notNull().default(0),
    cycleId: integer("cycle_id"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userDateUq: uniqueIndex("menstrual_daily_user_date_uq").on(table.userId, table.recordDate),
    userIdIdx: index("menstrual_daily_user_id_idx").on(table.userId),
    recordDateIdx: index("menstrual_daily_record_date_idx").on(table.recordDate),
    cycleIdIdx: index("menstrual_daily_cycle_id_idx").on(table.cycleId),
  }),
);

export const menstrualEvent = pgTable(
  "menstrual_event",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordDate: date("record_date").notNull(),
    eventTime: timestamp("event_time", { withTimezone: false }).notNull(),
    eventType: text("event_type").notNull(), // 'pad' | 'tampon' | 'symptom'
    volumeMl: integer("volume_ml").notNull().default(0),
    color: text("color"),
    productType: text("product_type"),
    brand: text("brand"),
    series: text("series"),
    lengthMm: integer("length_mm"),
    model: text("model"),
    absorbency: text("absorbency"),
    symptomName: text("symptom_name"),
    cycleId: integer("cycle_id"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index("menstrual_event_user_date_idx").on(table.userId, table.recordDate),
    userDateTimeIdx: index("menstrual_event_user_date_time_idx").on(table.userId, table.recordDate, table.eventTime),
    cycleIdIdx: index("menstrual_event_cycle_id_idx").on(table.cycleId),
  }),
);

export const menstrualCycle = pgTable(
  "menstrual_cycle",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    daysCount: integer("days_count").notNull().default(0),
    totalVolumeMl: integer("total_volume_ml").notNull().default(0),
    levelStatus: text("level_status"),
    distributionStatus: text("distribution_status"),
    colorStatus: text("color_status"),
    clotStatus: text("clot_status"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userStartUq: uniqueIndex("menstrual_cycle_user_start_uq").on(table.userId, table.startDate),
    userStartIdx: index("menstrual_cycle_user_start_idx").on(table.userId, table.startDate),
  }),
);

// --- Products (brands + series) ---

export const productBrands = pgTable(
  "product_brands",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // 'pad' | 'tampon'
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("product_brands_type_idx").on(table.type),
    typeNameUq: uniqueIndex("product_brands_type_name_uq").on(table.type, table.name),
  }),
);

export const productSeries = pgTable(
  "product_series",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => productBrands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    brandIdx: index("product_series_brand_id_idx").on(table.brandId),
    brandNameUq: uniqueIndex("product_series_brand_name_uq").on(table.brandId, table.name),
  }),
);

// --- Feedback ---

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    typeIndex: integer("type_index").notNull().default(0),
    content: text("content").notNull(),
    contact: text("contact"),
    images: jsonb("images"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("feedback_user_id_idx").on(table.userId),
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
  }),
);

// --- Share ---

export const shareRecord = pgTable(
  "share_record",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shareCode: text("share_code").notNull(),
    shareType: text("share_type").notNull(), // 'period' | 'overview'
    paramsJson: jsonb("params_json"),
    expireAt: timestamp("expire_at", { withTimezone: false }),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    shareCodeUq: uniqueIndex("share_record_share_code_uq").on(table.shareCode),
    ownerCreatedAtIdx: index("share_record_owner_created_at_idx").on(table.ownerUserId, table.createdAt),
    expireAtIdx: index("share_record_expire_at_idx").on(table.expireAt),
  }),
);

export type User = typeof users.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type OnboardingAnswer = typeof onboardingAnswers.$inferSelect;
export type MenstrualDaily = typeof menstrualDaily.$inferSelect;
export type MenstrualEvent = typeof menstrualEvent.$inferSelect;
export type MenstrualCycle = typeof menstrualCycle.$inferSelect;
export type ProductBrand = typeof productBrands.$inferSelect;
export type ProductSeries = typeof productSeries.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type ShareRecord = typeof shareRecord.$inferSelect;
