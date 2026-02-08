import type { ReactNode } from 'react'
import { View, Text } from '@tarojs/components'
import type { DailyRecordEvent, MenstrualColor } from '../../types/dailyRecord'
import { FCChip, FCPressable } from '../../ui'

type Props = {
  open: boolean
  onClose: () => void
  totalVolumeMl: number
  volumeFillPct: number // 0..100
  dayColor: MenstrualColor
  onChangeDayColor: (color: MenstrualColor) => void
  padTotalMl: number
  tamponTotalMl: number
  clotTotalMl: number
  events: DailyRecordEvent[]
  eventTags: ReactNode
  fmtMl: (v: number) => string
  onAddClot: (name: '小血块' | '大血块') => void
}

export function FCVolumeSummarySheet(props: Props) {
  const {
    open,
    onClose,
    totalVolumeMl,
    volumeFillPct,
    dayColor,
    onChangeDayColor,
    padTotalMl,
    tamponTotalMl,
    clotTotalMl,
    events,
    eventTags,
    fmtMl,
    onAddClot,
  } = props

  if (!open) return null

  return (
    <View
      className="volumeSheetOverlay"
      onClick={() => {
        onClose()
      }}
    >
      <View
        className="volumeSheet fc-appear"
        onClick={(e) => {
          e.stopPropagation?.()
        }}
      >
        <View className="volumeSheetHead">
          <Text className="title">当日总血量（示意）</Text>
          <FCPressable className="volumeSheetClose" onClick={onClose}>
            <Text className="volumeSheetCloseText">×</Text>
          </FCPressable>
        </View>

        <View className="section">
          <View className="row">
            <Text className="muted">颜色（当天）</Text>
            <View className="colorDots">
              {(
                [
                  { label: '粉', value: 'pink', fill: 'rgba(210, 122, 148, 0.85)' },
                  { label: '红', value: 'red', fill: 'rgba(196, 64, 64, 0.85)' },
                  { label: '锈', value: 'rust', fill: 'rgba(168, 86, 58, 0.85)' },
                  { label: '深', value: 'dark', fill: 'rgba(110, 56, 56, 0.85)' },
                  { label: '棕', value: 'brown', fill: 'rgba(120, 86, 66, 0.85)' },
                ] as const
              ).map((c) => {
                const active = dayColor === c.value
                return (
                  <FCPressable
                    key={c.value}
                    className={['colorDot', active ? 'colorDotActive' : ''].join(' ')}
                    onClick={() => onChangeDayColor(c.value)}
                  >
                    <View className="colorDotFill" style={{ background: c.fill }} />
                    <Text className="colorDotLabel">{c.label}</Text>
                  </FCPressable>
                )
              })}
            </View>
          </View>

          <View className="row">
            <Text className="muted">卫生巾 + 棉条 + 血块（估算）</Text>
            <View className="rowRight">
              <View className="tagBtnRow">
                {(['小血块', '大血块'] as const).map((name) => (
                  <FCChip key={name} className="tagBtn" onClick={() => onAddClot(name)}>
                    ＋{name}
                  </FCChip>
                ))}
              </View>
              <Text className="muted">{fmtMl(totalVolumeMl)} mL</Text>
            </View>
          </View>

          <View className="volumeBar">
            <View className="volumeFill" style={{ width: `${Math.round(volumeFillPct)}%` }} />
          </View>

          <View className="tagsInline">{eventTags}</View>

          {events.length > 0 ? (
            <View className="volumeSheetMeta">
              <Text className="muted">
                卫生巾累计 {fmtMl(padTotalMl)}mL + 棉条累计 {fmtMl(tamponTotalMl)}mL + 血块累计 {fmtMl(clotTotalMl)}mL
              </Text>
              <Text className="muted">血块按估算值计入总血量：小血块≈2mL，大血块≈4mL。</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
