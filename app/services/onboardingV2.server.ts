import { randomUUID } from "node:crypto";
import { and, eq, desc } from "drizzle-orm";
import { db } from "~/db/db.server";
import { onboardingAnswers, onboardingSessions } from "~/db/schema";

export type OnboardingV2QuestionId =
  | "A0_consent_research"
  | "B1_birth_date"
  | "B2_region_level"
  | "C1_menarche_ever"
  | "C6_menarche_age_band"
  | "C3_menses_last_3m"
  | "C5_amenorrhea_reason"
  | "C4_amenorrhea_ever_3m"
  | "C2_current_status"
  | "D1_period_length_days"
  | "D2_cycle_regularity"
  | "D3_cycle_length_days"
  | "D4_irregular_patterns"
  | "D5_last_period_start"
  | "E1_products"
  | "E1_pad_brand"
  | "E1_pad_brand_other_text"
  | "E1_tampon_brand"
  | "E1_tampon_brand_other_text"
  | "E1_cup_brand"
  | "E1_cup_brand_other_text"
  | "E1_disc_brand"
  | "E1_disc_brand_other_text"
  | "E1_period_underwear_brand"
  | "E1_period_underwear_brand_other_text"
  | "E1_other_product_text"
  | "E2_change_frequency_peak"
  | "E3_clots_leakage"
  | "F1_health_conditions"
  | "F2_condition_source"
  | "F2_condition_source_unknown_text"
  | "M1_pregnancy_possible"
  | "M1_pregnancy_test"
  | "M2_iron_deficiency_confirm"
  | "M3_iron_treatment"
  | "G1_bleeding_history_multi"
  | "H1_contraception_methods"
  | "H2_pregnancy_history"
  | "H3_pregnancy_count_band"
  | "H4_birth_history"
  | "H5_abortion_history"
  | "I1_height_cm"
  | "I2_weight_kg"
  | "J1_know_mbl"
  | "J2_mbl_band"
  | "J3_mbl_subjective";

export type OnboardingV2AnswerPayload =
  | { type: "single"; value: string }
  | { type: "multi"; values: string[] }
  | { type: "number"; value: number | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: "date"; value: string | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: "text"; value: string | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: "object"; value: Record<string, unknown> };

export type OnboardingV2AnswersMap = Partial<
  Record<OnboardingV2QuestionId, OnboardingV2AnswerPayload>
>;

export const ONBOARDING_V2_VERSION = "v2" as const;

export const ONBOARDING_V2_QUESTION_ORDER: readonly OnboardingV2QuestionId[] = [
  "A0_consent_research",
  "B1_birth_date",
  "B2_region_level",
  "C1_menarche_ever",
  "C6_menarche_age_band",
  "C3_menses_last_3m",
  "C5_amenorrhea_reason",
  "C4_amenorrhea_ever_3m",
  "C2_current_status",
  "D1_period_length_days",
  "D2_cycle_regularity",
  "D3_cycle_length_days",
  "D4_irregular_patterns",
  "D5_last_period_start",
  "E1_products",
  "E1_pad_brand",
  "E1_pad_brand_other_text",
  "E1_tampon_brand",
  "E1_tampon_brand_other_text",
  "E1_cup_brand",
  "E1_cup_brand_other_text",
  "E1_disc_brand",
  "E1_disc_brand_other_text",
  "E1_period_underwear_brand",
  "E1_period_underwear_brand_other_text",
  "E1_other_product_text",
  "E2_change_frequency_peak",
  "E3_clots_leakage",
  "F1_health_conditions",
  "F2_condition_source",
  "F2_condition_source_unknown_text",
  "M1_pregnancy_possible",
  "M1_pregnancy_test",
  "M2_iron_deficiency_confirm",
  "M3_iron_treatment",
  "G1_bleeding_history_multi",
  "H1_contraception_methods",
  "H2_pregnancy_history",
  "H3_pregnancy_count_band",
  "H4_birth_history",
  "H5_abortion_history",
  "I1_height_cm",
  "I2_weight_kg",
  "J1_know_mbl",
  "J2_mbl_band",
  "J3_mbl_subjective",
];

function getSingle(answers: OnboardingV2AnswersMap, id: OnboardingV2QuestionId): string | null {
  const a = answers[id];
  if (!a) return null;
  if (a.type !== "single") return null;
  return a.value ?? null;
}

function getMulti(answers: OnboardingV2AnswersMap, id: OnboardingV2QuestionId): string[] {
  const a = answers[id];
  if (!a) return [];
  if (a.type !== "multi") return [];
  return Array.isArray(a.values) ? a.values : [];
}

