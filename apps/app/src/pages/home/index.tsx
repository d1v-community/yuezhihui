import { useEffect, useMemo, useRef, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Picker } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageJson, getStorageString, setStorageString } from '../../storage/storage'
import { loadDailyRecord, saveDailyRecordDraft, submitDailyRecord } from '../../services/dailyRecordRepo'
import type { DailyRecord, DailyRecordEvent, MenstrualColor } from '../../types/dailyRecord'
import { addDaysYmd, clampYmd, todayYmd } from '../../utils/date'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { getMenstrualDailyRange } from '../../services/menstrual'
import { FCActionBar, FCButton, FCChip, FCNotice, FCPressable, FCProductViz, FCScaleBar, FCTabBar, FCVolumeVial } from '../../ui'
import { FCVolumeSummarySheet } from './volumeSummarySheet'
import './index.less'

type InputMode = 'click' | 'drag'

type InputModeSettings = {
  sanitaryPad: InputMode
  tampon: InputMode
}

const DEFAULT_INPUT_MODE: InputModeSettings = {
  sanitaryPad: 'click',
  tampon: 'click',
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function loadInputMode(): InputModeSettings {
  const v = getStorageJson<Partial<InputModeSettings>>(STORAGE_KEYS.inputModeSettings)
  return {
    sanitaryPad: (v?.sanitaryPad === 'click' || v?.sanitaryPad === 'drag') ? v.sanitaryPad : DEFAULT_INPUT_MODE.sanitaryPad,
    tampon: (v?.tampon === 'click' || v?.tampon === 'drag') ? v.tampon : DEFAULT_INPUT_MODE.tampon,
  }
}

function splitVolumeMl(events: DailyRecordEvent[]) {
  const CLOT_SMALL_ML = 2
  const CLOT_LARGE_ML = 4
  return events.reduce(
    (acc, e) => {
      if (e.eventType === 'pad') {
        acc.padMl += Number(e.volumeMl || 0)
        return acc
      }
      if (e.eventType === 'tampon') {
        acc.tamponMl += Number(e.volumeMl || 0)
        return acc
      }
      if (e.eventType === 'symptom') {
        if (e.symptomName === '小血块') acc.clotMl += CLOT_SMALL_ML
        if (e.symptomName === '大血块') acc.clotMl += CLOT_LARGE_ML
        return acc
      }
      return acc
    },
    { padMl: 0, tamponMl: 0, clotMl: 0 }
  )
}

function deriveDayColor(events: DailyRecordEvent[]): MenstrualColor | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const c = events[i]?.color
    if (c) return c
  }
  return null
}

function minYmd(a: string, b: string) {
  return a <= b ? a : b
}

function maxYmd(a: string, b: string) {
  return a >= b ? a : b
}

function formatEventLabel(e: DailyRecordEvent) {
  if (e.eventType === 'symptom') return `症状·${e.symptomName || '未命名'}`
  const who = e.eventType === 'pad' ? '巾' : '棉条'
  const parts: string[] = [who]
  if (e.productType) parts.push(e.productType)
  if (e.model) parts.push(e.model)
  if (e.color) {
    const map: Record<string, string> = { pink: '粉', red: '红', rust: '锈红', dark: '深红', brown: '棕' }
    parts.push(map[e.color] || e.color)
  }
  if (typeof e.volumeMl === 'number') parts.push(`${e.volumeMl}mL`)
  return parts.join('·')
}

const PAD_TYPES = [
  { label: '护垫', value: 'liner' },
  { label: '日用', value: 'day' },
  { label: '夜用', value: 'night' },
  { label: '安睡裤', value: 'pants' },
]

const TAMPON_MODELS = [
  { label: '迷你', value: 'mini' },
  { label: '常规', value: 'regular' },
  { label: '大号', value: 'large' },
  { label: '超大', value: 'super' },
]

const PAD_TYPE_SPECS: Record<string, string> = {
  liner: '≈155mm',
  day: '≈240mm',
  night: '≈290-420mm',
  pants: '尺码',
}

const TAMPON_MODEL_SPECS: Record<string, string> = {
  mini: '≈6-9g',
  regular: '≈6-9g',
  large: '≈9-12g',
  super: '≈12-15g',
}

