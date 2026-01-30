import { Text, View } from '@tarojs/components'
import './notice.less'

type Variant = 'default' | 'warn' | 'success'

type Props = {
  title: string
  desc?: string
  variant?: Variant
  className?: string
  style?: any
}

export function FCNotice({ title, desc, variant = 'default', className, style }: Props) {
  const v = variant === 'warn' ? 'fcNoticeWarn' : variant === 'success' ? 'fcNoticeSuccess' : ''
  return (
    <View className={['fcNotice', v, className || ''].join(' ')} style={style}>
      <View className="fcNoticeDot" />
      <View style={{ flex: 1 }}>
        <Text className="fcNoticeTitle">{title}</Text>
        {desc ? <Text className="fcNoticeDesc">{desc}</Text> : null}
      </View>
    </View>
  )
}

