import { Text } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { FCPressable } from './pressable'
import './textButton.less'

type Props = PropsWithChildren<{
  className?: string
  style?: any
  disabled?: boolean
  onClick?: () => void
}>

export function FCTextButton({ className, style, disabled, onClick, children }: Props) {
  return (
    <FCPressable
      className={['fcTextBtn', disabled ? 'fcTextBtnDisabled' : '', className || ''].join(' ')}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      <Text className="fcTextBtnText">{children}</Text>
    </FCPressable>
  )
}

