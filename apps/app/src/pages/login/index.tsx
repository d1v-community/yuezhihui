import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { removeStorage, setStorageString } from '../../storage/storage'
import { authMe, authSendCode, authVerifyLogin } from '../../services/auth'
import { onboardingV2State } from '../../services/onboardingV2'
import { FCButton, FCCodeInput, FCTextButton, FCTextField } from '../../ui'
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
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '发送失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (overrideCode?: string) => {
    if (loading) return
    const vEmail = email.trim()
    const vCode = (overrideCode ?? code).trim()
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
          <Text className="heroDesc">邮箱验证码登录，继续引导，开始按日记录。</Text>

          <View className="card fc-appear">
            <FCTextField
              label="邮箱"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="name@example.com"
              disabled={loading || step === 'code'}
              confirmType="next"
              helperText={step === 'code' ? '验证码已发送到该邮箱' : '我们不会发送营销邮件'}
              rightSlot={
                step === 'code' ? (
                  <FCTextButton
                    onClick={() => {
                      setStep('email')
                      setCode('')
                      setDevCode(null)
                      setCooldown(0)
                    }}
                  >
                    修改邮箱
                  </FCTextButton>
                ) : null
              }
              style={{ marginTop: 0 }}
            />

            {step === 'code' ? (
              <View className="field">
                <Text className="label">验证码</Text>
                <FCCodeInput
                  value={code}
                  length={6}
                  disabled={loading}
                  autoFocus
                  onChange={(next) => setCode(next)}
                  onComplete={(next) => {
                    setCode(next)
                    void onVerify(next)
                  }}
                />
                <View className="helperRow">
                  <Text className="helperText">输入 6 位数字，将自动验证</Text>
                  <FCTextButton
                    disabled={cooldown > 0 || loading}
                    onClick={() => {
                      if (cooldown > 0 || loading) return
                      void onSend()
                    }}
                    style={{ opacity: cooldown > 0 || loading ? 0.55 : 1 }}
                  >
                    {resendText}
                  </FCTextButton>
                </View>
              </View>
            ) : null}

            <View className="actions">
              {step === 'email' ? (
                <FCButton loading={loading} disabled={!emailOk || loading} fullWidth onClick={() => void onSend()}>
                  发送验证码
                </FCButton>
              ) : (
                <FCButton loading={loading} disabled={!codeOk || loading} fullWidth onClick={() => void onVerify()}>
                  登录
                </FCButton>
              )}
            </View>

            {devCode ? (
              <View className="devCallout">
                <View>
                  <Text className="devHint">开发环境验证码</Text>
                  <Text className="devCode">{devCode}</Text>
                </View>
                <FCTextButton
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
                </FCTextButton>
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
