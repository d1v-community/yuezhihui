import { useState } from 'react'
import Taro, { getCurrentInstance, useLoad } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageString, removeStorage, setStorageString } from '../../storage/storage'
import { authMe } from '../../services/auth'
import { onboardingV2State } from '../../services/onboardingV2'
import { computeOnboardingAnchorDate } from '../../onboardingV2/anchorDate'
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
              <Text className="markText">FC</Text>
            </View>
            <Text className="title">FlowCycle</Text>
          </View>

          <View className="card">
            <Text className="desc">
              {paused
                ? '已保存进度。你可以随时继续完成问卷，或直接关闭页面稍后再来。'
                : booting
                  ? '正在连接服务...'
                  : '准备就绪'}
            </Text>

            {paused ? (
              <View className="actions">
                <Button type="primary" loading={booting} onClick={bootstrap}>
                  继续
                </Button>
                <Button
                  onClick={() => {
                    removeStorage(STORAGE_KEYS.authToken)
                    Taro.redirectTo({ url: '/pages/login/index' })
                  }}
                >
                  退出登录
                </Button>
              </View>
            ) : (
              <View className="actions">
                <Button type="primary" loading>
                  进入
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

