import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { removeStorage, setStorageString } from '../../storage/storage'
import { authMe, authSendCode, authVerifyLogin } from '../../services/auth'
import { onboardingV2State } from '../../services/onboardingV2'
import './index.less'

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const codeInputRef = useRef<any>(null)

  const emailOk = useMemo(() => isEmail(email.trim()), [email])
  const codeOk = useMemo(() => code.trim().length === 6, [code])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const goNextAfterLogin = async () => {
    const me = await authMe()
    if (!('authenticated' in me) || me.authenticated !== true) {
      removeStorage(STORAGE_KEYS.authToken)
      throw new Error('登录态无效，请重新登录')
    }

    const st = await onboardingV2State()
    if (st?.session?.status === 'completed') {
      Taro.redirectTo({ url: '/pages/home/index' })
    } else {
      Taro.redirectTo({ url: '/pages/onboarding/index' })
    }
  }

  const onSend = async () => {
    if (loading) return
    const v = email.trim()
    if (!isEmail(v)) {
      Taro.showToast({ title: '请输入正确邮箱', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await authSendCode(v)
      if (!res?.success) {
        throw new Error(res?.error || '发送失败，请稍后重试')
      }
      setDevCode(res?.dev && res?.code ? String(res.code) : null)
      setStep('code')
      setCooldown(60)
      setCode('')
      Taro.showToast({ title: '验证码已发送', icon: 'none' })
      // focus code input (best-effort)
      setTimeout(() => {
        try {
          codeInputRef.current?.focus?.()
        } catch {
          // ignore
        }
      }, 50)
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '发送失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async () => {
    if (loading) return
    const vEmail = email.trim()
    const vCode = code.trim()
    if (!isEmail(vEmail)) {
      Taro.showToast({ title: '请输入正确邮箱', icon: 'none' })
      return
    }
    if (vCode.length !== 6) {
      Taro.showToast({ title: '请输入 6 位验证码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await authVerifyLogin(vEmail, vCode)
      if (!res?.success || !res.token) {
        throw new Error(res?.error || '验证码无效或已过期')
      }
      setStorageString(STORAGE_KEYS.authToken, res.token)
      await goNextAfterLogin()
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const resendText = cooldown > 0 ? `重新发送（${cooldown}s）` : '重新发送'

  const renderCodeBoxes = () => {
    const v = code.trim()
    const digits = v.split('').slice(0, 6)
    const activeIdx = Math.min(digits.length, 5)
    return (
      <View
        className="codeWrap"
        onClick={() => {
          try {
            codeInputRef.current?.focus?.()
          } catch {
            // ignore
          }
        }}
      >
        <Input
          ref={codeInputRef}
          className="codeHiddenInput"
          value={v}
          type="number"
          maxlength={6}
          focus
          onInput={(e) => {
            const raw = String(e.detail.value || '')
            const next = raw.replace(/\D/g, '').slice(0, 6)
            setCode(next)
            if (next.length === 6) {
              // auto-verify on complete (fast path)
              void onVerify()
            }
          }}
          disabled={loading}
        />
        <View className="codeBoxes">
          {Array.from({ length: 6 }, (_, i) => {
            const ch = digits[i] || ''
            const active = i === activeIdx
            return (
              <View key={i} className={`codeBox ${active ? 'codeBoxActive' : ''}`}>
                <Text className="codeChar">{ch || ' '}</Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="brandRow">
            <View className="brandMark">
              <Text className="brandMarkText">FC</Text>
            </View>
          </View>

          <Text className="heroTitle">FlowCycle</Text>
          <Text className="heroDesc">用邮箱验证码登录，继续完成 Onboarding，并开始按日记录。</Text>

          <View className="card">
            <View className="field" style={{ marginTop: 0 }}>
              <Text className="label">邮箱</Text>
              <Input
                className="input"
                value={email}
                onInput={(e) => setEmail(String(e.detail.value || ''))}
                placeholder="name@example.com"
                type="text"
                disabled={loading || step === 'code'}
                confirmType="next"
              />
              <View className="helperRow">
                <Text className="helperText">{step === 'code' ? '验证码已发送到该邮箱' : '我们不会发送营销邮件'}</Text>
                {step === 'code' ? (
                  <Text
                    className="linkBtn"
                    onClick={() => {
                      setStep('email')
                      setCode('')
                      setDevCode(null)
                      setCooldown(0)
                    }}
                  >
                    修改邮箱
                  </Text>
                ) : null}
              </View>
            </View>

            {step === 'code' ? (
              <View className="field">
                <Text className="label">验证码</Text>
                {renderCodeBoxes()}
                <View className="helperRow">
                  <Text className="helperText">输入 6 位数字，将自动验证</Text>
                  <Text
                    className="linkBtn"
                    onClick={() => {
                      if (cooldown > 0 || loading) return
                      void onSend()
                    }}
                    style={{ opacity: cooldown > 0 || loading ? 0.55 : 1 }}
                  >
                    {resendText}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="actions">
              {step === 'email' ? (
                <Button type="primary" loading={loading} disabled={!emailOk || loading} onClick={onSend}>
                  发送验证码
                </Button>
              ) : (
                <Button type="primary" loading={loading} disabled={!codeOk || loading} onClick={onVerify}>
                  登录
                </Button>
              )}
            </View>

            {devCode ? (
              <View className="devCallout">
                <View>
                  <Text className="devHint">开发环境验证码</Text>
                  <Text className="devCode">{devCode}</Text>
                </View>
                <Text
                  className="linkBtn"
                  onClick={async () => {
                    try {
                      await Taro.setClipboardData({ data: devCode })
                      Taro.showToast({ title: '已复制', icon: 'none' })
                    } catch {
                      Taro.showToast({ title: '复制失败', icon: 'none' })
                    }
                  }}
                >
                  复制
                </Text>
              </View>
            ) : null}

            <Text className="footNote">
              继续即表示你同意我们仅为提供服务而处理你的数据；你可以随时退出或删除本地缓存。
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
