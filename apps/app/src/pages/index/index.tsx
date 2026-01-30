import Taro, { useLoad } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageString, removeStorage, setStorageString } from '../../storage/storage'
import { authMe } from '../../services/auth'
import { onboardingV2State } from '../../services/onboardingV2'
import { computeOnboardingAnchorDate } from '../../onboardingV2/anchorDate'
import './index.less'

export default function Index() {
  useLoad(() => {
    ;(async () => {
      const token = getStorageString(STORAGE_KEYS.authToken)
      if (!token) {
        Taro.redirectTo({ url: '/pages/login/index' })
        return
      }

      try {
        const me = await authMe()
        if (!('authenticated' in me) || me.authenticated !== true) {
          removeStorage(STORAGE_KEYS.authToken)
          Taro.redirectTo({ url: '/pages/login/index' })
          return
        }

        const state = await onboardingV2State()
        if (state?.session?.status === 'completed') {
          const anchorDate = computeOnboardingAnchorDate(state.answers || {})
          setStorageString(STORAGE_KEYS.onboardingAnchorDate, anchorDate)
          Taro.redirectTo({ url: '/pages/home/index' })
          return
        }

        Taro.redirectTo({ url: '/pages/onboarding/index' })
      } catch (e) {
        // Network failure: keep it simple (go login so user can retry).
        removeStorage(STORAGE_KEYS.authToken)
        Taro.redirectTo({ url: '/pages/login/index' })
      }
    })()
  })

  return (
    <View className="index">
      <Text>Loading...</Text>
    </View>
  )
}
