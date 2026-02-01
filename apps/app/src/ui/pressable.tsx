import { View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  className?: string
  style?: any
  disabled?: boolean
  onClick?: (...args: any[]) => void
  hoverClassName?: string
}>

export function FCPressable({ className, style, disabled, onClick, hoverClassName = 'fc-pressed', children }: Props) {
  return (
    <View
      className={className}
      style={style}
      // `hoverClass` works in weapp and provides a consistent "press" feedback.
      hoverClass={disabled ? '' : hoverClassName}
      hoverStayTime={120}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </View>
  )
}

