import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Button, Switch, Picker } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageString, setStorageString } from '../../storage/storage'
import { loadDailyRecord, saveDailyRecordDraft, submitDailyRecord } from '../../services/dailyRecordRepo'
import type { DailyRecord, DailyRecordEvent, MenstrualColor } from '../../types/dailyRecord'
import { addDaysYmd, clampYmd, todayYmd } from '../../utils/date'
import { ensureAuthedOrRedirect } from '../../utils/authGuard'
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
      const ok = await ensureAuthedOrRedirect()
      if (!ok) return

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      const anchor = getStorageString(STORAGE_KEYS.onboardingAnchorDate) || today
      const initial = firstCompletedAt ? today : clampYmd(anchor, minDate, today)
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
    try {
      const stored = await submitDailyRecord(record)
      setSnapshot(JSON.stringify(record))
      const wasSubmitted = hasSubmitted
      setSubmittedAt(stored.submittedAt)

      const firstCompletedAt = getStorageString(STORAGE_KEYS.dailyFirstCompletedAt)
      if (!firstCompletedAt) {
        setStorageString(STORAGE_KEYS.dailyFirstCompletedAt, String(Date.now()))
      }

      Taro.showToast({ title: wasSubmitted ? '已更新' : '提交成功', icon: 'none' })
    } catch (e) {
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

  return (
    <View className="page">
      <View className="wrap">
        <View className="card">
          <View className="row">
            <Text className="title">按日记录</Text>
            <Picker
              mode="date"
              value={selectedDate}
              start={minDate}
              end={today}
              onChange={(e) => selectDate(String(e.detail.value))}
            >
              <View className="pickerBtn">
                <Text>{selectedDate}</Text>
              </View>
            </Picker>
          </View>

          <View className="pillRow">
            <View className={`pill ${hasSubmitted ? 'pillActive' : ''}`}>
              <Text>{hasSubmitted ? '已提交' : '未提交'}</Text>
            </View>
            <View className={`pill ${dirty ? 'pillActive' : ''}`}>
              <Text>{dirty ? '有改动' : '未改动'}</Text>
            </View>
            <View className="pill">
              <Text>仅可记录今天及之前</Text>
            </View>
          </View>

          <View className="divider" />

          <View className="row section">
            <View>
              <Text className="title">有出血吗？</Text>
              <Text className="muted">关闭将清空当日事件；开启后可继续添加用品/症状。</Text>
            </View>
            <Switch checked={record.hasBleeding} onChange={(e) => toggleBleeding(Boolean(e.detail.value))} />
          </View>

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

          <View className="divider" />

          <View className="section">
            <Text className="title">卫生巾</Text>
            <View className="optRow">
            <Picker
              mode="selector"
              range={PAD_TYPES.map((x) => x.label)}
              value={padTypeIndex}
              onChange={(e) => setPadTypeIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{PAD_TYPES[padTypeIndex]?.label || '选择类型'}</Text>
              </View>
            </Picker>
            <Picker
              mode="selector"
              range={COLORS.map((x) => x.label)}
              value={colorIndex}
              onChange={(e) => setColorIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{COLORS[colorIndex]?.label || '颜色'}</Text>
              </View>
            </Picker>
            <Picker
              mode="selector"
              range={VOLUMES.map((x) => x.label)}
              value={volumeIndex}
              onChange={(e) => setVolumeIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{VOLUMES[volumeIndex]?.label || '量级'}</Text>
              </View>
            </Picker>
            </View>
            <View className="row section">
            <Button
              size="mini"
              type="primary"
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
            </Button>
              <Text className="muted">建议在更换时记录，更接近真实节律。</Text>
            </View>
          </View>

          <View className="divider" />

          <View className="section">
            <Text className="title">卫生棉条</Text>
            <View className="optRow">
            <Picker
              mode="selector"
              range={TAMPON_MODELS.map((x) => x.label)}
              value={tamponModelIndex}
              onChange={(e) => setTamponModelIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{TAMPON_MODELS[tamponModelIndex]?.label || '选择型号'}</Text>
              </View>
            </Picker>
            <Picker
              mode="selector"
              range={COLORS.map((x) => x.label)}
              value={colorIndex}
              onChange={(e) => setColorIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{COLORS[colorIndex]?.label || '颜色'}</Text>
              </View>
            </Picker>
            <Picker
              mode="selector"
              range={VOLUMES.map((x) => x.label)}
              value={volumeIndex}
              onChange={(e) => setVolumeIndex(Number(e.detail.value) || 0)}
            >
              <View className="pickerBtn">
                <Text>{VOLUMES[volumeIndex]?.label || '量级'}</Text>
              </View>
            </Picker>
            </View>
            <View className="row section">
            <Button
              size="mini"
              type="primary"
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
            </Button>
              <Text className="muted">与卫生巾一样：更换时记一条事件。</Text>
            </View>
          </View>

          <View className="divider" />

          <View className="section">
            <Text className="title">症状（示意）</Text>
            <View className="optRow">
            {(['小血块', '大血块'] as const).map((name) => (
              <Button
                key={name}
                size="mini"
                onClick={() => addEvent({ eventTime: new Date().toISOString(), eventType: 'symptom', symptomName: name })}
              >
                {name}
              </Button>
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

        <View className="actionsSpacer" />
        <View className="actionsBar">
          <Button type="primary" loading={submitting} disabled={hasSubmitted && !dirty} onClick={submit}>
            {submitting ? '提交中...' : hasSubmitted && dirty ? '确认更改' : '提交'}
          </Button>
          <Text className="actionsHint">
            {hasSubmitted && !dirty ? '该日已提交，未检测到改动。' : dirty ? '有未提交改动。' : '可继续记录或切换日期。'}
          </Text>
        </View>
      </View>
    </View>
  )
}
