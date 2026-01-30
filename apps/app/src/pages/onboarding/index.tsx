import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Button, Input, Picker } from '@tarojs/components'
import type { OnboardingV2AnswerPayload, OnboardingV2AnswersMap, OnboardingV2QuestionId } from '../../services/onboardingV2'
import { onboardingV2Answer, onboardingV2Position, onboardingV2Start, onboardingV2Submit } from '../../services/onboardingV2'
import { QUESTION_DEFS } from '../../onboardingV2/questions'
import { getNextVisibleQuestionIdV2, getVisibleQuestionIds } from '../../onboardingV2/visibility'
import { computeOnboardingAnchorDate } from '../../onboardingV2/anchorDate'
import { STORAGE_KEYS } from '../../storage/keys'
import { setStorageString } from '../../storage/storage'
import { todayYmd } from '../../utils/date'
import { ensureAuthedOrRedirect } from '../../utils/authGuard'
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

  const visibleIds = useMemo(() => getVisibleQuestionIds(answers), [answers])
  const progress = useMemo(() => {
    if (!currentId) return { idx: visibleIds.length, total: visibleIds.length }
    const idx = visibleIds.indexOf(currentId)
    return { idx: idx >= 0 ? idx : 0, total: visibleIds.length }
  }, [currentId, visibleIds])

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
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!currentId) {
    return (
      <View className="page">
        <View className="card">
          <Text className="finishTitle">问卷已完成</Text>
          <Text className="finishDesc">接下来进入主页面按日记录（今天与历史日期）。</Text>
          <View className="actions">
            <Button type="primary" loading={submitting} onClick={finalize}>
              开始记录
            </Button>
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

  return (
    <View className="page">
      <View className="topbar">
        <Text className="progress">
          已完成 {Math.min(progress.idx, progress.total)}/{progress.total}
        </Text>
      </View>

      <View className="card">
        <Text className="title">{def.title}</Text>
        {def.note ? <Text className="note">{def.note}</Text> : null}

        {def.type === 'single' ? (
          <View className="options">
            {def.options.map((opt) => {
              const active = draft.kind === 'single' && draft.value === opt.value
              return (
                <View
                  key={opt.value}
                  className={`opt ${active ? 'optActive' : ''}`}
                  onClick={() => setDraft({ kind: 'single', value: opt.value })}
                >
                  <Text className="optLabel">{opt.label}</Text>
                </View>
              )
            })}
          </View>
        ) : null}

        {def.type === 'multi' ? (
          <View className="options">
            {def.options.map((opt) => {
              const active = draft.kind === 'multi' && draft.values.includes(opt.value)
              return (
                <View
                  key={opt.value}
                  className={`opt ${active ? 'optActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'multi') return
                    const next = new Set(draft.values)

                    // Special handling: mutually exclusive options like "none"
                    if (opt.value === 'none' || opt.value === '都没有') {
                      next.clear()
                      next.add(opt.value)
                    } else {
                      next.delete('none')
                      next.delete('都没有')
                      if (active) next.delete(opt.value)
                      else next.add(opt.value)
                    }

                    setDraft({ kind: 'multi', values: Array.from(next) })
                  }}
                >
                  <Text className="optLabel">{opt.label}</Text>
                </View>
              )
            })}
          </View>
        ) : null}

        {def.type === 'number' ? (
          <View className="field">
            <Input
              className="input"
              type="number"
              value={draft.kind === 'number' ? draft.value : ''}
              placeholder="请输入数字"
              onInput={(e) => {
                if (draft.kind !== 'number') return
                setDraft({ ...draft, value: String(e.detail.value || ''), meta: {} })
              }}
              disabled={submitting || (draft.kind === 'number' && (draft.meta.unknown || draft.meta.no_answer))}
            />
            <View className="metaRow">
              {def.allowUnknown ? (
                <Text
                  className={`metaBtn ${draft.kind === 'number' && draft.meta.unknown ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'number') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </Text>
              ) : null}
              {def.allowNoAnswer ? (
                <Text
                  className={`metaBtn ${draft.kind === 'number' && draft.meta.no_answer ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'number') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {def.type === 'date' ? (
          <View className="field">
            <Picker
              mode="date"
              value={draft.kind === 'date' ? draft.value : ''}
              end={todayYmd()}
              onChange={(e) => {
                if (draft.kind !== 'date') return
                setDraft({ ...draft, value: String(e.detail.value || ''), meta: {} })
              }}
              disabled={submitting || (draft.kind === 'date' && (draft.meta.unknown || draft.meta.no_answer))}
            >
              <View className="input">
                <Text>{draft.kind === 'date' && draft.value ? draft.value : '选择日期'}</Text>
              </View>
            </Picker>
            <View className="metaRow">
              {def.allowUnknown ? (
                <Text
                  className={`metaBtn ${draft.kind === 'date' && draft.meta.unknown ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'date') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </Text>
              ) : null}
              {def.allowNoAnswer ? (
                <Text
                  className={`metaBtn ${draft.kind === 'date' && draft.meta.no_answer ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'date') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {def.type === 'text' ? (
          <View className="field">
            <Input
              className="input"
              type="text"
              value={draft.kind === 'text' ? draft.value : ''}
              placeholder={def.placeholder || '请输入'}
              onInput={(e) => {
                if (draft.kind !== 'text') return
                setDraft({ ...draft, value: String(e.detail.value || ''), meta: {} })
              }}
              disabled={submitting || (draft.kind === 'text' && (draft.meta.unknown || draft.meta.no_answer))}
            />
            <View className="metaRow">
              {def.allowUnknown ? (
                <Text
                  className={`metaBtn ${draft.kind === 'text' && draft.meta.unknown ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'text') return
                    const next = !draft.meta.unknown
                    setDraft({ ...draft, value: '', meta: { unknown: next } })
                  }}
                >
                  不确定/记不清
                </Text>
              ) : null}
              {def.allowNoAnswer ? (
                <Text
                  className={`metaBtn ${draft.kind === 'text' && draft.meta.no_answer ? 'metaBtnActive' : ''}`}
                  onClick={() => {
                    if (draft.kind !== 'text') return
                    const next = !draft.meta.no_answer
                    setDraft({ ...draft, value: '', meta: { no_answer: next } })
                  }}
                >
                  不愿透露
                </Text>
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
                  <View
                    key={it.v}
                    className={`opt ${active ? 'optActive' : ''}`}
                    onClick={() => {
                      if (draft.kind !== 'birth_date_object') return
                      setDraft({ ...draft, mode: it.v })
                    }}
                  >
                    <Text className="optLabel">{it.label}</Text>
                  </View>
                )
              })}
            </View>

            {draft.kind === 'birth_date_object' && draft.mode === 'exact_date' ? (
              <View className="field">
                <Picker
                  mode="date"
                  value={draft.exactDate}
                  end={todayYmd()}
                  onChange={(e) => {
                    if (draft.kind !== 'birth_date_object') return
                    setDraft({ ...draft, exactDate: String(e.detail.value || todayYmd()) })
                  }}
                >
                  <View className="input">
                    <Text>{draft.exactDate}</Text>
                  </View>
                </Picker>
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
                    <View className="metaBtn">
                      <Text>{draft.year}年</Text>
                    </View>
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
                    <View className="metaBtn">
                      <Text>{draft.month}月</Text>
                    </View>
                  </Picker>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="actions">
          <Button loading={submitting} onClick={() => Taro.navigateBack({ delta: 1 })}>
            返回
          </Button>
          {!def.required ? (
            <Button loading={submitting} onClick={skipCurrent}>
              跳过
            </Button>
          ) : null}
          <Button type="primary" loading={submitting} onClick={submitCurrent}>
            下一步
          </Button>
        </View>
      </View>
    </View>
  )
}
