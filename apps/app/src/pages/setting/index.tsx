import { useEffect, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Switch } from '@tarojs/components'
import { STORAGE_KEYS } from '../../storage/keys'
import { getStorageJson, removeStorage, setStorageJson } from '../../storage/storage'
import { authMe } from '../../services/auth'
import { onboardingV2Position, onboardingV2State } from '../../services/onboardingV2'
import { updateUserProfile } from '../../services/user'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCPressable, FCTextField, FCTabBar } from '../../ui'
import './index.less'

type VisibilitySettings = {
  sanitaryPad: boolean
  bleeding: boolean
}

type InputMode = 'click' | 'drag'

type InputModeSettings = {
  sanitaryPad: InputMode
  tampon: InputMode
}

const DEFAULT_VISIBILITY: VisibilitySettings = {
  sanitaryPad: true,
  bleeding: true,
}

const DEFAULT_INPUT_MODE: InputModeSettings = {
  sanitaryPad: 'click',
  tampon: 'click',
}

function loadVisibility(): VisibilitySettings {
  const v = getStorageJson<Partial<VisibilitySettings>>(STORAGE_KEYS.visibilitySettings)
  return {
    sanitaryPad: typeof v?.sanitaryPad === 'boolean' ? v.sanitaryPad : DEFAULT_VISIBILITY.sanitaryPad,
    bleeding: typeof v?.bleeding === 'boolean' ? v.bleeding : DEFAULT_VISIBILITY.bleeding,
  }
}

function loadInputMode(): InputModeSettings {
  const v = getStorageJson<Partial<InputModeSettings>>(STORAGE_KEYS.inputModeSettings)
  return {
    sanitaryPad: (v?.sanitaryPad === 'click' || v?.sanitaryPad === 'drag') ? v.sanitaryPad : DEFAULT_INPUT_MODE.sanitaryPad,
    tampon: (v?.tampon === 'click' || v?.tampon === 'drag') ? v.tampon : DEFAULT_INPUT_MODE.tampon,
  }
}

