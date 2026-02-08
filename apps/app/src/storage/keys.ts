export const STORAGE_KEYS = {
  authToken: 'auth.token',
  onboardingAnchorDate: 'onboarding.anchorDate', // YYYY-MM-DD
  dailyFirstCompletedAt: 'daily.firstCompletedAt', // timestamp
  dailyFirstGuideShown: 'daily.firstGuideShown', // '1'
  visibilitySettings: 'settings.visibility', // JSON
  inputModeSettings: 'settings.inputMode', // JSON
  feedbackDraft: 'feedback.draft', // JSON
} as const
