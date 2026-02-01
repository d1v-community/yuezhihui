import { Text, View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { FCPressable } from './pressable'
import './optionCard.less'

type Props = PropsWithChildren<{
  active?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
}>

export function FCOptionCard({ active, disabled, label, onClick, children }: Props) {
  return (
    <FCPressable
      className={['fcOption', active ? 'fcOptionActive' : '', disabled ? 'fcOptionDisabled' : ''].join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      <View className="fcOptionRow">
        <View style={{ flex: 1 }}>
          <Text className="fcOptionLabel">{label}</Text>
          {children ? <View style={{ marginTop: 6 }}>{children}</View> : null}
        </View>
        <View className={['fcOptionMark', active ? 'fcOptionMarkActive' : ''].join(' ')}>
          <Text className="fcOptionMarkText">{active ? '✓' : ''}</Text>
        </View>
      </View>
    </FCPressable>
  )
}

