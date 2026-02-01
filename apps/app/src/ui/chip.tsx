import { Text } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { FCPressable } from './pressable'
import './chip.less'

type Props = PropsWithChildren<{
  active?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}>

export function FCChip({ active, disabled, className, onClick, children }: Props) {
  return (
    <FCPressable
      className={['fcChip', active ? 'fcChipActive' : '', disabled ? 'fcChipDisabled' : '', className || ''].join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      <Text>{children}</Text>
    </FCPressable>
  )
}

