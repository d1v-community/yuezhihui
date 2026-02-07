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
import { FCActionBar, FCButton, FCChip, FCNotice, FCPressable, FCTabBar, FCVolumeVial } from '../../ui'
import './index.less'

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function sumVolumeMl(events: DailyRecordEvent[]) {
  return events.reduce((s, e) => s + (e.eventType === 'pad' || e.eventType === 'tampon' ? e.volumeMl || 0 : 0), 0)
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

const COLORS: Array<{ label: string; value: MenstrualColor }> = [
  { label: '粉', value: 'pink' },
  { label: '红', value: 'red' },
  { label: '锈红', value: 'rust' },
  { label: '深红', value: 'dark' },
  { label: '棕', value: 'brown' },
]

const VOLUMES = [
  { label: '少（3mL）', value: 3 },
  { label: '中（6mL）', value: 6 },
  { label: '多（10mL）', value: 10 },
]

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
  const [colorIndex, setColorIndex] = useState(1)
  const [volumeIndex, setVolumeIndex] = useState(1)

  const dirty = useMemo(() => JSON.stringify(record) !== snapshot, [record, snapshot])
  const totalVolume = useMemo(() => sumVolumeMl(record.events), [record.events])
  const hasAnyData = record.events.length > 0
  const derivedHasBleeding = totalVolume > 0
  const hasSubmitted = submittedAt != null
  const volumeFill = useMemo(() => {
    // UI-only: map "today volume" to a soft progress fill.
    const max = 40
    return Math.max(0, Math.min(1, totalVolume / max))
  }, [totalVolume])

  const editingRef = useRef<{ date: string; hasAnyData: boolean; derivedHasBleeding: boolean; totalVolume: number }>({
    date: record.date,
    hasAnyData,
    derivedHasBleeding,
    totalVolume,
  })
  editingRef.current = { date: record.date, hasAnyData, derivedHasBleeding, totalVolume }

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
              dayColor: prevMeta?.dayColor ?? null,
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
      const stored = await loadDailyRecord(date)
      setSubmittedAt(stored.submittedAt)
      setRecord(stored.record)
      setSnapshot(JSON.stringify(stored.record))
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
    const ev: DailyRecordEvent = { ...e, id: uid() }
    setRecord((prev) => ({ ...prev, events: [...prev.events, ev] }))
  }

  const removeEvent = (id: string) => {
    setRecord((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
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
            dayColor: prevMeta?.dayColor ?? null,
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
  const showBleedingUi = typeof visibility.bleeding === 'boolean' ? visibility.bleeding : true

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
                onChange={(e) => {
                  if (loading) return
                  void selectDateWithReanchor(String(e.detail.value))
                }}
              >
                <FCChip>{selectedDate}</FCChip>
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
                const hasData = Boolean(meta)
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
                      if (rangeLoading && !meta) {
                        Taro.showToast({ title: '正在加载…', icon: 'none' })
                        return
                      }
                      if (!meta) {
                        Taro.showToast({ title: `${d} 无记录`, icon: 'none' })
                        return
                      }
                      Taro.showToast({ title: `${d} · ${meta.totalVolumeMl}mL`, icon: 'none' })
                    }}
                  >
                    <Text className={['calDayText', isActive ? 'calDayTextActive' : ''].join(' ')}>{dayText}</Text>
                    <FCVolumeVial
                      volumeMl={meta?.totalVolumeMl ?? 0}
                      hasData={hasData}
                      active={isActive}
                      loading={rangeLoading && !meta}
                      color={meta?.dayColor ?? null}
                      maxMl={40}
                    />
                  </FCPressable>
                )
              })}
            </View>
            <View className="calHintRow">
              <Text className="muted">点日期切换；左右滑动下方内容可前后切换 1 天；量筒高度表示该日总血量（示意）。</Text>
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

            {showBleedingUi ? (
              <View className="section">
                <View className="row">
                  <Text className="title">当日血量（示意）</Text>
                  <Text className="muted">{totalVolume} mL</Text>
                </View>
                <View className="volumeBar">
                  <View className="volumeFill" style={{ width: `${Math.round(volumeFill * 100)}%` }} />
                </View>
                <View className="tagsInline">{eventTags}</View>
                <Text className="muted">填写实际血量即代表该日有出血；提交后若继续改动，按钮会变为「更新」。</Text>
              </View>
            ) : (
              <View className="section">
                <View className="row">
                  <Text className="title">当日数据点</Text>
                  <Text className="muted">{record.events.length} 条</Text>
                </View>
                <View className="tagsInline">{eventTags}</View>
              </View>
            )}

            <View className="divider" />

            {showPad ? (
              <View className="section">
                <Text className="title">卫生巾</Text>
                <View className="optRow">
                  <Picker
                    mode="selector"
                    range={PAD_TYPES.map((x) => x.label)}
                    value={padTypeIndex}
                    onChange={(e) => setPadTypeIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{PAD_TYPES[padTypeIndex]?.label || '选择类型'}</FCChip>
                  </Picker>
                  <Picker
                    mode="selector"
                    range={COLORS.map((x) => x.label)}
                    value={colorIndex}
                    onChange={(e) => setColorIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{COLORS[colorIndex]?.label || '颜色'}</FCChip>
                  </Picker>
                  <Picker
                    mode="selector"
                    range={VOLUMES.map((x) => x.label)}
                    value={volumeIndex}
                    onChange={(e) => setVolumeIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{VOLUMES[volumeIndex]?.label || '量级'}</FCChip>
                  </Picker>
                </View>
                <View className="row section">
                  <FCButton
                    size="sm"
                    onClick={() => {
                      addEvent({
                        eventTime: new Date().toISOString(),
                        eventType: 'pad',
                        productType: PAD_TYPES[padTypeIndex]?.value,
                        color: COLORS[colorIndex]?.value,
                        volumeMl: VOLUMES[volumeIndex]?.value,
                      })
                    }}
                  >
                    添加/片
                  </FCButton>
                  <Text className="muted">建议在更换时记录，更接近真实节律。</Text>
                </View>
              </View>
            ) : null}

            <View className="divider" />

            {showTampon ? (
              <View className="section">
                <Text className="title">卫生棉条</Text>
                <View className="optRow">
                  <Picker
                    mode="selector"
                    range={TAMPON_MODELS.map((x) => x.label)}
                    value={tamponModelIndex}
                    onChange={(e) => setTamponModelIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{TAMPON_MODELS[tamponModelIndex]?.label || '选择型号'}</FCChip>
                  </Picker>
                  <Picker
                    mode="selector"
                    range={COLORS.map((x) => x.label)}
                    value={colorIndex}
                    onChange={(e) => setColorIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{COLORS[colorIndex]?.label || '颜色'}</FCChip>
                  </Picker>
                  <Picker
                    mode="selector"
                    range={VOLUMES.map((x) => x.label)}
                    value={volumeIndex}
                    onChange={(e) => setVolumeIndex(Number(e.detail.value) || 0)}
                  >
                    <FCChip>{VOLUMES[volumeIndex]?.label || '量级'}</FCChip>
                  </Picker>
                </View>
                <View className="row section">
                  <FCButton
                    size="sm"
                    onClick={() => {
                      addEvent({
                        eventTime: new Date().toISOString(),
                        eventType: 'tampon',
                        model: TAMPON_MODELS[tamponModelIndex]?.value,
                        color: COLORS[colorIndex]?.value,
                        volumeMl: VOLUMES[volumeIndex]?.value,
                      })
                    }}
                  >
                    添加/条
                  </FCButton>
                  <Text className="muted">与卫生巾一样：更换时记一条事件。</Text>
                </View>
              </View>
            ) : null}

            <View className="divider" />

            <View className="section">
              <Text className="title">症状（示意）</Text>
              <View className="optRow">
                {(['小血块', '大血块'] as const).map((name) => (
                  <FCButton
                    key={name}
                    size="sm"
                    variant="secondary"
                    onClick={() => addEvent({ eventTime: new Date().toISOString(), eventType: 'symptom', symptomName: name })}
                  >
                    {name}
                  </FCButton>
                ))}
              </View>
              <Text className="muted">症状也会成为时间轴上的“数据点”。</Text>
            </View>

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
    </View>
  )
}
