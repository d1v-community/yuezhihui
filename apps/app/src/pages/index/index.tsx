import { useState } from 'react'
import Taro, { getCurrentInstance, useLoad } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageString, removeStorage, setStorageString } from '../../storage/storage'
import { authMe } from '../../services/auth'
import { onboardingV2State } from '../../services/onboardingV2'
import { computeOnboardingAnchorDate } from '../../onboardingV2/anchorDate'
import { FCButton } from '../../ui'
import './index.less'

export default function Index() {
  const [paused, setPaused] = useState(false)
  const [booting, setBooting] = useState(true)

  const bootstrap = async () => {
    setBooting(true)
    try {
      const token = getStorageString(STORAGE_KEYS.authToken)
      if (!token) {
        Taro.redirectTo({ url: '/pages/login/index' })
        return
      }

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
    } catch {
      removeStorage(STORAGE_KEYS.authToken)
      Taro.redirectTo({ url: '/pages/login/index' })
    } finally {
      setBooting(false)
    }
  }

  useLoad(() => {
    const pause = getCurrentInstance().router?.params?.pause
    if (pause === '1') {
      setPaused(true)
      setBooting(false)
      return
    }
    void bootstrap()
  })

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="brand">
            <View className="mark">
              <Text className="markText">FS</Text>
            </View>
            <Text className="title">FlowSense</Text>
          </View>

          <View className="card fc-appear">
            <Text className="desc">
              {paused
                ? '已保存进度。你可以随时继续完成问卷，或直接关闭页面稍后再来。'
                : booting
                  ? '正在连接服务...'
                  : '准备就绪'}
            </Text>

            {paused ? (
              <View className="actions">
                <FCButton loading={booting} fullWidth onClick={() => void bootstrap()}>
                  继续
                </FCButton>
                <FCButton
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    removeStorage(STORAGE_KEYS.authToken)
                    Taro.redirectTo({ url: '/pages/login/index' })
                  }}
                >
                  退出登录
                </FCButton>
              </View>
            ) : (
              <View className="actions">
                <FCButton loading fullWidth>
                  进入
                </FCButton>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
