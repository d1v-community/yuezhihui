import { Picker, Text, View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import './pickerField.less'

type Props = PropsWithChildren<{
  label?: string
  valueText?: string
  placeholder?: string
  disabled?: boolean
  mode: 'selector' | 'date'
  range?: string[]
  value?: any
  end?: string
  onChange: (e: any) => void
}>

export function FCPickerField({ label, valueText, placeholder = '请选择', disabled, mode, range, value, end, onChange }: Props) {
  return (
    <View style={{ marginTop: 14 }}>
      {label ? <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.70)', marginBottom: 8, display: 'block' }}>{label}</Text> : null}
      <Picker mode={mode as any} range={range as any} value={value as any} end={end as any} onChange={onChange} disabled={disabled}>
        <View className="fcPickerField">
          <Text className={['fcPickerText', valueText ? '' : 'fcPickerPlaceholder'].join(' ')}>
            {valueText || placeholder}
          </Text>
          <Text className="fcPickerChevron">›</Text>
        </View>
      </Picker>
    </View>
  )
}

