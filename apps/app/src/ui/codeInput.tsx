import { Input, Text, View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import './codeInput.less'

type Props = {
  value: string
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  onChange: (next: string) => void
  onComplete?: (code: string) => void
}

export function FCCodeInput({ value, length = 6, disabled, autoFocus, onChange, onComplete }: Props) {
  const inputRef = useRef<any>(null)
  const [focusTick, setFocusTick] = useState(0)
  const [focused, setFocused] = useState(Boolean(autoFocus))

  const requestFocus = () => {
    if (disabled) return
    setFocused(true)
    setFocusTick((v) => v + 1)
    setTimeout(() => {
      try {
        inputRef.current?.focus?.()
      } catch {
        // ignore
      }
    }, 0)
  }

  // Keep focus behaviour in sync with disabled/autoFocus states.
  // When the field is re-enabled while autoFocus is true (for example
  // after sending the code on desktop web), we request focus again so
  // the user can type immediately without extra Tab/click actions.
  useEffect(() => {
    if (disabled) {
      setFocused(false)
      return
    }
    if (autoFocus) {
      requestFocus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled])

  const v = (value || '').replace(/\D/g, '').slice(0, length)
  const digits = v.split('')
  const activeIdx = Math.min(digits.length, length - 1)

  return (
    <View className={['fcCodeWrap', disabled ? 'fcCodeDisabled' : ''].join(' ')} onClick={requestFocus}>
      <Input
        ref={inputRef}
        key={`fc-code-${focusTick}`}
        className="fcCodeHiddenInput"
        value={v}
        type="number"
        maxlength={length as any}
        confirmType="done"
        focus={focused}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={requestFocus}
        onInput={(e) => {
          const raw = String((e as any).detail?.value ?? '')
          const next = raw.replace(/\D/g, '').slice(0, length)
          onChange(next)
          if (next.length === length) onComplete?.(next)
        }}
      />
      <View className="fcCodeBoxes">
        {Array.from({ length }, (_, i) => {
          const ch = digits[i] || ''
          const active = i === activeIdx
          return (
            <View key={i} className={['fcCodeBox', active ? 'fcCodeBoxActive' : ''].join(' ')}>
              <Text className="fcCodeChar">{ch || ' '}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