function includesMulti(
  answers: OnboardingV2AnswersMap,
  id: OnboardingV2QuestionId,
  value: string
): boolean {
  return getMulti(answers, id).includes(value);
}

export function isOnboardingV2QuestionId(id: string): id is OnboardingV2QuestionId {
  return (ONBOARDING_V2_QUESTION_ORDER as readonly string[]).includes(id);
}

export function isQuestionVisibleV2(id: OnboardingV2QuestionId, answers: OnboardingV2AnswersMap) {
  const menarcheEver = getSingle(answers, "C1_menarche_ever");
  const mensesLast3m = getSingle(answers, "C3_menses_last_3m");
  const currentStatus = getSingle(answers, "C2_current_status");

  switch (id) {
    case "A0_consent_research":
    case "B1_birth_date":
    case "B2_region_level":
    case "C1_menarche_ever":
    case "F1_health_conditions":
    case "G1_bleeding_history_multi":
    case "I1_height_cm":
    case "I2_weight_kg":
      return true;

    case "C6_menarche_age_band":
    case "C3_menses_last_3m":
    case "C2_current_status":
    case "H1_contraception_methods":
    case "H2_pregnancy_history":
    case "H5_abortion_history":
      return menarcheEver === "yes";

    case "C5_amenorrhea_reason":
      return menarcheEver === "yes" && mensesLast3m === "no";

    case "C4_amenorrhea_ever_3m": {
      if (!(menarcheEver === "yes" && mensesLast3m === "no")) return false;
      const reason = getSingle(answers, "C5_amenorrhea_reason");
      return (
        reason === "surgery" ||
        reason === "disease" ||
        reason === "weight_stress" ||
        reason === "other_known" ||
        reason === "unknown"
      );
    }

    case "D1_period_length_days":
    case "D2_cycle_regularity":
      return menarcheEver === "yes" && mensesLast3m === "yes" && currentStatus !== "menopause";

    case "D3_cycle_length_days":
      return getSingle(answers, "D2_cycle_regularity") === "regular";

    case "D4_irregular_patterns":
      return getSingle(answers, "D2_cycle_regularity") === "irregular";

    case "D5_last_period_start":
      return menarcheEver === "yes" && mensesLast3m === "yes";

    case "E1_products":
    case "E2_change_frequency_peak":
    case "E3_clots_leakage":
      return menarcheEver === "yes" && currentStatus !== "menopause";

    case "E1_pad_brand":
      return includesMulti(answers, "E1_products", "pad");
    case "E1_pad_brand_other_text":
      return includesMulti(answers, "E1_pad_brand", "other");

    case "E1_tampon_brand":
      return includesMulti(answers, "E1_products", "tampon");
    case "E1_tampon_brand_other_text":
      return includesMulti(answers, "E1_tampon_brand", "other");

    case "E1_cup_brand":
      return includesMulti(answers, "E1_products", "cup");
    case "E1_cup_brand_other_text":
      return includesMulti(answers, "E1_cup_brand", "other");

    case "E1_disc_brand":
      return includesMulti(answers, "E1_products", "disc");
    case "E1_disc_brand_other_text":
      return includesMulti(answers, "E1_disc_brand", "other");

    case "E1_period_underwear_brand":
      return includesMulti(answers, "E1_products", "period_underwear");
    case "E1_period_underwear_brand_other_text":
      return includesMulti(answers, "E1_period_underwear_brand", "other");

    case "E1_other_product_text":
      return includesMulti(answers, "E1_products", "other");

    case "F2_condition_source":
      return getMulti(answers, "F1_health_conditions").length > 0;
    case "F2_condition_source_unknown_text":
      return getSingle(answers, "F2_condition_source") === "unknown";

    case "M1_pregnancy_possible": {
      if (!(menarcheEver === "yes" && currentStatus !== "menopause")) return false;
      const hasIntermenstrualBleeding = includesMulti(answers, "F1_health_conditions", "非经期出血");
      return mensesLast3m === "no" || hasIntermenstrualBleeding;
    }
    case "M1_pregnancy_test": {
      const v = getSingle(answers, "M1_pregnancy_possible");
      return v === "possible" || v === "unknown";
    }
    case "M2_iron_deficiency_confirm":
      return includesMulti(answers, "F1_health_conditions", "缺铁性贫血");
    case "M3_iron_treatment":
      return getSingle(answers, "M2_iron_deficiency_confirm") === "yes";

    case "H3_pregnancy_count_band":
    case "H4_birth_history": {
      const v = getSingle(answers, "H2_pregnancy_history");
      return v === "ever" || v === "pregnant_now";
    }

    case "J1_know_mbl":
      return menarcheEver === "yes" && currentStatus !== "menopause";
    case "J2_mbl_band":
      return getSingle(answers, "J1_know_mbl") === "yes";
    case "J3_mbl_subjective": {
      const v = getSingle(answers, "J1_know_mbl");
      if (!v) return false;
      return v !== "yes";
    }

    default:
      // Exhaustiveness guard
      return false;
  }
}

