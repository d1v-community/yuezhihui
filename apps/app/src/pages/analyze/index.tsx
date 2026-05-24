import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { useCallback, useMemo, useState } from 'react'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCNotice, FCPressable, FCTabBar } from '../../ui'
import type { AnalysisCycleListItem, AnalysisOverview } from '../../services/analysis'
import { getAnalysisCycles, getAnalysisOverview } from '../../services/analysis'
import { createOverviewShare } from '../../services/share'
import './index.less'

export default function AnalyzePage() {
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  useLoad(() => {
    void ensureAuthedAndOnboardedOrRedirect()
  })

  const [overview, setOverview] = useState<AnalysisOverview | null>(null)
  const [cycles, setCycles] = useState<AnalysisCycleListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const canLoadMore = cycles.length < total

  const loadPage = useCallback(
    async (nextPage: number, opts?: { reset?: boolean }) => {
      setLoading(true)
      setError(null)
      try {
        const [ov, list] = await Promise.all([
          opts?.reset ? getAnalysisOverview(6) : Promise.resolve(overview),
          getAnalysisCycles({ page: nextPage, pageSize }),
        ])
        if (ov) setOverview(ov)
        setTotal(list.total)
        setPage(list.page)
        setCycles((prev) => (opts?.reset ? list.list : [...prev, ...list.list]))
      } catch (e: any) {
        setError(e?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [overview],
  )

  useDidShow(() => {
    // On tab switch back, refresh once to avoid stale overview.
    if (!overview && cycles.length === 0 && !loading) {
      void loadPage(1, { reset: true })
    }
  })

  const headerText = useMemo(() => {
    if (!overview) return '分析'
    return `分析 · ${overview.healthScore}分`
  }, [overview])

  async function shareOverview() {
    if (sharing) return
    setSharing(true)
    try {
      const resp = await createOverviewShare(6)
      const text = isH5 ? `${(window as any)?.location?.origin || ''}${resp.path}` : resp.shareCode
      await Taro.setClipboardData({ data: text })
      Taro.showToast({ title: isH5 ? '已复制分享链接' : '已复制分享码', icon: 'none' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '创建分享失败', icon: 'none' })
    } finally {
      setSharing(false)
    }
  }

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="row">
              <Text className="title">{headerText}</Text>
              <View className="headerActions">
                <FCButton size="sm" variant="ghost" loading={sharing} onClick={() => void shareOverview()}>
                  分享
                </FCButton>
                <FCButton size="sm" variant="secondary" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                  设置
                </FCButton>
              </View>
            </View>
            {!overview ? (
              <Text className="desc">记录会自动汇总为周期，并生成趋势与风险提示。</Text>
            ) : (
              <View className="ovRow">
                <View className="ovItem">
                  <Text className="ovLabel">趋势</Text>
                  <Text className="ovValue">{overview.trend.status}</Text>
                </View>
                <View className="ovItem">
                  <Text className="ovLabel">规律性</Text>
                  <Text className="ovValue">{overview.regularity.status}</Text>
                </View>
                <View className="ovItem">
                  <Text className="ovLabel">周期数</Text>
                  <Text className="ovValue">{overview.cycleCount}</Text>
                </View>
              </View>
            )}

            {loading && !overview ? (
              <View className="anLoadingRow">
                <View className="fc-spinner fc-spinnerDark" />
                <Text className="anLoadingText">正在生成分析…</Text>
              </View>
            ) : null}

            {error ? (
              <FCNotice
                variant="warn"
                title="分析暂时无法加载"
                desc={error}
                style={{ marginTop: 10 }}
              />
            ) : null}

            {!overview && !loading ? (
              <FCButton style={{ marginTop: 12 }} fullWidth onClick={() => void loadPage(1, { reset: true })}>
                开始分析
              </FCButton>
            ) : null}
          </View>

          {overview?.risks?.length ? (
            <View className="section">
              <Text className="sectionTitle">风险提示</Text>
              <View className="riskList">
                {overview.risks.slice(0, 5).map((r) => (
                  <FCPressable
                    key={r.title + r.level}
                    className="riskItem"
                    onClick={() => {
                      if (!r.url) return
                      Taro.setClipboardData({ data: r.url })
                      Taro.showToast({ title: '已复制解释链接', icon: 'none' })
                    }}
                  >
                    <View className="riskTop">
                      <Text className="riskTitle">{r.title}</Text>
                      <Text className={['riskLevel', r.level === '较高风险' ? 'riskHigh' : 'riskMid'].join(' ')}>
                        {r.level}
                      </Text>
                    </View>
                    <Text className="riskDesc">{r.triggerText}</Text>
                  </FCPressable>
                ))}
                <Text className="hint">点击风险卡片可复制百科解释链接（用于跨端查看）。</Text>
              </View>
            </View>
          ) : null}

          <View className="section">
            <View className="row">
              <Text className="sectionTitle">周期列表</Text>
              <FCButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  void loadPage(1, { reset: true })
                }}
              >
                刷新
              </FCButton>
            </View>

            {cycles.length === 0 && overview && !loading ? (
              <Text className="hint">暂无可分析的周期。先去“每日”记录出血/事件，之后回来看看。</Text>
            ) : null}

            <View className="cycleList">
              {cycles.map((c) => {
                const abnormalTags = [c.distribution, c.color, c.clot]
                  .filter((j) => j.status === '异常')
                  .slice(0, 2)
                  .map((j) => j.status)
                return (
                  <FCPressable
                    key={String(c.cycleId)}
                    className="cycleItem"
                    onClick={() =>
                      Taro.navigateTo({ url: `/pages/analyze/cycle/index?cycleId=${encodeURIComponent(String(c.cycleId))}` })
                    }
                  >
                    <View className="cycleTop">
                      <Text className="cycleTitle">
                        {c.startDate} ~ {c.endDate}
                      </Text>
                      <Text className="cycleMeta">{c.daysCount}天 · {c.totalVolumeMl}mL</Text>
                    </View>
                    <View className="cycleTags">
                      <Text className={['tag', c.level.status.includes('偏') ? 'tagWarn' : 'tagOk'].join(' ')}>
                        {c.level.status}
                      </Text>
                      <Text className={['tag', c.distribution.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                        分布{c.distribution.status}
                      </Text>
                      <Text className={['tag', c.color.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                        颜色{c.color.status}
                      </Text>
                      <Text className={['tag', c.clot.status === '异常' ? 'tagWarn' : 'tagOk'].join(' ')}>
                        血块{c.clot.status}
                      </Text>
                      {abnormalTags.length === 0 ? <Text className="tag tagOk">整体正常</Text> : null}
                    </View>
                  </FCPressable>
                )
              })}
            </View>

            {canLoadMore ? (
              <FCButton
                fullWidth
                loading={loading}
                variant="secondary"
                style={{ marginTop: 12 }}
                onClick={() => void loadPage(page + 1)}
              >
                {loading ? '加载中...' : '加载更多'}
              </FCButton>
            ) : cycles.length > 0 ? (
              <Text className="hint">已加载全部周期。</Text>
            ) : null}
          </View>

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
        </View>
      </View>
    </View>
  )
}
