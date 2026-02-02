import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Input, Picker } from '@tarojs/components'
import type { OnboardingV2AnswerPayload, OnboardingV2AnswersMap, OnboardingV2QuestionId } from '../../services/onboardingV2'
import { onboardingV2Answer, onboardingV2Position, onboardingV2Start, onboardingV2Submit } from '../../services/onboardingV2'
import { QUESTION_DEFS } from '../../onboardingV2/questions'
import { getNextVisibleQuestionIdV2, getVisibleQuestionIds } from '../../onboardingV2/visibility'
import { computeOnboardingAnchorDate } from '../../onboardingV2/anchorDate'
import { STORAGE_KEYS } from '../../storage/keys'
import { setStorageString } from '../../storage/storage'
import { todayYmd } from '../../utils/date'
import { ensureAuthedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCChip, FCOptionCard, FCPressable, FCProgress, FCTextField, FCPickerField } from '../../ui'
import './index.less'

type Draft =
  | { kind: 'single'; value: string | null }
  | { kind: 'multi'; values: string[] }
  | { kind: 'number'; value: string; meta: { unknown?: boolean; no_answer?: boolean } }
  | { kind: 'date'; value: string; meta: { unknown?: boolean; no_answer?: boolean } }
  | { kind: 'text'; value: string; meta: { unknown?: boolean; no_answer?: boolean } }
  | {
      kind: 'birth_date_object'
      mode: 'exact_date' | 'year_month' | 'unknown' | 'no_answer'
      exactDate: string
      year: string
      month: string
    }

function initDraftFromAnswer(id: OnboardingV2QuestionId, answers: OnboardingV2AnswersMap): Draft {
  const def = QUESTION_DEFS[id]
  const a = answers[id]

  if (def.type === 'birth_date_object') {
    const obj = a && a.type === 'object' ? (a.value as any) : null
    const mode = (obj?.mode as any) || 'exact_date'
    const exactDate = typeof obj?.exactDate === 'string' ? obj.exactDate : todayYmd()
    const yearMonth = typeof obj?.yearMonth === 'string' ? obj.yearMonth : ''
    const [yy, mm] = yearMonth.split('-')
    return {
      kind: 'birth_date_object',
      mode,
      exactDate,
      year: yy || String(new Date().getFullYear()),
      month: mm || '01',
    }
  }

  if (def.type === 'single') {
    return { kind: 'single', value: a && a.type === 'single' ? a.value : null }
  }
  if (def.type === 'multi') {
    return { kind: 'multi', values: a && a.type === 'multi' ? a.values : [] }
  }
  if (def.type === 'number') {
    const meta = a && a.type === 'number' ? a.meta || {} : {}
    return { kind: 'number', value: a && a.type === 'number' && a.value != null ? String(a.value) : '', meta }
  }
  if (def.type === 'date') {
    const meta = a && a.type === 'date' ? a.meta || {} : {}
    return { kind: 'date', value: a && a.type === 'date' && a.value ? String(a.value) : '', meta }
  }
  if (def.type === 'text') {
    const meta = a && a.type === 'text' ? a.meta || {} : {}
    return { kind: 'text', value: a && a.type === 'text' && a.value ? String(a.value) : '', meta }
  }

  // Exhaustiveness fallback
  return { kind: 'single', value: null }
}

