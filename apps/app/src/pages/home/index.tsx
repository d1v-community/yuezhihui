import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Switch, Picker, ScrollView } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageJson, getStorageString, setStorageString } from '../../storage/storage'
import { loadDailyRecord, saveDailyRecordDraft, submitDailyRecord } from '../../services/dailyRecordRepo'
import type { DailyRecord, DailyRecordEvent, MenstrualColor } from '../../types/dailyRecord'
import { addDaysYmd, clampYmd, todayYmd } from '../../utils/date'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { getMenstrualDailyRange } from '../../services/menstrual'
import { FCActionBar, FCButton, FCChip, FCNotice, FCPressable, FCTabBar } from '../../ui'
import './index.less'

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function sumVolumeMl(events: DailyRecordEvent[]) {
  return events.reduce((s, e) => s + (e.eventType === 'pad' || e.eventType === 'tampon' ? e.volumeMl || 0 : 0), 0)
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

export default function HomePage() {
  const today = todayYmd()
  const minDate = addDaysYmd(today, -180)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  const [rangeMap, setRangeMap] = useState<Record<string, { hasBleeding: boolean; totalVolumeMl: number }>>({})

  const [selectedDate, setSelectedDate] = useState(today)
  const [submittedAt, setSubmittedAt] = useState<number | null>(null)
  const [record, setRecord] = useState<DailyRecord>({ date: today, hasBleeding: false, events: [] })
  const [snapshot, setSnapshot] = useState('')

  const [padTypeIndex, setPadTypeIndex] = useState(1)
  const [tamponModelIndex, setTamponModelIndex] = useState(1)
  const [colorIndex, setColorIndex] = useState(1)
  const [volumeIndex, setVolumeIndex] = useState(1)

  const dirty = useMemo(() => JSON.stringify(record) !== snapshot, [record, snapshot])
  const totalVolume = useMemo(() => sumVolumeMl(record.events), [record.events])
  const hasSubmitted = submittedAt != null
  const volumeFill = useMemo(() => {
    // UI-only: map "today volume" to a soft progress fill.
    const max = 40
    return Math.max(0, Math.min(1, totalVolume / max))
  }, [totalVolume])

  const loadForDate = async (date: string) => {
    setLoading(true)
    try {
      const stored = await loadDailyRecord(date)
      setSelectedDate(date)
      setSubmittedAt(stored.submittedAt)
      setRecord(stored.record)
      setSnapshot(JSON.stringify(stored.record))
    } finally {
      setLoading(false)
    }
  }

  useLoad(() => {
    ;(async () => {
      const ok = await ensureAuthedAndOnboardedOrRedirect()
      if (!ok) return

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      const anchor = getStorageString(STORAGE_KEYS.onboardingAnchorDate) || today
      const initial = firstCompletedAt ? today : clampYmd(anchor, minDate, today)
      await loadForDate(initial)

      // Fetch a light "recent days" overview for navigation (P0-3).
      try {
        const start = addDaysYmd(today, -59)
        const list = await getMenstrualDailyRange(start, today)
        const map: Record<string, { hasBleeding: boolean; totalVolumeMl: number }> = {}
        for (const it of list) {
          map[it.date] = { hasBleeding: Boolean(it.hasBleeding), totalVolumeMl: Number(it.totalVolumeMl || 0) }
        }
        setRangeMap(map)
      } catch {
        // ignore; UI falls back to date picker only
      }

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

  const selectDate = async (nextDate: string) => {
    const clamped = clampYmd(nextDate, minDate, today)
    if (clamped === selectedDate) return
    if (dirty) {
      const res = await Taro.showModal({
        title: '放弃修改？',
        content: '当前修改未提交，切换日期将放弃这些改动。',
        confirmText: '放弃',
        cancelText: '继续编辑',
      })
      if (!res.confirm) return
    }
    await loadForDate(clamped)
  }

  const addEvent = (e: Omit<DailyRecordEvent, 'id'>) => {
    const ev: DailyRecordEvent = { ...e, id: uid() }
    setRecord((prev) => ({
      ...prev,
      hasBleeding: ev.eventType === 'pad' || ev.eventType === 'tampon' ? true : prev.hasBleeding,
      events: [...prev.events, ev],
    }))
  }

  const removeEvent = (id: string) => {
    setRecord((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
  }

  const toggleBleeding = async (checked: boolean) => {
    if (!checked && record.events.length > 0) {
      const res = await Taro.showModal({
        title: '清空当日事件？',
        content: '切换为“无出血”将清空当日已添加的用品/症状事件。',
        confirmText: '清空',
        cancelText: '取消',
      })
      if (!res.confirm) return
      setRecord((prev) => ({ ...prev, hasBleeding: false, events: [] }))
      return
    }
    setRecord((prev) => ({ ...prev, hasBleeding: checked }))
  }

  const submit = async () => {
    if (hasSubmitted && !dirty) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      const stored = await submitDailyRecord(record)
      setSnapshot(JSON.stringify(record))
      const wasSubmitted = hasSubmitted
      setSubmittedAt(stored.submittedAt)

      // Update overview map for the current day (best-effort).
      setRangeMap((prev) => ({
        ...prev,
        [record.date]: { hasBleeding: record.hasBleeding, totalVolumeMl: totalVolume },
      }))

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      if (!firstCompletedAt) {
        setStorageString(STORAGE_KEYS.dailyFirstCompletedAt, String(Date.now()))
      }

      Taro.showToast({ title: wasSubmitted ? '已更新' : '提交成功', icon: 'none' })
    } catch (e) {
      setSubmitError(true)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="page">
        <Text>Loading...</Text>
      </View>
    )
  }

  const visibility = getStorageJson<{ sanitaryPad?: boolean; tampon?: boolean; bleeding?: boolean }>(STORAGE_KEYS.visibilitySettings) || {}
  const showPad = typeof visibility.sanitaryPad === 'boolean' ? visibility.sanitaryPad : true
  const showTampon = typeof visibility.tampon === 'boolean' ? visibility.tampon : true
  const showBleedingUi = typeof visibility.bleeding === 'boolean' ? visibility.bleeding : true

  const recentDays = Array.from({ length: 30 }, (_, i) => addDaysYmd(today, -29 + i))

  return (
    <View className="page">
      <View className="wrap">
        <View className="card fc-appear">
          <View className="row">
            <Text className="title">按日记录</Text>
            <Picker mode="date" value={selectedDate} start={minDate} end={today} onChange={(e) => selectDate(String(e.detail.value))}>
              <FCChip>{selectedDate}</FCChip>
            </Picker>
          </View>

          <View className="calendarStrip">
            <ScrollView scrollX showScrollbar={false} className="calendarScroll">
              <View className="calendarInner">
                {recentDays.map((d) => {
                  const meta = rangeMap[d]
                  const isActive = d === selectedDate
                  const hasData = Boolean(meta && (meta.hasBleeding || meta.totalVolumeMl > 0))
                  const dayText = d.slice(8, 10)
                  return (
                    <FCPressable
                      key={d}
                      className={['calDay', isActive ? 'calDayActive' : ''].join(' ')}
                      onClick={() => void selectDate(d)}
                    >
                      <Text className={['calDayText', isActive ? 'calDayTextActive' : ''].join(' ')}>{dayText}</Text>
                      <View className={['calDot', hasData ? 'calDotOn' : '', isActive ? 'calDotActive' : ''].join(' ')} />
                    </FCPressable>
                  )
                })}
              </View>
            </ScrollView>
            <View className="calHintRow">
              <Text className="muted">点日期可快速切换；圆点表示该日有记录/出血。</Text>
              <FCPressable className="calGear" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                <Text className="calGearText">⚙</Text>
              </FCPressable>
            </View>
          </View>

          <View className="pillRow">
            <FCChip active={hasSubmitted}>{hasSubmitted ? '已提交' : '未提交'}</FCChip>
            <FCChip active={dirty}>{dirty ? '有改动' : '未改动'}</FCChip>
            <FCChip disabled>仅可记录今天及之前</FCChip>
          </View>

          <View className="divider" />

          <View className="row section">
            <View>
              <Text className="title">有出血吗？</Text>
              <Text className="muted">关闭将清空当日事件；开启后可继续添加用品/症状。</Text>
            </View>
            <Switch checked={record.hasBleeding} onChange={(e) => toggleBleeding(Boolean(e.detail.value))} />
          </View>

          {showBleedingUi ? (
            <View className="section">
              <View className="row">
                <Text className="title">实时血量（示意）</Text>
                <Text className="muted">{totalVolume} mL</Text>
              </View>
              <View className="volumeBar">
                <View className="volumeFill" style={{ width: `${Math.round(volumeFill * 100)}%` }} />
              </View>
              <Text className="muted">每次“添加”都会生成事件标签；提交后再改动会变为「确认更改」。</Text>
            </View>
          ) : null}

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

          <View className="divider" />

          <View className="section">
            <Text className="title">事件标签</Text>
            {record.events.length === 0 ? (
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
            )}
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
            disabled={hasSubmitted && !dirty}
            fullWidth
            onClick={() => void submit()}
          >
            {submitting ? '提交中...' : hasSubmitted && dirty ? '确认更改' : '提交'}
          </FCButton>
          <Text className="actionsHint">
            {hasSubmitted && !dirty ? '该日已提交，未检测到改动。' : dirty ? '有未提交改动。' : '可继续记录或切换日期。'}
          </Text>
          <FCTabBar />
        </FCActionBar>
      </View>
    </View>
  )
}
