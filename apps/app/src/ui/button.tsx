import { Text, View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { FCPressable } from './pressable'
import './button.less'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = PropsWithChildren<{
  className?: string
  style?: any
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
}>

export function FCButton({
  className,
  style,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  onClick,
  children,
}: Props) {
  const isDisabled = Boolean(disabled || loading)
  const variantClass =
    variant === 'secondary' ? 'fcBtnSecondary' : variant === 'ghost' ? 'fcBtnGhost' : 'fcBtnPrimary'
  const sizeClass = size === 'sm' ? 'fcBtnSm' : size === 'lg' ? 'fcBtnLg' : ''

  return (
    <FCPressable
      className={[
        'fcBtn',
        variantClass,
        sizeClass,
        fullWidth ? 'fcBtnFull' : '',
        isDisabled ? 'fcBtnDisabled' : '',
        className || '',
      ].join(' ')}
      style={style}
      disabled={isDisabled}
      onClick={onClick}
    >
      {loading ? <View className="fc-spinner" /> : null}
      <Text className="fcBtnText">{children}</Text>
    </FCPressable>
  )
}

