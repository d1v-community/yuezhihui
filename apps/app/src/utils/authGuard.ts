import Taro from '@tarojs/taro'
import { authMe } from '../services/auth'
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

