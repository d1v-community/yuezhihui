import { Text, View } from '@tarojs/components'
import type { MenstrualColor } from '../types/dailyRecord'
import './volumeVial.less'

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function colorToRgba(color?: MenstrualColor | null): { fill: string; line: string } {
  switch (color) {
    case 'pink':
      return { fill: 'rgba(210, 122, 148, 0.55)', line: 'rgba(170, 80, 110, 0.70)' }
    case 'red':
      return { fill: 'rgba(196, 64, 64, 0.52)', line: 'rgba(160, 30, 30, 0.72)' }
    case 'rust':
      return { fill: 'rgba(168, 86, 58, 0.52)', line: 'rgba(128, 62, 38, 0.72)' }
    case 'dark':
      return { fill: 'rgba(110, 56, 56, 0.50)', line: 'rgba(84, 42, 42, 0.72)' }
    case 'brown':
      return { fill: 'rgba(120, 86, 66, 0.52)', line: 'rgba(92, 64, 48, 0.72)' }
    default:
      return { fill: 'rgba(139, 94, 94, 0.50)', line: 'rgba(139, 94, 94, 0.72)' }
  }
}

export type FCVolumeVialProps = {
  volumeMl: number
  hasData?: boolean
  active?: boolean
  loading?: boolean
  color?: MenstrualColor | null
  maxMl?: number
}

export function FCVolumeVial(props: FCVolumeVialProps) {
  const maxMl = typeof props.maxMl === 'number' && props.maxMl > 0 ? props.maxMl : 40
  const ratio = clamp01(Number(props.volumeMl || 0) / maxMl)

  // Ensure "has volume" is always visible even when ratio is tiny.
  const fillPct = ratio <= 0 ? 0 : Math.max(0.12, ratio) * 100
  const palette = colorToRgba(props.color)

  const cls = [
    'fcVial',
    props.active ? 'fcVialActive' : '',
    props.hasData ? 'fcVialHasData' : '',
    props.loading ? 'fcVialLoading' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View className={cls}>
      <View className="fcVialTube">
        {fillPct > 0 ? (
          <>
            <View className="fcVialFill" style={{ height: `${fillPct}%`, background: palette.fill }}>
              <View className="fcVialMeniscus" style={{ background: palette.line }} />
            </View>
          </>
        ) : null}
      </View>
      {/* Accessibility-ish hint for H5; weapp won't read it but it is harmless. */}
      <Text className="fcVialSr">{Number(props.volumeMl || 0)} mL</Text>
    </View>
  )
}
