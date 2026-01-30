import { Input, Text, View } from '@tarojs/components'
import type { PropsWithChildren, ReactNode } from 'react'
import './textField.less'

type Props = PropsWithChildren<{
  label?: string
  value: string
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'number' | 'idcard' | 'digit' | 'safe-password' | 'nickname'
  confirmType?: 'done' | 'next' | 'search' | 'send' | 'go'
  helperText?: string
  errorText?: string
  onChange: (next: string) => void
  rightSlot?: ReactNode
  className?: string
  style?: any
}>

export function FCTextField({
  label,
  value,
  placeholder,
  disabled,
  type = 'text',
  confirmType,
  helperText,
  errorText,
  onChange,
  rightSlot,
  className,
  style,
}: Props) {
  return (
    <View className={['fcField', className || ''].join(' ')} style={style}>
      {label ? <Text className="fcFieldLabel">{label}</Text> : null}
      <Input
        className={['fcFieldInput', errorText ? 'fcFieldInputError' : ''].join(' ')}
        value={value}
        placeholder={placeholder}
        type={type as any}
        disabled={disabled}
        confirmType={confirmType as any}
        onInput={(e) => onChange(String((e as any).detail?.value ?? ''))}
      />
      {helperText || errorText || rightSlot ? (
        <View className="fcFieldHelperRow">
          <Text className={errorText ? 'fcFieldError' : 'fcFieldHelper'}>{errorText || helperText || ' '}</Text>
          {rightSlot ? <View>{rightSlot}</View> : null}
        </View>
      ) : null}
    </View>
  )
}
