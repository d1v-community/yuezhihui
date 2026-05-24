import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { Text, Textarea, View } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageJson, setStorageJson } from '../../storage/storage'
import { submitFeedback } from '../../services/feedback'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCButton, FCOptionCard, FCPressable, FCTextField } from '../../ui'
import './index.less'

const TYPE_OPTIONS = ['功能异常', '体验问题', '新功能建议', '内容反馈', '其他']

type Draft = {
  typeIndex: number
  content: string
  contact: string
}

function loadDraft(): Draft {
  const d = getStorageJson<Partial<Draft>>(STORAGE_KEYS.feedbackDraft)
  return {
    typeIndex: Number.isFinite(Number(d?.typeIndex)) ? Number(d?.typeIndex) : 0,
    content: typeof d?.content === 'string' ? d.content : '',
    contact: typeof d?.contact === 'string' ? d.contact : '',
  }
}

export default function FeedbackPage() {
  const runtimeEnv = Taro.getEnv()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [typeIndex, setTypeIndex] = useState(0)
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')

  useLoad(() => {
    void (async () => {
      const ok = await ensureAuthedAndOnboardedOrRedirect()
      if (!ok) return
      const d = loadDraft()
      setTypeIndex(Math.max(0, Math.min(d.typeIndex, TYPE_OPTIONS.length - 1)))
      setContent(d.content)
      setContact(d.contact)
      setLoading(false)
    })()
  })

  const goBack = () => {
    Taro.navigateBack().catch(() => Taro.redirectTo({ url: '/pages/setting/index' }))
  }

  useEffect(() => {
    if (loading) return
    setStorageJson(STORAGE_KEYS.feedbackDraft, { typeIndex, content, contact })
  }, [typeIndex, content, contact, loading])

  const contentOk = useMemo(() => content.trim().length >= 5, [content])

  const onSubmit = async () => {
    if (submitting) return
    const v = content.trim()
    if (v.length < 5) {
      Taro.showToast({ title: '请填写至少 5 个字', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await submitFeedback({
        typeIndex,
        content: v,
        contact: contact.trim() || undefined,
        meta: { env: runtimeEnv },
      })
      setStorageJson(STORAGE_KEYS.feedbackDraft, null)
      setContent('')
      setContact('')
      Taro.showToast({ title: '提交成功', icon: 'none' })
      setTimeout(() => {
        Taro.navigateBack().catch(() => Taro.redirectTo({ url: '/pages/setting/index' }))
      }, 400)
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
              <View className="headerRow">
                <FCPressable className="backBtn" onClick={goBack}>
                  <Text className="backIcon">←</Text>
                </FCPressable>
                <Text className="title">反馈</Text>
              </View>
              <Text className="desc">正在加载...</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="headerRow">
              <FCPressable className="backBtn" onClick={goBack}>
                <Text className="backIcon">←</Text>
              </FCPressable>
              <Text className="title">反馈</Text>
            </View>
            <Text className="desc">我们会优先修复影响记录与数据可靠性的体验问题。</Text>

            <View className="section">
              <Text className="sectionTitle">类型</Text>
              <View className="options">
                {TYPE_OPTIONS.map((label, idx) => (
                  <FCOptionCard key={label} label={label} active={typeIndex === idx} onClick={() => setTypeIndex(idx)} />
                ))}
              </View>
            </View>

            <View className="section">
              <Text className="sectionTitle">描述</Text>
              <Text className="muted">请尽量包含：你做了什么、期望是什么、实际发生了什么。</Text>
              <Textarea
                className="textarea"
                value={content}
                onInput={(e) => setContent(String(e.detail.value || ''))}
                maxlength={500}
                placeholder="例如：提交后提示失败，但我不确定记录有没有保存；希望能有明确的重试入口。"
              />
              <Text className="muted">{content.trim().length}/500</Text>
            </View>

            <View className="section">
              <Text className="sectionTitle">联系方式（可选）</Text>
              <FCTextField
                value={contact}
                onChange={(v) => setContact(v)}
                placeholder="邮箱 / 微信号 / 其他"
                helperText="仅用于进一步确认问题细节"
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <FCButton loading={submitting} disabled={!contentOk || submitting} fullWidth onClick={() => void onSubmit()}>
                提交反馈
              </FCButton>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
