import Taro, { useRouter } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { FCPressable } from './pressable'
import './tabBar.less'

type TabKey = 'home' | 'encyclopedia' | 'analyze'

const TABS: Array<{ key: TabKey; label: string; url: string }> = [
  { key: 'home', label: '每日', url: '/pages/home/index' },
  { key: 'encyclopedia', label: '百科', url: '/pages/encyclopedia/index' },
  { key: 'analyze', label: '分析', url: '/pages/analyze/index' },
]

function resolveActive(path?: string): TabKey {
  const p = String(path || '')
  if (p.includes('/pages/analyze/index') || p.includes('pages/analyze/index')) return 'analyze'
  if (p.includes('/pages/encyclopedia/index') || p.includes('pages/encyclopedia/index')) return 'encyclopedia'
  return 'home'
}

export function FCTabBar() {
  const router = useRouter()
  const active = resolveActive((router as any)?.path || (router as any)?.route)

  return (
    <View className="fcTabBar">
      {TABS.map((t) => {
        const isActive = active === t.key
        return (
          <FCPressable
            key={t.key}
            className={['fcTabItem', isActive ? 'fcTabItemActive' : ''].join(' ')}
            onClick={() => {
              if (isActive) return
              // We don't rely on native tabBar yet; reLaunch keeps navigation simple across H5/weapp.
              Taro.reLaunch({ url: t.url })
            }}
          >
            <Text className="fcTabText">{t.label}</Text>
            <View className={['fcTabDot', isActive ? 'fcTabDotActive' : ''].join(' ')} />
          </FCPressable>
        )
      })}
    </View>
  )
}

