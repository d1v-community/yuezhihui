import { Text, View } from '@tarojs/components'
import type { MenstrualColor } from '../types/dailyRecord'
import './productViz.less'

export type PeriodPadType = 'liner' | 'day' | 'night' | 'pants'
export type PeriodTamponModel = 'mini' | 'regular' | 'large' | 'super'

export type FCProductVizProps = {
  kind: 'pad' | 'tampon'
  padType?: PeriodPadType
  tamponModel?: PeriodTamponModel
  // Visual-only hint; used to scale/count blots.
  volumeMl?: number
  color?: MenstrualColor | null
  label?: string
  spec?: string
  valueMl?: number
}

function clamp(n: number, a: number, b: number) {
  if (!Number.isFinite(n)) return a
  return Math.max(a, Math.min(b, n))
}

function fmtMl(v: number) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(1).replace(/\.0$/, '')
}

function colorToRgba(color?: MenstrualColor | null): { fill: string; outline: string } {
  switch (color) {
    case 'pink':
      return { fill: 'rgba(210, 122, 148, 0.55)', outline: 'rgba(170, 80, 110, 0.35)' }
    case 'red':
      return { fill: 'rgba(196, 64, 64, 0.54)', outline: 'rgba(160, 30, 30, 0.34)' }
    case 'rust':
      return { fill: 'rgba(168, 86, 58, 0.54)', outline: 'rgba(128, 62, 38, 0.32)' }
    case 'dark':
      return { fill: 'rgba(110, 56, 56, 0.52)', outline: 'rgba(84, 42, 42, 0.32)' }
    case 'brown':
      return { fill: 'rgba(120, 86, 66, 0.52)', outline: 'rgba(92, 64, 48, 0.30)' }
    default:
      return { fill: 'rgba(139, 94, 94, 0.50)', outline: 'rgba(139, 94, 94, 0.30)' }
  }
}

