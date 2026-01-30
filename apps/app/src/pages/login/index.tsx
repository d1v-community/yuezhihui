import { useState } from 'react'
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
      Taro.showToast({ title: '验证码已发送', icon: 'none' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '发送失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async () => {
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

  return (
    <View className="page">
      <View className="card">
        <Text className="title">邮箱登录</Text>
        <Text className="desc">使用邮箱验证码登录。登录后将进入问卷 Onboarding。</Text>

        <View className="field">
          <Text className="label">邮箱</Text>
          <Input
            className="input"
            value={email}
            onInput={(e) => setEmail(String(e.detail.value || ''))}
            placeholder="name@example.com"
            type="text"
            disabled={loading || step === 'code'}
          />
        </View>

        {step === 'code' ? (
          <View className="field">
            <Text className="label">验证码</Text>
            <Input
              className="input"
              value={code}
              onInput={(e) => setCode(String(e.detail.value || ''))}
              placeholder="6 位数字"
              type="number"
              disabled={loading}
              maxlength={6}
            />
          </View>
        ) : null}

        <View className="actions">
          {step === 'email' ? (
            <Button type="primary" loading={loading} onClick={onSend}>
              发送验证码
            </Button>
          ) : (
            <>
              <Button
                loading={loading}
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setDevCode(null)
                }}
              >
                重填邮箱
              </Button>
              <Button type="primary" loading={loading} onClick={onVerify}>
                登录
              </Button>
            </>
          )}
        </View>

        {devCode ? <Text className="hint">开发环境验证码：{devCode}</Text> : null}
      </View>
    </View>
  )
}