export function getFirstVisibleQuestionIdV2(answers: OnboardingV2AnswersMap) {
  for (const id of ONBOARDING_V2_QUESTION_ORDER) {
    if (isQuestionVisibleV2(id, answers)) return id;
  }
  return null;
}

export function getNextVisibleQuestionIdV2(
  after: OnboardingV2QuestionId,
  answers: OnboardingV2AnswersMap
) {
  const idx = ONBOARDING_V2_QUESTION_ORDER.indexOf(after);
  if (idx < 0) return getFirstVisibleQuestionIdV2(answers);
  for (let i = idx + 1; i < ONBOARDING_V2_QUESTION_ORDER.length; i++) {
    const id = ONBOARDING_V2_QUESTION_ORDER[i];
    if (isQuestionVisibleV2(id, answers)) return id;
  }
  return null;
}

export function resolveCurrentQuestionIdV2(
  saved: string | null | undefined,
  answers: OnboardingV2AnswersMap
) {
  // `null` is a valid terminal state meaning "no further question (end of flow)".
  if (saved === null) return null;
  if (saved && isOnboardingV2QuestionId(saved) && isQuestionVisibleV2(saved, answers)) {
    return saved;
  }
  // If the saved id is missing/invalid/hidden (due to jump logic changes), fall back.
  return getFirstVisibleQuestionIdV2(answers);
}

export async function getOrCreateOnboardingV2Session(userId: string) {
  const existing = await db
    .select()
    .from(onboardingSessions)
    .where(
      and(
        eq(onboardingSessions.userId, userId),
        eq(onboardingSessions.version, ONBOARDING_V2_VERSION),
        eq(onboardingSessions.status, "in_progress")
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0];

  const now = new Date();
  const created = {
    id: randomUUID(),
    userId,
    version: ONBOARDING_V2_VERSION,
    status: "in_progress",
    currentQuestionId: "A0_consent_research" as OnboardingV2QuestionId,
    createdAt: now,
    updatedAt: now,
    completedAt: null as Date | null,
  };

  await db.insert(onboardingSessions).values(created);
  return created;
}

export async function getLatestOnboardingV2Session(userId: string) {
  const rows = await db
    .select()
    .from(onboardingSessions)
    .where(and(eq(onboardingSessions.userId, userId), eq(onboardingSessions.version, ONBOARDING_V2_VERSION)))
    .orderBy(desc(onboardingSessions.createdAt))
    .limit(1);
  return rows.length ? rows[0] : null;
}

export async function getOnboardingV2Answers(sessionId: string): Promise<OnboardingV2AnswersMap> {
  const rows = await db
    .select({ questionId: onboardingAnswers.questionId, answer: onboardingAnswers.answer })
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.sessionId, sessionId));

  const map: OnboardingV2AnswersMap = {};
  for (const row of rows) {
    if (isOnboardingV2QuestionId(row.questionId)) {
      map[row.questionId] = row.answer as unknown as OnboardingV2AnswerPayload;
    }
  }
  return map;
}

export async function upsertOnboardingV2Answer(
  sessionId: string,
  questionId: OnboardingV2QuestionId,
  answer: OnboardingV2AnswerPayload
) {
  const now = new Date();
  await db
    .insert(onboardingAnswers)
    .values({
      id: randomUUID(),
      sessionId,
      questionId,
      answer: answer as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [onboardingAnswers.sessionId, onboardingAnswers.questionId],
      set: { answer: answer as any, updatedAt: now },
    });
}

export async function setOnboardingV2Position(
  sessionId: string,
  currentQuestionId: OnboardingV2QuestionId | null
) {
  const now = new Date();
  await db
    .update(onboardingSessions)
    .set({ currentQuestionId, updatedAt: now })
    .where(eq(onboardingSessions.id, sessionId));
}

export async function completeOnboardingV2Session(sessionId: string) {
  const now = new Date();
  await db
    .update(onboardingSessions)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(onboardingSessions.id, sessionId));
}