function hash32(str: string) {
  // FNV-1a (good enough for stable UI randomness).
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makeRng(seed: string) {
  let s = hash32(seed) || 1
  return () => {
    // xorshift32
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

type Blot = { xPct: number; yPct: number; sizePx: number; alpha: number }

// 胶囊形状类型
type Capsule = { widthPx: number; heightPx: number; alpha: number }

function computeBlots(opts: { seed: string; volumeMl: number; kind: 'pad' | 'tampon'; padType?: PeriodPadType }): Blot[] {
  const v = clamp(Number(opts.volumeMl || 0), 0, 20)
  if (v <= 0) return []

  const rng = makeRng(opts.seed)
  const centerBias = () => {
    // Average a few uniform samples to bias toward the center (smooth, stable, less edge-clinging).
    return (rng() + rng() + rng()) / 3
  }

  const isPad = opts.kind === 'pad'
  const padType = opts.padType
  const yMin = isPad && padType === 'night' ? 16 : isPad && padType === 'liner' ? 20 : 18
  const yMax = isPad && padType === 'night' ? 78 : isPad && padType === 'liner' ? 72 : 76
  const yMid = (yMin + yMax) / 2
  const ySpan = yMax - yMin

  // Smooth/stable behavior:
  // - Positions are derived only from `seed` (not volume), so dragging the slider won't "teleport" blots.
  // - As volume increases, more blots fade in gradually, instead of re-randomizing.
  const MAX_BLOTS = 10
  const V_RANGE = 12 // UI slider max is ~12mL for pads; keep staging stable in that range.
  const FADE_SPAN = 1.2 // mL span for each blot to fade/scale in

  const out: Blot[] = []

  const mainProg = clamp(v / 1.0, 0, 1)
  const mainSize = clamp(12 + v * 1.35, 12, 34)
  out.push({
    xPct: 50,
    yPct: isPad && padType === 'night' ? 46 : 48,
    sizePx: mainSize,
    alpha: 0.35 + 0.6 * mainProg,
  })

  for (let i = 1; i < MAX_BLOTS; i++) {
    // Cluster around the center instead of hugging edges.
    const x = 50 + (centerBias() - 0.5) * 32
    const y = yMid + (centerBias() - 0.5) * (ySpan * 0.72)
    const baseSize = clamp(7 + rng() * 12, 6, 22)
    const baseAlpha = clamp(0.35 + rng() * 0.55, 0.28, 0.92)

    const appearAt = (i / (MAX_BLOTS - 1)) * V_RANGE
    const prog = clamp((v - appearAt) / FADE_SPAN, 0, 1)
    if (prog <= 0) continue

    out.push({
      xPct: clamp(x, 22, 78),
      yPct: clamp(y, yMin, yMax),
      sizePx: Math.round(baseSize * (0.75 + 0.25 * prog)),
      alpha: baseAlpha * prog,
    })
  }

  return out
}

// 计算胶囊尺寸：胶囊面积和体积成正比
function computeCapsule(volumeMl: number, padType?: PeriodPadType): Capsule {
  const v = clamp(Number(volumeMl || 0), 1, 20)
  if (v <= 0) return { widthPx: 0, heightPx: 0, alpha: 0 }

  // 根据卫生巾类型确定最大面积（20mL时胶囊应该和卫生巾body重合或接近重合）
  const pad = padType || 'day'

  // 卫生巾body的尺寸（px）- 保持竖长形状
  const { width: bodyWidth, height: bodyHeight } = (() => {
    switch (pad) {
      case 'liner':
        return { width: 52, height: 92 }
      case 'night':
        return { width: 58, height: 132 }
      case 'day':
      case 'pants':
      default:
        return { width: 56, height: 114 }
    }
  })()

  // 胶囊面积与体积成正比，20mL时胶囊面积约为body的90%（留一点边距）
  const areaRatio = 0.9 // 胶囊最大面积为body的90%
  const maxCapsuleArea = bodyWidth * bodyHeight * areaRatio

  // 线性映射：1mL -> 最小面积，20mL -> 最大面积
  const minAreaRatio = 0.05 // 1mL时为最大面积的5%
  const areaProgress = clamp((v - 1) / (20 - 1), 0, 1)
  const capsuleArea = maxCapsuleArea * (minAreaRatio + (1 - minAreaRatio) * areaProgress)

  // 胶囊保持和卫生巾body相似的宽高比（竖长形）
  const aspectRatio = bodyHeight / bodyWidth // 例如 day: 114/56 ≈ 2.04
  const capsuleWidth = Math.sqrt(capsuleArea / aspectRatio)
  const capsuleHeight = capsuleWidth * aspectRatio

  // 透明度随体积增加
  const alpha = 0.3 + 0.5 * areaProgress

  return {
    widthPx: Math.round(capsuleWidth),
    heightPx: Math.round(capsuleHeight),
    alpha: alpha,
  }
}

function tamponMaxMlByModel(model: PeriodTamponModel) {
  switch (model) {
    case 'mini':
      return 8
    case 'regular':
      return 10
    case 'large':
      return 12
    case 'super':
      return 15
    default:
      return 10
  }
}

export function FCProductViz(props: FCProductVizProps) {
  const palette = colorToRgba(props.color)
  const volumeMl = Number(props.volumeMl || 0)
  const padType = props.padType || 'day'
  const model = props.tamponModel || 'regular'
  // Keep seed stable across slider changes (smooth "少 -> 多" transition).
  const seed = `${props.kind}|${padType}|${model}`

  const blots = props.kind === 'pad' ? computeBlots({ seed, volumeMl, kind: props.kind, padType }) : []
  // 计算胶囊尺寸（替代粒子动画）
  const capsule = props.kind === 'pad' ? computeCapsule(volumeMl, padType) : { widthPx: 0, heightPx: 0, alpha: 0 }
  // 卫生棉条：1mL显示10%血迹，20mL显示100%血迹
  const wetPct =
    props.kind === 'tampon' ? clamp(10 + (volumeMl - 1) / (20 - 1) * 90, 0, 100) : 0

  const cls = [
    'fcProdViz',
    props.kind === 'pad' ? `fcProdVizPadType${padType[0].toUpperCase()}${padType.slice(1)}` : '',
    props.kind === 'tampon' ? `fcProdVizTamponModel${model[0].toUpperCase()}${model.slice(1)}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const label = [props.label, props.spec].filter(Boolean).join(' · ')

  return (
    <View className={cls}>
      {typeof props.valueMl === 'number' ? (
        <Text className="fcProdVizValue">累计 {fmtMl(props.valueMl)}mL</Text>
      ) : null}
      <View className="fcProdVizStage">
        {props.kind === 'pad' ? (
          <View className="fcProdVizShape">
            <View className="fcProdVizPadWing fcProdVizPadWingLeft" />
            <View className="fcProdVizPadWing fcProdVizPadWingRight" />
            <View className="fcProdVizPadBody">
              <View className="fcProdVizPadCore" />
            </View>
            {padType === 'pants' ? (
              <View className="fcProdVizPants">
                <View className="fcProdVizPantsBand" />
                <View className="fcProdVizPantsLeg fcProdVizPantsLegLeft" />
                <View className="fcProdVizPantsLeg fcProdVizPantsLegRight" />
              </View>
            ) : null}
          </View>
        ) : (
          <View className="fcProdVizShape">
            <View className="fcProdVizTampon">
              <View className="fcProdVizTamponBody">
                {wetPct > 0 ? (
                  <View className="fcProdVizTamponWet" style={{ height: `${wetPct}%`, background: palette.fill }}>
                    <View className="fcProdVizTamponWetEdge" style={{ background: palette.outline }} />
                  </View>
                ) : null}
              </View>
              <View className="fcProdVizTamponGrip" />
              <View className="fcProdVizTamponString" />
            </View>
          </View>
        )}

        {props.kind === 'pad'
          ? // 渲染胶囊形状（替代粒子动画）
            capsule.widthPx > 0 && capsule.heightPx > 0 ? (
              <View
                className="fcProdVizCapsule"
                style={{
                  width: `${capsule.widthPx}px`,
                  height: `${capsule.heightPx}px`,
                  background: palette.fill,
                  border: `1px solid ${palette.outline}`,
                  opacity: capsule.alpha,
                }}
              />
            ) : null
          : null}
      </View>

      {label ? <Text className="fcProdVizLabel">{label}</Text> : null}
    </View>
  )
}
