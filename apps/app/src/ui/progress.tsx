import { Text, View } from '@tarojs/components'
import './progress.less'

type Props = {
  leftText: string
  rightText?: string
  ratio: number // 0..1
}

export function FCProgress({ leftText, rightText, ratio }: Props) {
  const pct = Math.max(0, Math.min(1, ratio))
  return (
    <View>
      <View className="fcProgressRow">
        <Text className="fcProgressText">{leftText}</Text>
        {rightText ? <Text className="fcProgressText">{rightText}</Text> : null}
      </View>
      <View className="fcProgressBar">
        <View className="fcProgressFill" style={{ width: `${Math.round(pct * 100)}%` }} />
      </View>
    </View>
  )
}

