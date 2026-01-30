import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCTabBar } from '../../ui'
import './index.less'

export default function AnalyzePage() {
  useLoad(() => {
    void ensureAuthedAndOnboardedOrRedirect()
  })

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="row">
              <Text className="title">分析</Text>
              <FCButton size="sm" variant="secondary" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                设置
              </FCButton>
            </View>
            <Text className="desc">这里将呈现健康分、周期趋势与风险提示（P1）。</Text>
            <Text className="desc">当前版本先把信息架构与数据闭环打通。</Text>
          </View>

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
        </View>
      </View>
    </View>
  )
}

