import { Text, View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { FCPressable } from './pressable'
import './sourceTag.less'

type Props = PropsWithChildren<{
  label: string
  hint?: string
  onClick?: () => void
  onLongPress?: () => void
}>

export function FCSourceTag({ label, hint, onClick, onLongPress }: Props) {
  return (
    <FCPressable className="fcSourceTag" onClick={onClick} onLongPress={onLongPress}>
      <View className="fcSourceTagDot" />
      <Text className="fcSourceTagLabel" numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text className="fcSourceTagHint" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
      <Text className="fcSourceTagIcon">⧉</Text>
    </FCPressable>
  )
}

