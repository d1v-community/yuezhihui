import Taro from '@tarojs/taro'
import { authMe } from '../services/auth'
import { onboardingV2State } from '../services/onboardingV2'
import { STORAGE_KEYS } from '../storage/keys'
import { getStorageString, removeStorage } from '../storage/storage'

export async function ensureAuthedOrRedirect(): Promise<boolean> {
  const token = getStorageString(STORAGE_KEYS.authToken)
  if (!token) {
    Taro.redirectTo({ url: '/pages/login/index' })
    return false
  }

  try {
    const me = await authMe()
    if (!('authenticated' in me) || me.authenticated !== true) {
      removeStorage(STORAGE_KEYS.authToken)
      Taro.redirectTo({ url: '/pages/login/index' })
      return false
    }
    return true
  } catch {
    removeStorage(STORAGE_KEYS.authToken)
    Taro.redirectTo({ url: '/pages/login/index' })
    return false
  }
}

// For pages that should only be reachable after onboarding is completed.
export async function ensureAuthedAndOnboardedOrRedirect(): Promise<boolean> {
  const ok = await ensureAuthedOrRedirect()
  if (!ok) return false

  try {
    const st = await onboardingV2State()
    if (st?.session?.status === 'completed') return true
    Taro.redirectTo({ url: '/pages/onboarding/index' })
    return false
  } catch {
    // If onboarding status can't be loaded, keep the user in-app but route to onboarding as safer default.
    Taro.redirectTo({ url: '/pages/onboarding/index' })
    return false
  }
}