function toPayload(id: OnboardingV2QuestionId, draft: Draft): OnboardingV2AnswerPayload | null {
  const def = QUESTION_DEFS[id]

  if (def.type === 'birth_date_object') {
    if (draft.kind !== 'birth_date_object') return null
    const mode = draft.mode
    if (mode === 'unknown') return { type: 'object', value: { mode: 'unknown' } }
    if (mode === 'no_answer') return { type: 'object', value: { mode: 'no_answer' } }
    if (mode === 'year_month') {
      const yearMonth = `${draft.year}-${draft.month}`
      return { type: 'object', value: { mode: 'year_month', yearMonth } }
    }
    return { type: 'object', value: { mode: 'exact_date', exactDate: draft.exactDate } }
  }

  if (def.type === 'single') {
    if (draft.kind !== 'single' || !draft.value) return null
    return { type: 'single', value: draft.value }
  }
  if (def.type === 'multi') {
    if (draft.kind !== 'multi') return null
    return { type: 'multi', values: draft.values }
  }
  if (def.type === 'number') {
    if (draft.kind !== 'number') return null
    const meta = draft.meta || {}
    if (meta.unknown || meta.no_answer) return { type: 'number', value: null, meta }
    const n = Number(draft.value)
    if (!draft.value || Number.isNaN(n)) return null
    return { type: 'number', value: n, meta: {} }
  }
  if (def.type === 'date') {
    if (draft.kind !== 'date') return null
    const meta = draft.meta || {}
    if (meta.unknown || meta.no_answer) return { type: 'date', value: null, meta }
    if (!draft.value) return null
    return { type: 'date', value: draft.value, meta: {} }
  }
  if (def.type === 'text') {
    if (draft.kind !== 'text') return null
    const meta = draft.meta || {}
    if (meta.unknown || meta.no_answer) return { type: 'text', value: null, meta }
    if (!draft.value && def.required) return null
    return { type: 'text', value: draft.value || null, meta: {} }
  }
  return null
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<OnboardingV2AnswersMap>({})
  const [currentId, setCurrentId] = useState<OnboardingV2QuestionId | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [search, setSearch] = useState('')

  const visibleIds = useMemo(() => getVisibleQuestionIds(answers), [answers])
  const progress = useMemo(() => {
    if (!currentId) return { idx: visibleIds.length, total: visibleIds.length }
    const idx = visibleIds.indexOf(currentId)
    return { idx: idx >= 0 ? idx : 0, total: visibleIds.length }
  }, [currentId, visibleIds])
  const progressRatio = useMemo(() => {
    if (!progress.total) return 0
    // idx is zero-based; show a more natural "completed" ratio.
    return Math.max(0, Math.min(1, progress.idx / progress.total))
  }, [progress.idx, progress.total])

  const estimateMin = useMemo(() => {
    const remaining = Math.max(0, progress.total - progress.idx)
    // crude: ~4 questions/min for structured forms
    return Math.max(1, Math.ceil(remaining / 4))
  }, [progress.idx, progress.total])

  const def = currentId ? QUESTION_DEFS[currentId] : null

  useLoad(() => {
    ;(async () => {
      setLoading(true)
      try {
        const ok = await ensureAuthedOrRedirect()
        if (!ok) return

        const res = await onboardingV2Start()
        const nextAnswers = res.answers || {}
        const nextId = res.session?.currentQuestionId ?? null
        setAnswers(nextAnswers)
        setCurrentId(nextId)
      } catch (e) {
        Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
      } finally {
        setLoading(false)
      }
    })()
  })

  useEffect(() => {
    if (!currentId) {
      setDraft(null)
      return
    }
    setDraft(initDraftFromAnswer(currentId, answers))
    setSearch('')
  }, [currentId, answers])

  const submitCurrent = async () => {
    if (!currentId || !draft) return
    const payload = toPayload(currentId, draft)
    if (!payload) {
      Taro.showToast({ title: '请完成本题', icon: 'none' })
      return
    }

    // basic client validation for number bounds
    if (def?.type === 'number' && payload.type === 'number' && payload.value != null) {
      if (typeof def.min === 'number' && payload.value < def.min) {
        Taro.showToast({ title: `请输入不小于 ${def.min} 的数值`, icon: 'none' })
        return
      }
      if (typeof def.max === 'number' && payload.value > def.max) {
        Taro.showToast({ title: `请输入不大于 ${def.max} 的数值`, icon: 'none' })
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await onboardingV2Answer(currentId, payload)
      if (!res?.success) {
        throw new Error(res?.error || '提交失败')
      }

      const nextAnswers = { ...answers, [currentId]: payload }
      setAnswers(nextAnswers)
      setCurrentId((res.nextQuestionId ?? null) as any)
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const skipCurrent = async () => {
    if (!currentId) return
    const nextId = getNextVisibleQuestionIdV2(currentId, answers)
    setSubmitting(true)
    try {
      const res = await onboardingV2Position(nextId)
      if (!res?.success) throw new Error(res?.error || '跳过失败')
      setCurrentId((res.currentQuestionId ?? nextId ?? null) as any)
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '跳过失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const goPrev = async () => {
    if (!currentId) return
    const idx = visibleIds.indexOf(currentId)
    if (idx <= 0) {
      // "Pause" entry: keep progress server-side and show a calm holding page.
      await Taro.reLaunch({ url: '/pages/index/index?pause=1' })
      return
    }
    const prevId = visibleIds[idx - 1] || null
    setSubmitting(true)
    try {
      const res = await onboardingV2Position(prevId)
      if (!res?.success) throw new Error(res?.error || '返回失败')
      setCurrentId((res.currentQuestionId ?? prevId ?? null) as any)
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '返回失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const finalize = async () => {
    setSubmitting(true)
    try {
      const res = await onboardingV2Submit()
      if (!res?.success) throw new Error(res?.error || '提交失败')

      const anchorDate = computeOnboardingAnchorDate(answers)
      setStorageString(STORAGE_KEYS.onboardingAnchorDate, anchorDate)
      Taro.redirectTo({ url: '/pages/home/index' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="page">
        <View className="bg">
          <View className="wrap">
            <View className="card">
              <Text className="finishTitle">正在加载问卷...</Text>
              <Text className="finishDesc">请稍候，正在恢复你的进度。</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const formatAnswer = (id: OnboardingV2QuestionId) => {
    const a = answers[id]
    const def = QUESTION_DEFS[id]
    if (!a) return '未填写'
    if (a.type === 'single') {
      const opt = def.type === 'single' ? def.options.find((o) => o.value === a.value) : null
      return opt?.label || a.value
    }
    if (a.type === 'multi') {
      const values = Array.isArray(a.values) ? a.values : []
      const labels =
        def.type === 'multi'
          ? values.map((v) => def.options.find((o) => o.value === v)?.label || v)
          : values
      if (labels.length <= 3) return labels.join('、') || '未选择'
      return `${labels.slice(0, 3).join('、')} 等（${labels.length}项）`
    }
    if (a.type === 'number') {
      if (a.meta?.unknown) return '不确定/记不清'
      if (a.meta?.no_answer) return '不愿透露'
      return a.value == null ? '未填写' : String(a.value)
    }
    if (a.type === 'date') {
      if (a.meta?.unknown) return '不确定/记不清'
      if (a.meta?.no_answer) return '不愿透露'
      return a.value || '未填写'
    }
    if (a.type === 'text') {
      if (a.meta?.unknown) return '不确定/记不清'
      if (a.meta?.no_answer) return '不愿透露'
      return a.value || '未填写'
    }
    if (a.type === 'object') {
      if (id === 'B1_birth_date') {
        const v = a.value as any
        if (v?.mode === 'unknown') return '不确定/记不清'
        if (v?.mode === 'no_answer') return '不愿透露'
        if (v?.mode === 'year_month') return v?.yearMonth ? `约 ${String(v.yearMonth)}` : '只记得年月'
        return v?.exactDate ? String(v.exactDate) : '未填写'
      }
      return '已填写'
    }
    return '未填写'
  }

  const shortLabel = (id: OnboardingV2QuestionId) => {
    const map: Partial<Record<OnboardingV2QuestionId, string>> = {
      A0_consent_research: '研究同意',
      B1_birth_date: '出生日期',
      B2_region_level: '常住地区',
      C1_menarche_ever: '是否来过初潮',
      C3_menses_last_3m: '近3个月是否有月经',
      C2_current_status: '当前状态',
      D5_last_period_start: '上次月经第一天',
      E1_products: '常用卫生用品',
      E2_change_frequency_peak: '高峰日更换频率',
      E3_clots_leakage: '血块与漏',
      F1_health_conditions: '健康状况',
      G1_bleeding_history_multi: '出血相关经历',
      I1_height_cm: '身高',
      I2_weight_kg: '体重',
    }
    return map[id] || id
  }

  const goEdit = async (id: OnboardingV2QuestionId) => {
    setSubmitting(true)
    try {
      const res = await onboardingV2Position(id)
      if (!res?.success) throw new Error(res?.error || '跳转失败')
      setCurrentId((res.currentQuestionId ?? id) as any)
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '跳转失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // Summary confirmation (before submit): align with root docs.
  if (!currentId) {
    const summaryIds = visibleIds
      .filter((id) => id !== 'F2_condition_source_unknown_text')
      .filter((id) => {
        const def = QUESTION_DEFS[id]
        return Boolean(def?.required || answers[id])
      })
    return (
      <View className="page">
        <View className="bg">
          <View className="wrap wrapSummary">
            <View className="topbar topbarCompact">
              <Text className="topTitle">提交前确认</Text>
              <View className="progressRow">
                <Text className="progressText">你可以在提交前快速检查与修改。</Text>
              </View>
            </View>

            <View className="card fc-appear">
              <Text className="title">摘要</Text>
              <View className="note">
                <Text>点击每项右侧的编辑图标，可返回对应问题。提交后将进入按日记录。</Text>
              </View>

              <View className="summaryList">
                {summaryIds.map((id) => (
                  <View key={id} className="summaryItem">
                    <View className="summaryHead">
                      <Text className="summaryKey">{shortLabel(id)}</Text>
                      <FCPressable
                        className="summaryEditIcon"
                        disabled={submitting}
                        onClick={() => void goEdit(id)}
                        hoverClassName="fc-pressed"
                      >
                        <Text className="summaryEditIconText">✎</Text>
                      </FCPressable>
                    </View>
                    <Text className="summaryVal">{formatAnswer(id)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <FCActionBar>
              <View className="actionsRow">
                <FCButton
                  variant="secondary"
                  loading={submitting}
                  style={{ flex: 1 }}
                  onClick={() => void Taro.reLaunch({ url: '/pages/index/index?pause=1' })}
                >
                  稍后继续
                </FCButton>
                <FCButton loading={submitting} style={{ flex: 1 }} onClick={() => void finalize()}>
                  提交并开始记录
                </FCButton>
              </View>
            </FCActionBar>
          </View>
        </View>
      </View>
    )
  }

  if (!def || !draft) {
    return (
      <View className="page">
        <Text>加载题目失败</Text>
      </View>
    )
  }

  const isExclusiveMultiValue = (v: string) => {
    // For multi questions, treat these as mutually-exclusive "final" answers.
    return v === 'none' || v === '都没有' || v === 'unknown' || v === '不确定' || v === 'no_answer'
  }

  const isTaggyMulti = currentId === 'F1_health_conditions' || currentId === 'G1_bleeding_history_multi'
  const filteredMultiOptions =
    def.type === 'multi'
      ? def.options.filter((o) => (search.trim() ? o.label.includes(search.trim()) : true))
      : []

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="topbar">
            <Text className="topTitle">问卷 Onboarding</Text>
            <FCProgress
              leftText={`已完成 ${Math.min(progress.idx, progress.total)}/${progress.total}`}
              rightText={`预计剩余 ${estimateMin} 分钟`}
              ratio={progressRatio}
            />
          </View>

          <View className="card fc-appear">
            <Text className="title">{def.title}</Text>
            {def.note ? <Text className="note">{def.note}</Text> : null}

        {def.type === 'single' ? (
          <View className="options">
            {def.options.map((opt) => {
              const active = draft.kind === 'single' && draft.value === opt.value
              return (
                <FCOptionCard
                  key={opt.value}
                  active={active}
                  disabled={submitting}
                  label={opt.label}
                  onClick={() => setDraft({ kind: 'single', value: opt.value })}
                >
                </FCOptionCard>
              )
            })}
          </View>
        ) : null}

        {def.type === 'multi' && isTaggyMulti ? (
          <View>
            <View className="searchRow">
              <Input
                className="searchInput"
                value={search}
                onInput={(e) => setSearch(String(e.detail.value || ''))}
                placeholder="搜索并选择（可多选）"
                type="text"
                disabled={submitting}
              />
            </View>

            {draft.kind === 'multi' && draft.values.length > 0 ? (
              <View className="chipsRow">
                {draft.values.map((v) => (
                  <FCChip
                    key={v}
                    active
                    disabled={submitting}
                    onClick={() => {
                      if (draft.kind !== 'multi') return
                      const next = draft.values.filter((x) => x !== v)
                      setDraft({ kind: 'multi', values: next })
                    }}
                  >
                    {v} ×
                  </FCChip>
                ))}
              </View>
            ) : (
              <View className="chipsRow">
                <FCChip disabled>还未选择</FCChip>
                <FCChip disabled>可输入关键词快速筛选</FCChip>
              </View>
            )}

            <View className="grid">
              {filteredMultiOptions.map((opt) => {
                const active = draft.kind === 'multi' && draft.values.includes(opt.value)
                return (
                  <Text
                    key={opt.value}
                    className={`gridItem ${active ? 'gridItemActive' : ''}`}
                    onClick={() => {
                      if (draft.kind !== 'multi') return
                      const next = new Set(draft.values)
                      if (isExclusiveMultiValue(opt.value)) {
                        next.clear()
                        next.add(opt.value)
                      } else {
                        for (const v of Array.from(next)) {
                          if (isExclusiveMultiValue(v)) next.delete(v)
                        }
                        if (active) next.delete(opt.value)
                        else next.add(opt.value)
                      }
                      setDraft({ kind: 'multi', values: Array.from(next) })
                    }}
                  >
                    {opt.label}
                  </Text>
                )
              })}
            </View>
          </View>
        ) : null}

        {def.type === 'multi' && !isTaggyMulti ? (
          <View className="options">
            {def.options.map((opt) => {
              const active = draft.kind === 'multi' && draft.values.includes(opt.value)
              const isAtMax = draft.kind === 'multi' && def.maxSelections && draft.values.length >= def.maxSelections
              const canSelect = !active && (!isAtMax || isExclusiveMultiValue(opt.value))

              return (
                <FCOptionCard
                  key={opt.value}
                  active={active}
                  disabled={submitting || !canSelect}
                  label={opt.label}
                  onClick={() => {
                    if (draft.kind !== 'multi') return
                    const next = new Set(draft.values)

                    // Special handling: mutually exclusive options like "none"/"unknown"/"no_answer"
                    if (isExclusiveMultiValue(opt.value)) {
                      next.clear()
                      next.add(opt.value)
                    } else {
                      for (const v of Array.from(next)) {
                        if (isExclusiveMultiValue(v)) next.delete(v)
                      }
                      if (active) next.delete(opt.value)
                      else {
                        if (def.maxSelections && next.size >= def.maxSelections) {
                          Taro.showToast({ title: `最多选择 ${def.maxSelections} 项`, icon: 'none' })
                          return
                        }
                        next.add(opt.value)
                      }
                    }

                    setDraft({ kind: 'multi', values: Array.from(next) })
                  }}
                />
              )
            })}
            {def.maxSelections && draft.kind === 'multi' ? (
              <Text className="note" style={{ marginTop: 8 }}>
                已选择 {draft.values.length}/{def.maxSelections} 项
              </Text>
            ) : null}
          </View>
        ) : null}

        {def.type === 'number' ? (
          <View>
            <FCTextField
              value={draft.kind === 'number' ? draft.value : ''}
              placeholder="请输入数字"
              type="number"
              disabled={submitting || (draft.kind === 'number' && (draft.meta.unknown || draft.meta.no_answer))}
              onChange={(next) => {
                if (draft.kind !== 'number') return
                setDraft({ ...draft, value: next, meta: {} })
              }}
              helperText={def.required ? ' ' : '可跳过；如不确定可选择下方选项'}
              style={{ marginTop: 14 }}
            />
            <View className="metaRow">
              {def.allowUnknown ? (
                <FCChip
                  active={draft.kind === 'number' && Boolean(draft.meta.unknown)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'number') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </FCChip>
              ) : null}
              {def.allowNoAnswer ? (
                <FCChip
                  active={draft.kind === 'number' && Boolean(draft.meta.no_answer)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'number') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </FCChip>
              ) : null}
            </View>
          </View>
        ) : null}

        {def.type === 'date' ? (
          <View>
            <FCPickerField
              mode="date"
              value={draft.kind === 'date' ? draft.value : ''}
              valueText={draft.kind === 'date' && draft.value ? draft.value : ''}
              end={todayYmd()}
              disabled={submitting || (draft.kind === 'date' && (draft.meta.unknown || draft.meta.no_answer))}
              onChange={(e) => {
                if (draft.kind !== 'date') return
                setDraft({ ...draft, value: String(e.detail.value || ''), meta: {} })
              }}
              placeholder="选择日期"
            />
            <View className="metaRow">
              {def.allowUnknown ? (
                <FCChip
                  active={draft.kind === 'date' && Boolean(draft.meta.unknown)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'date') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </FCChip>
              ) : null}
              {def.allowNoAnswer ? (
                <FCChip
                  active={draft.kind === 'date' && Boolean(draft.meta.no_answer)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'date') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </FCChip>
              ) : null}
            </View>
          </View>
        ) : null}

        {def.type === 'text' ? (
          <View>
            <FCTextField
              value={draft.kind === 'text' ? draft.value : ''}
              placeholder={def.placeholder || '请输入'}
              disabled={submitting || (draft.kind === 'text' && (draft.meta.unknown || draft.meta.no_answer))}
              onChange={(next) => {
                if (draft.kind !== 'text') return
                setDraft({ ...draft, value: next, meta: {} })
              }}
              helperText={def.required ? ' ' : '可跳过；如不确定可选择下方选项'}
              style={{ marginTop: 14 }}
            />
            <View className="metaRow">
              {def.allowUnknown ? (
                <FCChip
                  active={draft.kind === 'text' && Boolean(draft.meta.unknown)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'text') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </FCChip>
              ) : null}
              {def.allowNoAnswer ? (
                <FCChip
                  active={draft.kind === 'text' && Boolean(draft.meta.no_answer)}
                  disabled={submitting}
                  onClick={() => {
                    if (draft.kind !== 'text') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </FCChip>
              ) : null}
            </View>
          </View>
        ) : null}

        {def.type === 'birth_date_object' ? (
          <View className="field">
            <View className="options">
              {(
                [
                  { v: 'exact_date', label: '我记得具体日期' },
                  { v: 'year_month', label: '只记得年月' },
                  { v: 'unknown', label: '不确定/记不清' },
                  { v: 'no_answer', label: '不愿透露' },
                ] as const
              ).map((it) => {
                const active = draft.kind === 'birth_date_object' && draft.mode === it.v
                return (
                  <FCOptionCard
                    key={it.v}
                    label={it.label}
                    active={active}
                    disabled={submitting}
                    onClick={() => {
                      if (draft.kind !== 'birth_date_object') return
                      setDraft({ ...draft, mode: it.v })
                    }}
                  />
              )
            })}
            </View>

            {draft.kind === 'birth_date_object' && draft.mode === 'exact_date' ? (
              <View>
                <FCPickerField
                  mode="date"
                  value={draft.exactDate}
                  valueText={draft.exactDate}
                  end={todayYmd()}
                  disabled={submitting}
                  onChange={(e) => {
                    if (draft.kind !== 'birth_date_object') return
                    setDraft({ ...draft, exactDate: String(e.detail.value || todayYmd()) })
                  }}
                  placeholder="选择日期"
                />
              </View>
            ) : null}

            {draft.kind === 'birth_date_object' && draft.mode === 'year_month' ? (
              <View className="field">
                <View className="note">请选择年月（用于年龄分层；不会收集精确地址等信息）。</View>
                <View className="metaRow">
                  <Picker
                    mode="selector"
                    range={Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - i))}
                    onChange={(e) => {
                      if (draft.kind !== 'birth_date_object') return
                      const years = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - i))
                      setDraft({ ...draft, year: years[Number(e.detail.value) || 0] || draft.year })
                    }}
                  >
                    <FCChip disabled={submitting}>{draft.year}年</FCChip>
                  </Picker>
                  <Picker
                    mode="selector"
                    range={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))}
                    onChange={(e) => {
                      if (draft.kind !== 'birth_date_object') return
                      const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
                      setDraft({ ...draft, month: months[Number(e.detail.value) || 0] || draft.month })
                    }}
                  >
                    <FCChip disabled={submitting}>{draft.month}月</FCChip>
                  </Picker>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        </View>

        <FCActionBar>
          <View className="actionsRow">
            <FCButton
              variant="secondary"
              loading={submitting}
              style={{ flex: 1 }}
              onClick={() => void goPrev()}
            >
              {visibleIds.indexOf(currentId) <= 0 ? '稍后继续' : '上一步'}
            </FCButton>
            {!def.required ? (
              <FCButton
                variant="ghost"
                loading={submitting}
                style={{ flex: 1 }}
                onClick={() => void skipCurrent()}
              >
                跳过
              </FCButton>
            ) : null}
            <FCButton loading={submitting} style={{ flex: 1 }} onClick={() => void submitCurrent()}>
              下一步
            </FCButton>
          </View>
        </FCActionBar>
        </View>
      </View>
    </View>
  )
}
