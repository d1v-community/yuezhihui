import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { useMemo, useRef } from 'react'
import './scaleBar.less'

export type FCScaleBarTick = { value: number; label: string }

export type FCScaleBarProps = {
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  ticks?: FCScaleBarTick[]
}

function clamp(n: number, a: number, b: number) {
  if (!Number.isFinite(n)) return a
  return Math.max(a, Math.min(b, n))
}

function quantize(v: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) return v
  return Math.round(v / step) * step
}

function pickClientX(e: any): number | null {
  const t = e?.touches?.[0] ?? e?.changedTouches?.[0]
  const x = t?.clientX ?? t?.pageX ?? e?.clientX ?? e?.pageX ?? e?.detail?.x ?? e?.detail?.clientX
  return typeof x === 'number' ? x : null
}

export function FCScaleBar(props: FCScaleBarProps) {
  const step = typeof props.step === 'number' && props.step > 0 ? props.step : 1
  const min = Number(props.min || 0)
  const max = Number(props.max || 0)
  const value = clamp(Number(props.value || 0), min, max)

  const trackId = useMemo(() => `fcScaleTrack_${Math.random().toString(16).slice(2)}`, [])
  const rectRef = useRef<{ left: number; width: number } | null>(null)
  const movingRef = useRef(false)

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  const measure = async () => {
    // In weapp this is async; in H5 it also works.
    return new Promise<{ left: number; width: number } | null>((resolve) => {
      try {
        const q = Taro.createSelectorQuery()
        q.select(`#${trackId}`)
          .boundingClientRect()
          .exec((res) => {
            const r = res?.[0]
            if (!r || !Number.isFinite(r.left) || !Number.isFinite(r.width) || r.width <= 0) return resolve(null)
            resolve({ left: r.left, width: r.width })
          })
      } catch {
        resolve(null)
      }
    })
  }

  const setFromEvent = async (e: any) => {
    const x = pickClientX(e)
    if (x == null) return

    let rect = rectRef.current
    if (!rect) {
      rect = await measure()
      if (rect) rectRef.current = rect
    }
    if (!rect) return

    const ratio = clamp((x - rect.left) / rect.width, 0, 1)
    let next = min + ratio * (max - min)
    next = clamp(quantize(next, step), min, max)
    if (next !== value) props.onChange(next)
  }

  const tickNodes = (props.ticks || []).map((t) => {
    const p = max > min ? clamp(((t.value - min) / (max - min)) * 100, 0, 100) : 0
    return (
      <View key={String(t.value)} className="fcScaleTickWrap" style={{ left: `${p}%` }}>
        <View className="fcScaleTick" />
        <Text className="fcScaleTickLabel">{t.label}</Text>
      </View>
    )
  })

  return (
    <View
      className="fcScaleBar"
      onClick={async (e) => {
        await setFromEvent(e)
      }}
      onTouchStart={async (e) => {
        movingRef.current = true
        await setFromEvent(e)
      }}
      onTouchMove={async (e) => {
        if (!movingRef.current) return
        await setFromEvent(e)
      }}
      onTouchEnd={() => {
        movingRef.current = false
      }}
      onTouchCancel={() => {
        movingRef.current = false
      }}
    >
      <View className="fcScaleTrackWrap">
        <View id={trackId} className="fcScaleTrack">
          <View className="fcScaleFill" style={{ width: `${pct}%` }} />
        </View>
        <View className="fcScaleThumb" style={{ left: `${pct}%` }} />
        {tickNodes}
      </View>
    </View>
  )
}
