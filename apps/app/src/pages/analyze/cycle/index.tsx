import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { ensureAuthedAndOnboardedOrRedirect } from '../../../utils/authGuard'
import { FCActionBar, FCButton, FCNotice, FCPressable, FCTabBar } from '../../../ui'
import type { AnalysisCycleDetail } from '../../../services/analysis'
import { getAnalysisCycleDetail } from '../../../services/analysis'
import { createPeriodShare } from '../../../services/share'
import './index.less'

function asPosInt(v: any): number | null {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

export default function AnalyzeCycleDetailPage() {
  const router = useRouter()
  const cycleId = useMemo(() => asPosInt((router as any)?.params?.cycleId), [router])

  const [detail, setDetail] = useState<AnalysisCycleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  async function load() {
    if (!cycleId) {
      setError('cycleId 参数缺失')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getAnalysisCycleDetail(cycleId)
      setDetail(data)
    } catch (e: any) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function sharePeriod() {
    if (!cycleId || sharing) return
    setSharing(true)
    try {
      const resp = await createPeriodShare(cycleId)
      const text =
        process.env.TARO_ENV === 'h5'
          ? `${(window as any)?.location?.origin || ''}${resp.path}`
          : resp.shareCode
      await Taro.setClipboardData({ data: text })
      Taro.showToast({ title: process.env.TARO_ENV === 'h5' ? '已复制分享链接' : '已复制分享码', icon: 'none' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '创建分享失败', icon: 'none' })
    } finally {
      setSharing(false)
    }
  }

  useLoad(() => {
    void ensureAuthedAndOnboardedOrRedirect()
    void load()
  })

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="row">
              <Text className="title">周期详情</Text>
              <View className="rowRight">
                <FCButton size="sm" variant="ghost" loading={sharing} onClick={() => void sharePeriod()}>
                  分享
                </FCButton>
                <FCPressable
                  className="iconBtn"
                  onClick={() => Taro.navigateBack().catch(() => Taro.redirectTo({ url: '/pages/analyze/index' }))}
                >
                  <Text className="iconBtnText">←</Text>
                </FCPressable>
                <FCButton size="sm" variant="ghost" loading={loading} onClick={() => void load()}>
                  刷新
                </FCButton>
              </View>
            </View>

            {error ? <FCNotice variant="warn" title="加载失败" desc={error} style={{ marginTop: 10 }} /> : null}

            {detail ? (
              <View className="summary">
                <Text className="summaryTitle">
                  {detail.cycle.startDate} ~ {detail.cycle.endDate}
                </Text>
                <Text className="summaryMeta">
                  {detail.cycle.daysCount}天 · {detail.cycle.totalVolumeMl}mL
                </Text>
                <View className="tags">
                  <Text className={['tag', detail.cycle.level.status.includes('偏') ? 'tagWarn' : 'tagOk'].join(' ')}>
                    {detail.cycle.level.status}
                  </Text>
                  <Text className={['tag', detail.cycle.distribution.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                    分布{detail.cycle.distribution.status}
                  </Text>
                  <Text className={['tag', detail.cycle.color.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                    颜色{detail.cycle.color.status}
                  </Text>
                  <Text className={['tag', detail.cycle.clot.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                    血块{detail.cycle.clot.status}
                  </Text>
                </View>
                <Text className="hint">
                  点击任意标签会复制对应的百科解释链接（用于跨端查看）。
                </Text>
                <View className="tagLinks">
                  {[
                    { label: '水平解释', link: detail.cycle.level.link },
                    { label: '分布解释', link: detail.cycle.distribution.link },
                    { label: '颜色解释', link: detail.cycle.color.link },
                    { label: '血块解释', link: detail.cycle.clot.link },
                  ].map((x) => (
                    <FCPressable
                      key={x.label}
                      className="linkChip"
                      onClick={() => {
                        Taro.setClipboardData({ data: x.link })
                        Taro.showToast({ title: '已复制链接', icon: 'none' })
                      }}
                    >
                      <Text className="linkChipText">{x.label}</Text>
                    </FCPressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {detail ? (
            <View className="section">
              <Text className="sectionTitle">日明细</Text>
              <View className="dayList">
                {detail.days.map((d) => (
                  <View key={d.date} className="dayItem">
                    <View className="dayTop">
                      <Text className="dayTitle">
                        D{d.dayIndex} · {d.date}
                      </Text>
                      <Text className="dayMeta">{d.totalVolumeMl}mL</Text>
                    </View>
                    <Text className="dayDesc">
                      颜色：{d.dayColor || '未记录'}；血块：{d.clotLevel}
                      {d.symptoms.length ? `；症状：${d.symptoms.join('、')}` : ''}
                    </Text>
                    {d.products.length ? (
                      <Text className="dayDesc">用品事件：{d.products.length} 条</Text>
                    ) : null}
                  </View>
                ))}
                {detail.days.length === 0 ? <Text className="hint">该周期暂无出血日数据。</Text> : null}
              </View>
            </View>
          ) : null}

          {detail?.products?.settlement?.stats?.length ? (
            <View className="section">
              <Text className="sectionTitle">用品结算</Text>
              <View className="settleList">
                {detail.products.settlement.stats.slice(0, 20).map((s) => (
                  <Text key={s.text} className="settleItem">
                    {s.text}
                  </Text>
                ))}
              </View>
              <Text className="hint">结算为“估算桶”统计，仅用于趋势参考。</Text>
            </View>
          ) : null}

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
        </View>
      </View>
    </View>
  )
}
