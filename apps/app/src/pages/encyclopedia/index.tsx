import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCTabBar } from '../../ui'
import './index.less'

export default function EncyclopediaPage() {
  useLoad(() => {
    void ensureAuthedAndOnboardedOrRedirect()
  })

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="row">
              <Text className="title">百科</Text>
              <FCButton size="sm" variant="secondary" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                设置
              </FCButton>
            </View>
            <Text className="desc">这里将提供科学、温和、可解释的知识卡片（P2）。</Text>
            <Text className="desc">优先级高于内容的是：记录闭环与分析价值。</Text>
          </View>

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
        </View>
      </View>
    </View>
  )
}

