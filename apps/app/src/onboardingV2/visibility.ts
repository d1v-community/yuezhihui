import type { OnboardingV2AnswersMap, OnboardingV2QuestionId, OnboardingV2AnswerPayload } from '../services/onboardingV2'
import { ONBOARDING_V2_QUESTION_ORDER } from './questions'

function getSingle(answers: OnboardingV2AnswersMap, id: OnboardingV2QuestionId): string | null {
  const a = answers[id] as OnboardingV2AnswerPayload | undefined
  if (!a || a.type !== 'single') return null
  return typeof a.value === 'string' ? a.value : null
}

function getMulti(answers: OnboardingV2AnswersMap, id: OnboardingV2QuestionId): string[] {
  const a = answers[id] as OnboardingV2AnswerPayload | undefined
  if (!a || a.type !== 'multi') return []
  return Array.isArray(a.values) ? a.values : []
}

function includesMulti(answers: OnboardingV2AnswersMap, id: OnboardingV2QuestionId, v: string) {
  return getMulti(answers, id).includes(v)
}

// Client-side mirror of server jump logic (for progress display only).
export function isQuestionVisibleV2(id: OnboardingV2QuestionId, answers: OnboardingV2AnswersMap) {
  const menarcheEver = getSingle(answers, 'C1_menarche_ever')
  const mensesLast3m = getSingle(answers, 'C3_menses_last_3m')
  const currentStatus = getSingle(answers, 'C2_current_status')

  switch (id) {
    case 'A0_consent_research':
    case 'B1_birth_date':
    case 'B2_region_level':
    case 'C1_menarche_ever':
    case 'F1_health_conditions':
    case 'G1_bleeding_history_multi':
    case 'I1_height_cm':
    case 'I2_weight_kg':
      return true

    case 'C6_menarche_age_band':
    case 'C3_menses_last_3m':
    case 'C2_current_status':
    case 'H1_contraception_methods':
    case 'H2_pregnancy_history':
    case 'H5_abortion_history':
      return menarcheEver === 'yes'

    case 'C5_amenorrhea_reason':
      return menarcheEver === 'yes' && mensesLast3m === 'no'

    case 'C4_amenorrhea_ever_3m': {
      if (!(menarcheEver === 'yes' && mensesLast3m === 'no')) return false
      const reason = getSingle(answers, 'C5_amenorrhea_reason')
      return (
        reason === 'surgery' ||
        reason === 'disease' ||
        reason === 'weight_stress' ||
        reason === 'other_known' ||
        reason === 'unknown'
      )
    }

    case 'D1_period_length_days':
    case 'D2_cycle_regularity':
      return menarcheEver === 'yes' && mensesLast3m === 'yes' && currentStatus !== 'menopause'

    case 'D3_cycle_length_days':
      return getSingle(answers, 'D2_cycle_regularity') === 'regular'

    case 'D4_irregular_patterns':
      return getSingle(answers, 'D2_cycle_regularity') === 'irregular'

    case 'D5_last_period_start':
      return menarcheEver === 'yes' && mensesLast3m === 'yes'

    case 'E1_products':
    case 'E2_change_frequency_peak':
    case 'E3_clots_leakage':
      return menarcheEver === 'yes' && currentStatus !== 'menopause'

    case 'E1_pad_brand':
      return includesMulti(answers, 'E1_products', 'pad')
    case 'E1_pad_brand_other_text':
      return getSingle(answers, 'E1_pad_brand') === 'other'

    case 'E1_tampon_brand':
      return includesMulti(answers, 'E1_products', 'tampon')
    case 'E1_tampon_brand_other_text':
      return getSingle(answers, 'E1_tampon_brand') === 'other'

    case 'E1_cup_brand':
      return includesMulti(answers, 'E1_products', 'cup')
    case 'E1_cup_brand_other_text':
      return getSingle(answers, 'E1_cup_brand') === 'other'

    case 'E1_disc_brand':
      return includesMulti(answers, 'E1_products', 'disc')
    case 'E1_disc_brand_other_text':
      return getSingle(answers, 'E1_disc_brand') === 'other'

    case 'E1_period_underwear_brand':
      return includesMulti(answers, 'E1_products', 'period_underwear')
    case 'E1_period_underwear_brand_other_text':
      return getSingle(answers, 'E1_period_underwear_brand') === 'other'

    case 'E1_other_product_text':
      return includesMulti(answers, 'E1_products', 'other')

    case 'F2_condition_source':
      return getMulti(answers, 'F1_health_conditions').length > 0
    case 'F2_condition_source_unknown_text':
      return getSingle(answers, 'F2_condition_source') === 'unknown'

    case 'M1_pregnancy_possible': {
      if (!(menarcheEver === 'yes' && currentStatus !== 'menopause')) return false
      const hasIntermenstrualBleeding = includesMulti(answers, 'F1_health_conditions', '非经期出血')
      return mensesLast3m === 'no' || hasIntermenstrualBleeding
    }
    case 'M1_pregnancy_test': {
      const v = getSingle(answers, 'M1_pregnancy_possible')
      return v === 'possible' || v === 'unknown'
    }

    case 'M2_iron_deficiency_confirm':
      return includesMulti(answers, 'F1_health_conditions', '缺铁性贫血')
    case 'M3_iron_treatment':
      return getSingle(answers, 'M2_iron_deficiency_confirm') === 'yes'

    case 'H3_pregnancy_count_band':
    case 'H4_birth_history': {
      const v = getSingle(answers, 'H2_pregnancy_history')
      return v === 'ever' || v === 'pregnant_now'
    }

    case 'J1_know_mbl':
      return menarcheEver === 'yes' && currentStatus !== 'menopause'
    case 'J2_mbl_band':
      return getSingle(answers, 'J1_know_mbl') === 'yes'
    case 'J3_mbl_subjective': {
      const v = getSingle(answers, 'J1_know_mbl')
      if (!v) return false
      return v !== 'yes'
    }

    default:
      return false
  }
}

export function getVisibleQuestionIds(answers: OnboardingV2AnswersMap) {
  return ONBOARDING_V2_QUESTION_ORDER.filter((id) => isQuestionVisibleV2(id, answers))
}

export function getNextVisibleQuestionIdV2(after: OnboardingV2QuestionId, answers: OnboardingV2AnswersMap) {
  const idx = ONBOARDING_V2_QUESTION_ORDER.indexOf(after)
  if (idx < 0) return null
  for (let i = idx + 1; i < ONBOARDING_V2_QUESTION_ORDER.length; i++) {
    const id = ONBOARDING_V2_QUESTION_ORDER[i]
    if (isQuestionVisibleV2(id, answers)) return id
  }
  return null
}