export default function SettingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meEmail, setMeEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [consentText, setConsentText] = useState<string>('未读取')
  // Initialize from storage to avoid overwriting saved values on first render.
  const [visibility, setVisibility] = useState<VisibilitySettings>(() => loadVisibility())
  const [inputMode, setInputMode] = useState<InputModeSettings>(() => loadInputMode())
  const [useTampon, setUseTampon] = useState(true)
  const [savingUseTampon, setSavingUseTampon] = useState(false)

  useLoad(() => {
    void (async () => {
      const ok = await ensureAuthedAndOnboardedOrRedirect()
      if (!ok) return
      setLoading(true)
      try {
        const me = await authMe()
        if ('authenticated' in me && me.authenticated) {
          setMeEmail(me.user.email || null)
          setDisplayName(me.user.displayName || me.user.username || '')
          setUseTampon(me.user.useTampon !== false)
        }

        const st = await onboardingV2State()
        const a0 = (st?.answers as any)?.A0_consent_research
        if (a0?.type === 'single') {
          setConsentText(a0.value === 'yes' ? '已同意' : '未同意')
        } else {
          setConsentText('未填写')
        }

        // Local-only settings are already hydrated from storage. Keep as-is.
      } catch {
        // keep the page usable with local values
        setConsentText('未读取')
      } finally {
        setLoading(false)
      }
    })()
  })

  useEffect(() => {
    setStorageJson(STORAGE_KEYS.visibilitySettings, visibility)
  }, [visibility])

  useEffect(() => {
    setStorageJson(STORAGE_KEYS.inputModeSettings, inputMode)
  }, [inputMode])

  const canSaveProfile = useMemo(() => displayName.trim().length >= 1 && displayName.trim().length <= 64, [displayName])

  const onSaveProfile = async () => {
    if (saving || !canSaveProfile) return
    setSaving(true)
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      Taro.showToast({ title: '已保存', icon: 'none' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const onToggleUseTampon = async (next: boolean) => {
    if (savingUseTampon) return
    const prev = useTampon
    setUseTampon(next)
    setSavingUseTampon(true)
    try {
      await updateUserProfile({ useTampon: next })
      Taro.showToast({ title: next ? '已开启棉条模块' : '已隐藏棉条模块', icon: 'none' })
    } catch (e) {
      setUseTampon(prev)
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSavingUseTampon(false)
    }
  }

  const goEditConsent = async () => {
    setSaving(true)
    try {
      await onboardingV2Position('A0_consent_research')
      Taro.navigateTo({ url: '/pages/onboarding/index' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '跳转失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const onLogout = async () => {
    removeStorage(STORAGE_KEYS.authToken)
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  const goBack = () => {
    Taro.navigateBack().catch(() => Taro.redirectTo({ url: '/pages/home/index' }))
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
                <Text className="title">设置</Text>
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
              <Text className="title">设置</Text>
            </View>
            <Text className="desc">账号 · 隐私 · 记录展示</Text>

            <View className="section">
              <Text className="sectionTitle">账号</Text>
              <Text className="muted">{meEmail || '已登录'}</Text>
              <FCTextField
                label="昵称"
                value={displayName}
                onChange={(v) => setDisplayName(v)}
                placeholder="输入昵称"
                helperText="用于分享与个人信息展示（可随时修改）"
                style={{ marginTop: 12 }}
              />
              <View style={{ marginTop: 10 }}>
                <FCButton loading={saving} disabled={!canSaveProfile || saving} fullWidth onClick={() => void onSaveProfile()}>
                  保存昵称
                </FCButton>
              </View>
            </View>

            <View className="divider" />

            <View className="section">
              <Text className="sectionTitle">隐私</Text>
              <View className="row">
                <View>
                  <Text className="rowTitle">研究同意</Text>
                  <Text className="muted">{consentText}</Text>
                </View>
                <FCButton size="sm" variant="secondary" loading={saving} onClick={() => void goEditConsent()}>
                  去修改
                </FCButton>
              </View>
            </View>

            <View className="divider" />

            <View className="section">
              <Text className="sectionTitle">记录展示</Text>
              <View className="row">
                <View>
                  <Text className="rowTitle">卫生巾模块</Text>
                  <Text className="muted">用于记录更换事件（可隐藏）</Text>
                </View>
                <Switch
                  checked={visibility.sanitaryPad}
                  onChange={(e) => setVisibility((v) => ({ ...v, sanitaryPad: Boolean(e.detail.value) }))}
                />
              </View>
              <View className="row">
                <View>
                  <Text className="rowTitle">我习惯用卫生棉条</Text>
                  <Text className="muted">用于按日记录中显示“卫生棉条”模块（会同步到账号）</Text>
                </View>
                <Switch
                  checked={useTampon}
                  disabled={savingUseTampon}
                  onChange={(e) => void onToggleUseTampon(Boolean(e.detail.value))}
                />
              </View>
              <View className="row">
                <View>
                  <Text className="rowTitle">实时血量展示</Text>
                  <Text className="muted">仅影响界面展示，不影响已记录数据</Text>
                </View>
                <Switch
                  checked={visibility.bleeding}
                  onChange={(e) => setVisibility((v) => ({ ...v, bleeding: Boolean(e.detail.value) }))}
                />
              </View>
            </View>

            <View className="divider" />

            <View className="section">
              <Text className="sectionTitle">输入模式</Text>
              <Text className="muted" style={{ marginTop: 6 }}>
                打开精确模式后，将采用拖拽滑杆的方式精确控制血量；关闭则使用点击快捷添加。
              </Text>
              <View className="row">
                <View>
                  <Text className="rowTitle">卫生巾 · 打开精确模式</Text>
                  <Text className="muted">{inputMode.sanitaryPad === 'drag' ? '精确（拖拽滑杆）' : '快捷（点击添加）'}</Text>
                </View>
                <Switch
                  checked={inputMode.sanitaryPad === 'drag'}
                  onChange={(e) => {
                    setInputMode((v) => ({ ...v, sanitaryPad: e.detail.value ? 'drag' : 'click' }))
                    Taro.showToast({ title: '已保存', icon: 'none' })
                  }}
                />
              </View>
              <View className="row">
                <View>
                  <Text className="rowTitle">卫生棉条 · 打开精确模式</Text>
                  <Text className="muted">{inputMode.tampon === 'drag' ? '精确（拖拽滑杆）' : '快捷（点击添加）'}</Text>
                </View>
                <Switch
                  checked={inputMode.tampon === 'drag'}
                  onChange={(e) => {
                    setInputMode((v) => ({ ...v, tampon: e.detail.value ? 'drag' : 'click' }))
                    Taro.showToast({ title: '已保存', icon: 'none' })
                  }}
                />
              </View>
            </View>

            <View className="divider" />

            <View className="section">
              <Text className="sectionTitle">支持与反馈</Text>
              <FCButton variant="secondary" fullWidth onClick={() => Taro.navigateTo({ url: '/pages/feedback/index' })}>
                提交反馈
              </FCButton>
            </View>

            <View className="divider" />

            <View className="section">
              <Text className="sectionTitle">账户</Text>
              <FCButton variant="ghost" fullWidth onClick={() => void onLogout()}>
                退出登录
              </FCButton>
            </View>
          </View>

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
        </View>
      </View>
    </View>
  )
}