function fmtMl(v: number) {
  // Keep UI stable when using decimal steps.
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '0'
}

const STRIP_DAYS = 14
const STRIP_CENTER_IDX = 6 // 0-based

export default function HomePage() {
  const today = todayYmd()
  const minDate = addDaysYmd(today, -180)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeWindow, setRangeWindow] = useState<{ start: string; end: string } | null>(null)
  const [rangeMap, setRangeMap] = useState<
    Record<string, { hasBleeding: boolean; totalVolumeMl: number; dayColor: MenstrualColor | null }>
  >({})

  const [selectedDate, setSelectedDate] = useState(today)
  const [submittedAt, setSubmittedAt] = useState<number | null>(null)
  const [record, setRecord] = useState<DailyRecord>({ date: today, hasBleeding: false, events: [] })
  const [snapshot, setSnapshot] = useState('')

  const [stripStart, setStripStart] = useState(() => addDaysYmd(today, -(STRIP_DAYS - 1)))

  const [padTypeIndex, setPadTypeIndex] = useState(1)
  const [tamponModelIndex, setTamponModelIndex] = useState(1)
  const [dayColor, setDayColor] = useState<MenstrualColor>('red')
  const [padVolumeMl, setPadVolumeMl] = useState(5)
  const [tamponVolumeMl, setTamponVolumeMl] = useState(5)
  const [inputMode, setInputMode] = useState<InputModeSettings>(DEFAULT_INPUT_MODE)
  const [volumeSheetOpen, setVolumeSheetOpen] = useState(false)

  const tamponMaxMl = useMemo(() => {
    const model = TAMPON_MODELS[tamponModelIndex]?.value
    if (model === 'mini') return 8
    if (model === 'regular') return 10
    if (model === 'large') return 12
    if (model === 'super') return 15
    return 10
  }, [tamponModelIndex])

  const dirty = useMemo(() => JSON.stringify(record) !== snapshot, [record, snapshot])
  const vols = useMemo(() => splitVolumeMl(record.events), [record.events])
  const padTotalMl = vols.padMl
  const tamponTotalMl = vols.tamponMl
  const clotTotalMl = vols.clotMl
  const totalVolume = padTotalMl + tamponTotalMl + clotTotalMl
  const hasAnyData = record.events.length > 0
  const derivedHasBleeding = totalVolume > 0
  const hasSubmitted = submittedAt != null
  const volumeFill = useMemo(() => {
    // UI-only: map "today volume" to a soft progress fill.
    const max = 40
    return Math.max(0, Math.min(1, totalVolume / max))
  }, [totalVolume])
  const volumeFillPct = volumeFill * 100

  useEffect(() => {
    setInputMode(loadInputMode())
  }, [])

  useEffect(() => {
    // Avoid leaving the sheet open when switching dates.
    setVolumeSheetOpen(false)
  }, [selectedDate])

  useEffect(() => {
    // If the day becomes "empty", close the sheet (its entry icon is also hidden).
    if (totalVolume <= 0 && volumeSheetOpen) setVolumeSheetOpen(false)
  }, [totalVolume, volumeSheetOpen])

  const editingRef = useRef<{
    date: string
    hasAnyData: boolean
    derivedHasBleeding: boolean
    totalVolume: number
    dayColor: MenstrualColor
  }>({
    date: record.date,
    hasAnyData,
    derivedHasBleeding,
    totalVolume,
    dayColor,
  })
  editingRef.current = { date: record.date, hasAnyData, derivedHasBleeding, totalVolume, dayColor }

  const stripEnd = useMemo(() => addDaysYmd(stripStart, STRIP_DAYS - 1), [stripStart])
  const stripDays = useMemo(() => Array.from({ length: STRIP_DAYS }, (_, i) => addDaysYmd(stripStart, i)), [stripStart])
  const stripIncludes = (d: string) => d >= stripStart && d <= stripEnd
  const reanchorStripTo = (d: string) => {
    const clamped = clampYmd(d, minDate, today)
    let start = addDaysYmd(clamped, -STRIP_CENTER_IDX)
    // Ensure window doesn't exceed [minDate..today] while still keeping 14 days when possible.
    if (addDaysYmd(start, STRIP_DAYS - 1) > today) start = addDaysYmd(today, -(STRIP_DAYS - 1))
    if (start < minDate) start = minDate
    return start
  }

  const fetchRange = async (start: string, end: string) => {
    setRangeLoading(true)
    try {
      const list = await getMenstrualDailyRange(start, end)
      setRangeMap((prev) => {
        const next = { ...prev }
        for (const it of list) {
          next[it.date] = {
            hasBleeding: Boolean(it.hasBleeding),
            totalVolumeMl: Number(it.totalVolumeMl || 0),
            dayColor: (it.dayColor as any) ?? null,
          }
        }

        // Apply local override for the day being edited (keeps UI realtime without waiting for submit).
        const ed = editingRef.current
        if (ed?.date) {
          if (!ed.hasAnyData) {
            delete next[ed.date]
          } else {
            const prevMeta = next[ed.date]
            next[ed.date] = {
              hasBleeding: ed.derivedHasBleeding,
              totalVolumeMl: ed.totalVolume,
              dayColor: ed.dayColor ?? prevMeta?.dayColor ?? null,
            }
          }
        }
        return next
      })
    } catch {
      // ignore; UI can still navigate by date picker and local state
    } finally {
      setRangeLoading(false)
    }
  }

  const ensureRangeCovers = async (date: string) => {
    const d = clampYmd(date, minDate, today)
    const reqStart = clampYmd(addDaysYmd(d, -30), minDate, today)
    const reqEnd = clampYmd(addDaysYmd(d, 30), minDate, today)

    const nextStart = rangeWindow ? minYmd(rangeWindow.start, reqStart) : reqStart
    const nextEnd = rangeWindow ? maxYmd(rangeWindow.end, reqEnd) : reqEnd

    if (rangeWindow && nextStart === rangeWindow.start && nextEnd === rangeWindow.end) return
    setRangeWindow({ start: nextStart, end: nextEnd })
    await fetchRange(nextStart, nextEnd)
  }

  const loadForDate = async (date: string) => {
    setLoading(true)
    try {
      // Update header immediately; UI shows a local loading mask while data is fetched.
      setSelectedDate(date)
      setRecord({ date, hasBleeding: false, events: [] })
      // Reset input controls for the new day (default should be 5mL).
      setPadVolumeMl(5)
      setTamponVolumeMl(5)
      setDayColor('red')
      const stored = await loadDailyRecord(date)
      setSubmittedAt(stored.submittedAt)
      setRecord(stored.record)
      setSnapshot(JSON.stringify(stored.record))
      setDayColor(deriveDayColor(stored.record.events) || 'red')
    } finally {
      setLoading(false)
    }
    void ensureRangeCovers(date)
  }

  useLoad(() => {
    ; (async () => {
      const ok = await ensureAuthedAndOnboardedOrRedirect()
      if (!ok) return

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      const anchor = getStorageString(STORAGE_KEYS.onboardingAnchorDate) || today
      const initial = firstCompletedAt ? today : clampYmd(anchor, minDate, today)
      setStripStart(reanchorStripTo(initial))
      await loadForDate(initial)

      // First-time guidance (show once): align with USER_FLOW_MINIPROGRAM_DAILY.
      const guideShown = getStorageString(STORAGE_KEYS.dailyFirstGuideShown)
      if (!firstCompletedAt && !guideShown && initial === clampYmd(anchor, minDate, today)) {
        setStorageString(STORAGE_KEYS.dailyFirstGuideShown, '1')
        await Taro.showModal({
          title: '首次按日记录',
          content: '已为你定位到上次月经开始日，请先补全这一天的记录。',
          showCancel: false,
          confirmText: '开始记录',
        })
      }
    })()
  })

  useEffect(() => {
    // Draft autosave (local mock)
    if (!record?.date) return
    void saveDailyRecordDraft({ record, submittedAt })
  }, [record, submittedAt])

  useEffect(() => {
    // Keep the calendar overview in sync while editing (without waiting for submit).
    if (loading) return
    const date = record?.date
    if (!date) return
    setRangeMap((prev) => {
      const next = { ...prev }
      if (!hasAnyData) {
        delete next[date]
        return next
      }
      const prevMeta = prev[date]
      next[date] = {
        hasBleeding: derivedHasBleeding,
        totalVolumeMl: totalVolume,
        dayColor: prevMeta?.dayColor ?? null,
      }
      return next
    })
  }, [record?.date, hasAnyData, derivedHasBleeding, totalVolume, loading])

  const confirmDiscardIfDirty = async () => {
    if (!dirty) return true
    const res = await Taro.showModal({
      title: '放弃修改？',
      content: '当前修改未提交，切换日期将放弃这些改动。',
      confirmText: '放弃',
      cancelText: '继续编辑',
    })
    return Boolean(res.confirm)
  }

  const touchRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 })
  const onSwipeStart = (e: any) => {
    const p = e?.touches?.[0]
    if (!p) return
    touchRef.current = { x: Number(p.pageX || 0), y: Number(p.pageY || 0), t: Date.now() }
  }
  const onSwipeEnd = (e: any) => {
    if (loading) return
    const p = e?.changedTouches?.[0]
    if (!p) return
    const dx = Number(p.pageX || 0) - touchRef.current.x
    const dy = Number(p.pageY || 0) - touchRef.current.y
    const dt = Date.now() - touchRef.current.t

    // Gesture filter: quick-ish horizontal swipe only.
    if (dt > 650) return
    if (Math.abs(dx) < 45) return
    if (Math.abs(dy) > 30) return
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return

    const dir = dx < 0 ? 1 : -1
    if (dir > 0 && selectedDate >= stripEnd) {
      Taro.showToast({ title: '已到最晚日期', icon: 'none' })
      return
    }
    if (dir < 0 && selectedDate <= stripStart) {
      Taro.showToast({ title: '已到最早日期', icon: 'none' })
      return
    }

    void selectDate(addDaysYmd(selectedDate, dir))
  }

  const selectDate = async (nextDate: string) => {
    const clamped = clampYmd(nextDate, minDate, today)
    if (clamped === selectedDate) return
    const ok = await confirmDiscardIfDirty()
    if (!ok) return
    await loadForDate(clamped)
  }

  const selectDateWithReanchor = async (nextDate: string) => {
    const clamped = clampYmd(nextDate, minDate, today)
    if (clamped === selectedDate) return
    const ok = await confirmDiscardIfDirty()
    if (!ok) return

    if (!stripIncludes(clamped)) {
      const res = await Taro.showModal({
        title: '跳转日期',
        content: '所选日期不在当前顶部 14 天范围内，将刷新顶部日期范围以包含该日。',
        confirmText: '继续',
        cancelText: '取消',
      })
      if (!res.confirm) return
      setStripStart(reanchorStripTo(clamped))
    }

    await loadForDate(clamped)
  }

  const addEvent = (e: Omit<DailyRecordEvent, 'id'>) => {
    // Color is a day-level attribute; default is 'red'. If caller doesn't specify a color,
    // use the current day color so users don't have to pick a color for every pad/tampon.
    const ev: DailyRecordEvent = { ...e, color: e.color ?? dayColor, id: uid() }
    setRecord((prev) => ({ ...prev, events: [...prev.events, ev] }))
  }

  const removeEvent = (id: string) => {
    setRecord((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
  }

  const applyDayColor = (next: MenstrualColor) => {
    if (!next || next === dayColor) return
    setDayColor(next)
    // Make the change immediately visible on product viz + calendar vial by applying to events.
    setRecord((prev) => ({ ...prev, events: prev.events.map((e) => ({ ...e, color: next })) }))
    // Keep the 14-day strip in sync even before submit.
    setRangeMap((prev) => {
      if (!hasAnyData) return prev
      return {
        ...prev,
        [selectedDate]: {
          hasBleeding: derivedHasBleeding,
          totalVolumeMl: totalVolume,
          dayColor: next,
        },
      }
    })
  }

  const submit = async () => {
    if (hasSubmitted && !dirty) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      const normalized: DailyRecord = { ...record, hasBleeding: derivedHasBleeding }
      const stored = await submitDailyRecord(normalized)
      setRecord(normalized)
      setSnapshot(JSON.stringify(normalized))
      const wasSubmitted = hasSubmitted
      setSubmittedAt(stored.submittedAt)

      // Update overview map for the current day (best-effort).
      setRangeMap((prev) => {
        const prevMeta = prev[normalized.date]
        return {
          ...prev,
          [normalized.date]: {
            hasBleeding: normalized.hasBleeding,
            totalVolumeMl: totalVolume,
            dayColor: deriveDayColor(normalized.events) ?? prevMeta?.dayColor ?? null,
          },
        }
      })

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      if (!firstCompletedAt) {
        setStorageString(STORAGE_KEYS.dailyFirstCompletedAt, String(Date.now()))
      }

      Taro.showToast({ title: wasSubmitted ? '已更新' : '提交成功', icon: 'none' })
    } catch {
      setSubmitError(true)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const visibility = getStorageJson<{ sanitaryPad?: boolean; tampon?: boolean; bleeding?: boolean }>(STORAGE_KEYS.visibilitySettings) || {}
  const showPad = typeof visibility.sanitaryPad === 'boolean' ? visibility.sanitaryPad : true
  const showTampon = typeof visibility.tampon === 'boolean' ? visibility.tampon : true

  const recentDays = stripDays

  const eventTags =
    record.events.length === 0 ? (
      <Text className="muted">今天的身体还没有被记录。</Text>
    ) : (
      <View className="tagRow">
        {record.events.map((e) => (
          <View key={e.id} className="tag">
            <Text className="tagText">{formatEventLabel(e)}</Text>
            <View className="tagDel" onClick={() => removeEvent(e.id)}>
              <Text>×</Text>
            </View>
          </View>
        ))}
      </View>
    )

  return (
    <View className="page">
      <View className="wrap">
        <View className="card fc-appear">
          <View className="row headerRow">
            <View className="headerLeft">
              <Text className="title">按日记录</Text>
              <View className="headerStatusIcons">
                {totalVolume > 0 ? (
                  <FCPressable
                    className={['statusIcon', 'statusIconOn', 'volumeSheetIcon'].join(' ')}
                    onClick={() => {
                      if (loading) return
                      setVolumeSheetOpen(true)
                    }}
                  >
                    <Text className="statusIconText">≋</Text>
                  </FCPressable>
                ) : null}
                <FCPressable
                  className={['statusIcon', hasSubmitted ? 'statusIconOn' : ''].join(' ')}
                  onClick={() => Taro.showToast({ title: hasSubmitted ? '该日已保存' : '该日未提交', icon: 'none' })}
                >
                  <Text className="statusIconText">{hasSubmitted ? '✓' : '○'}</Text>
                </FCPressable>
                <FCPressable
                  className={['statusIcon', dirty ? 'statusIconOn' : ''].join(' ')}
                  onClick={() => Taro.showToast({ title: dirty ? '有未提交改动' : '未检测到改动', icon: 'none' })}
                >
                  <Text className="statusIconText">{dirty ? '✎' : '—'}</Text>
                </FCPressable>
                {submitting ? (
                  <View className="statusSpin">
                    <View className="fc-spinner fc-spinnerDark" />
                  </View>
                ) : null}
              </View>
            </View>

            <View className="headerRight">
              <Picker
                mode="date"
                value={selectedDate}
                start={minDate}
                end={today}
                className="datePicker"
                onChange={(e) => {
                  if (loading) return
                  void selectDateWithReanchor(String(e.detail.value))
                }}
              >
                <FCChip className="dateChip">{selectedDate}</FCChip>
              </Picker>

              <FCPressable className="headerGear" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                <Text className="headerGearText">⚙</Text>
              </FCPressable>
            </View>
          </View>

          <View className="calendarStrip">
            <View className="calendarInner calendarInner14">
              {recentDays.map((d) => {
                const meta = rangeMap[d]
                const isActive = d === selectedDate
                const liveHasData = isActive ? record.events.length > 0 : Boolean(meta)
                const liveTotalMl = isActive ? totalVolume : meta?.totalVolumeMl ?? 0
                const liveColor = isActive ? dayColor : meta?.dayColor ?? null
                const dayText = d.slice(8, 10)
                return (
                  <FCPressable
                    key={d}
                    className={['calDay', 'calDay14', isActive ? 'calDayActive' : ''].join(' ')}
                    onClick={() => {
                      if (loading) return
                      void selectDate(d)
                    }}
                    onLongPress={() => {
                      if (!isActive && rangeLoading && !meta) {
                        Taro.showToast({ title: '正在加载…', icon: 'none' })
                        return
                      }
                      if (!liveHasData) {
                        Taro.showToast({ title: `${d} 无记录`, icon: 'none' })
                        return
                      }
                      Taro.showToast({ title: `${d} · ${fmtMl(liveTotalMl)}mL`, icon: 'none' })
                    }}
                  >
                    <Text className={['calDayText', isActive ? 'calDayTextActive' : ''].join(' ')}>{dayText}</Text>
                    <FCVolumeVial
                      volumeMl={liveTotalMl}
                      hasData={liveHasData}
                      active={isActive}
                      loading={Boolean(!isActive && rangeLoading && !meta)}
                      color={liveColor}
                      maxMl={40}
                    />
                  </FCPressable>
                )
              })}
            </View>
          </View>

          <View className="divider" />

          <View className="recordBody" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd} onTouchCancel={onSwipeEnd}>
            {loading ? (
              <View className="loadingMask">
                <View className="loadingBox">
                  <View className="fc-spinner fc-spinnerDark" />
                  <Text className="loadingText">正在加载 {selectedDate} 的记录…</Text>
                  <Text className="loadingSub">如果长时间无响应，请检查网络后重试。</Text>
                </View>
              </View>
            ) : null}

            {showPad ? (
              <View className="section">
                <View className="sectionHeadRow">
                  <View className="sectionTitleRow">
                    <Text className="title">卫生巾</Text>
                    <Text className="sectionTotal">累计 {fmtMl(padTotalMl)}mL</Text>
                  </View>
                  <View className="segRow">
                    {PAD_TYPES.map((x, idx) => (
                      <FCChip
                        key={x.value}
                        className="segChip"
                        active={padTypeIndex === idx}
                        onClick={() => setPadTypeIndex(idx)}
                      >
                        {x.label}
                      </FCChip>
                    ))}
                  </View>
                </View>
                <View className="controlSplitRow">
                  <View className="controlViz">
                    <FCProductViz
                      kind="pad"
                      padType={PAD_TYPES[padTypeIndex]?.value as any}
                      volumeMl={padVolumeMl}
                      color={dayColor}
                      label={PAD_TYPES[padTypeIndex]?.label}
                      spec={PAD_TYPE_SPECS[PAD_TYPES[padTypeIndex]?.value] || ''}
                    />
                  </View>

                  <View className="controlPanel">
                    {inputMode.sanitaryPad === 'drag' ? (
                      <>
                        <View className="scaleRow">
                          <View className="scaleBarWrap">
                            <FCScaleBar
                              min={1}
                              max={20}
                              step={0.1}
                              value={padVolumeMl}
                              onChange={setPadVolumeMl}
                              ticks={[
                                { value: 3, label: '少' },
                                { value: 6, label: '中' },
                                { value: 10, label: '多' },
                              ]}
                            />
                          </View>
                        </View>
                        <View className="scaleAddRow">
                          {padVolumeMl > 0 ? <Text className="scaleMlText">{fmtMl(padVolumeMl)} mL</Text> : null}
                          <FCButton
                            size="sm"
                            disabled={padVolumeMl <= 0}
                            onClick={() => {
                              addEvent({
                                eventTime: new Date().toISOString(),
                                eventType: 'pad',
                                productType: PAD_TYPES[padTypeIndex]?.value,
                                color: dayColor,
                                volumeMl: padVolumeMl,
                              })
                            }}
                          >
                            添加/片
                          </FCButton>
                        </View>
                      </>
                    ) : (
                      <View className="clickCardsRow">
                        {[1, 5, 20].map((ml) => (
                          <View
                            key={ml}
                            className="clickCard"
                            onClick={() => {
                              addEvent({
                                eventTime: new Date().toISOString(),
                                eventType: 'pad',
                                productType: PAD_TYPES[padTypeIndex]?.value,
                                color: dayColor,
                                volumeMl: ml,
                              })
                              Taro.showToast({
                                title: `已添加 ${ml}mL`,
                                icon: 'none',
                              })
                            }}
                          >
                            <Text className="clickCardMl">{ml}mL</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : null}

            <View className="divider" />

            {showTampon ? (
              <View className="section">
                <View className="sectionHeadRow">
                  <View className="sectionTitleRow">
                    <Text className="title">卫生棉条</Text>
                    <Text className="sectionTotal">累计 {fmtMl(tamponTotalMl)}mL</Text>
                  </View>
                  <View className="segRow">
                    {TAMPON_MODELS.map((x, idx) => (
                      <FCChip
                        key={x.value}
                        className="segChip"
                        active={tamponModelIndex === idx}
                        onClick={() => setTamponModelIndex(idx)}
                      >
                        {x.label}
                      </FCChip>
                    ))}
                  </View>
                </View>
                <View className="controlSplitRow">
                  <View className="controlViz">
                    <FCProductViz
                      kind="tampon"
                      tamponModel={TAMPON_MODELS[tamponModelIndex]?.value as any}
                      volumeMl={tamponVolumeMl}
                      color={dayColor}
                      label={TAMPON_MODELS[tamponModelIndex]?.label}
                      spec={TAMPON_MODEL_SPECS[TAMPON_MODELS[tamponModelIndex]?.value] || ''}
                    />
                  </View>

                  <View className="controlPanel">
                    {inputMode.tampon === 'drag' ? (
                      <>
                        <View className="scaleRow">
                          <View className="scaleBarWrap">
                            <FCScaleBar
                              min={1}
                              max={20}
                              step={0.1}
                              value={tamponVolumeMl}
                              onChange={setTamponVolumeMl}
                              ticks={[
                                { value: 3, label: '少' },
                                { value: 6, label: '中' },
                                { value: 10, label: '多' },
                              ]}
                            />
                          </View>
                        </View>
                        <View className="scaleAddRow">
                          {tamponVolumeMl > 0 ? <Text className="scaleMlText">{fmtMl(tamponVolumeMl)} mL</Text> : null}
                          <FCButton
                            size="sm"
                            disabled={tamponVolumeMl <= 0}
                            onClick={() => {
                              addEvent({
                                eventTime: new Date().toISOString(),
                                eventType: 'tampon',
                                model: TAMPON_MODELS[tamponModelIndex]?.value,
                                color: dayColor,
                                volumeMl: tamponVolumeMl,
                              })
                            }}
                          >
                            添加/条
                          </FCButton>
                        </View>
                      </>
                    ) : (
                      <View className="clickCardsRow">
                        {[1, 5, 20].map((ml) => (
                          <View
                            key={ml}
                            className="clickCard"
                            onClick={() => {
                              addEvent({
                                eventTime: new Date().toISOString(),
                                eventType: 'tampon',
                                model: TAMPON_MODELS[tamponModelIndex]?.value,
                                color: dayColor,
                                volumeMl: ml,
                              })
                              Taro.showToast({
                                title: `已添加 ${ml}mL`,
                                icon: 'none',
                              })
                            }}
                          >
                            <Text className="clickCardMl">{ml}mL</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : null}

          </View>
        </View>

        <FCActionBar>
          {submitError ? (
            <FCNotice
              variant="warn"
              title="数据暂时无法保存，但你的记录还在"
              desc="请检查网络后重试；你可以继续添加事件，不会丢失当前页面的内容。"
              style={{ marginBottom: 10 }}
            />
          ) : null}
          <FCButton
            loading={submitting}
            disabled={loading || (hasSubmitted && !dirty)}
            fullWidth
            onClick={() => void submit()}
          >
            {submitting ? '保存中…' : hasSubmitted ? (dirty ? '↻ 更新' : '✓ 已保存') : '↑ 提交'}
          </FCButton>
          <FCTabBar />
        </FCActionBar>
      </View>

      <FCVolumeSummarySheet
        open={volumeSheetOpen}
        onClose={() => setVolumeSheetOpen(false)}
        dayColor={dayColor}
        onChangeDayColor={applyDayColor}
        totalVolumeMl={totalVolume}
        volumeFillPct={volumeFillPct}
        padTotalMl={padTotalMl}
        tamponTotalMl={tamponTotalMl}
        clotTotalMl={clotTotalMl}
        events={record.events}
        eventTags={eventTags}
        fmtMl={fmtMl}
        onAddClot={(name) =>
          addEvent({ eventTime: new Date().toISOString(), eventType: 'symptom', symptomName: name })
        }
      />
    </View>
  )
}
