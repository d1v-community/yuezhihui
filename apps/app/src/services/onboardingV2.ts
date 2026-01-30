import { apiRequest } from './api'

export type OnboardingV2QuestionId =
  | 'A0_consent_research'
  | 'B1_birth_date'
  | 'B2_region_level'
  | 'C1_menarche_ever'
  | 'C6_menarche_age_band'
  | 'C3_menses_last_3m'
  | 'C5_amenorrhea_reason'
  | 'C4_amenorrhea_ever_3m'
  | 'C2_current_status'
  | 'D1_period_length_days'
  | 'D2_cycle_regularity'
  | 'D3_cycle_length_days'
  | 'D4_irregular_patterns'
  | 'D5_last_period_start'
  | 'E1_products'
  | 'E1_pad_brand'
  | 'E1_pad_brand_other_text'
  | 'E1_tampon_brand'
  | 'E1_tampon_brand_other_text'
  | 'E1_cup_brand'
  | 'E1_cup_brand_other_text'
  | 'E1_disc_brand'
  | 'E1_disc_brand_other_text'
  | 'E1_period_underwear_brand'
  | 'E1_period_underwear_brand_other_text'
  | 'E1_other_product_text'
  | 'E2_change_frequency_peak'
  | 'E3_clots_leakage'
  | 'F1_health_conditions'
  | 'F2_condition_source'
  | 'F2_condition_source_unknown_text'
  | 'M1_pregnancy_possible'
  | 'M1_pregnancy_test'
  | 'M2_iron_deficiency_confirm'
  | 'M3_iron_treatment'
  | 'G1_bleeding_history_multi'
  | 'H1_contraception_methods'
  | 'H2_pregnancy_history'
  | 'H3_pregnancy_count_band'
  | 'H4_birth_history'
  | 'H5_abortion_history'
  | 'I1_height_cm'
  | 'I2_weight_kg'
  | 'J1_know_mbl'
  | 'J2_mbl_band'
  | 'J3_mbl_subjective'

export type OnboardingV2AnswerPayload =
  | { type: 'single'; value: string }
  | { type: 'multi'; values: string[] }
  | { type: 'number'; value: number | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: 'date'; value: string | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: 'text'; value: string | null; meta?: { unknown?: boolean; no_answer?: boolean } }
  | { type: 'object'; value: Record<string, unknown> }

export type OnboardingV2AnswersMap = Partial<Record<OnboardingV2QuestionId, OnboardingV2AnswerPayload>>

export type OnboardingV2Session = {
  id: string
  version: string
  status: 'in_progress' | 'completed'
  currentQuestionId: OnboardingV2QuestionId | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export async function onboardingV2Start() {
  return apiRequest<{
    success: boolean
    session: OnboardingV2Session | null
    answers: OnboardingV2AnswersMap
  }>({ path: '/api/onboarding/v2/start', method: 'POST', data: {} })
}

export async function onboardingV2State() {
  return apiRequest<{
    success: boolean
    session: OnboardingV2Session | null
    answers: OnboardingV2AnswersMap
  }>({ path: '/api/onboarding/v2/state', method: 'GET' })
}

export async function onboardingV2Answer(questionId: OnboardingV2QuestionId, answer: OnboardingV2AnswerPayload) {
  return apiRequest<{ success: boolean; error?: string; sessionId?: string; nextQuestionId?: OnboardingV2QuestionId | null }>({
    path: '/api/onboarding/v2/answer',
    method: 'POST',
    data: { questionId, answer },
  })
}

export async function onboardingV2Submit() {
  return apiRequest<{ success: boolean; sessionId?: string; status?: 'completed'; answersCount?: number; error?: string }>({
    path: '/api/onboarding/v2/submit',
    method: 'POST',
    data: {},
  })
}

export async function onboardingV2Position(currentQuestionId: OnboardingV2QuestionId | null) {
  return apiRequest<{ success: boolean; error?: string; sessionId?: string; currentQuestionId?: OnboardingV2QuestionId | null }>({
    path: '/api/onboarding/v2/position',
    method: 'POST',
    data: { currentQuestionId },
  })
}
