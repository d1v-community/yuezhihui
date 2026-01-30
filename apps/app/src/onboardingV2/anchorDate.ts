import type { OnboardingV2AnswersMap } from '../services/onboardingV2'
import { addDaysYmd, clampYmd, todayYmd } from '../utils/date'

/**
 * anchorDate rules from USER_FLOW_MINIPROGRAM_DAILY:
 * - Prefer D5_last_period_start (YYYY-MM-DD) if provided
 * - Otherwise fallback to today
 * - Defensive clamp: <= today and within a reasonable min range (default: 180 days)
 */
export function computeOnboardingAnchorDate(answers: OnboardingV2AnswersMap, opts?: { minDaysAgo?: number }) {
  const today = todayYmd()
  const min = addDaysYmd(today, -(opts?.minDaysAgo ?? 180))
  const a = answers.D5_last_period_start
  const v = a && a.type === 'date' ? a.value : null
  const date = typeof v === 'string' && v ? v : today
  return clampYmd(date, min, today)
}

