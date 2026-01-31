import { apiRequest } from './api'
import type { ApiResponse, MenstrualColor } from './menstrual'

function unwrap<T>(resp: ApiResponse<T> | undefined | null, fallbackMessage: string): T {
  if (!resp) throw new Error(fallbackMessage)
  if (resp.code !== 200) throw new Error(resp.message || fallbackMessage)
  return resp.data as T
}

export type AnalysisJudge = { status: string; link: string }

export type AnalysisCycleListItem = {
  cycleId: number
  startDate: string
  endDate: string
  daysCount: number
  totalVolumeMl: number
  level: AnalysisJudge
  distribution: AnalysisJudge
  color: AnalysisJudge
  clot: AnalysisJudge
}

export type AnalysisCycleList = {
  page: number
  pageSize: number
  total: number
  list: AnalysisCycleListItem[]
}

export type AnalysisCycleDay = {
  dayIndex: number
  date: string
  totalVolumeMl: number
  dayColor: MenstrualColor | null
  clotCounts: { small: number; large: number }
  clotLevel: '无' | '小' | '大' | '多'
  products: Array<{
    id: number
    eventTime: string
    eventType: 'pad' | 'tampon'
    productType: string | null
    brand: string | null
    series: string | null
    lengthMm: number | null
    model: string | null
    absorbency: string | null
    color: MenstrualColor | null
    volumeMl: number
  }>
  symptoms: string[]
}

export type AnalysisCycleDetail = {
  cycle: {
    cycleId: number
    startDate: string
    endDate: string
    daysCount: number
    totalVolumeMl: number
    level: AnalysisJudge
    distribution: AnalysisJudge
    color: AnalysisJudge
    clot: AnalysisJudge
  }
  days: AnalysisCycleDay[]
  products: {
    events: Array<{
      id: number
      date: string
      eventTime: string
      eventType: 'pad' | 'tampon'
      productType: string | null
      brand: string | null
      series: string | null
      lengthMm: number | null
      model: string | null
      absorbency: string | null
      color: MenstrualColor | null
      volumeMl: number
      approxBucketMl: 1 | 5 | 10 | 20
    }>
    settlement: {
      rows: string[][]
      stats: Array<{
        text: string
        kind: string
        dim: string
        approxBucketMl: number
        count: number
      }>
    }
  }
}

export type AnalysisOverview = {
  cycleCount: number
  healthScore: number
  trend: { status: '平稳' | '略有波动' | '剧烈波动' }
  regularity: { status: string; link: string }
  cycleTimeline: Array<{
    cycleStart: string
    startLabel: string
    menstrualDays: number
    intervalDays: number | null
    totalVolumeMl: number
  }>
  risks: Array<{
    title: string
    level: '较高风险' | '中等风险'
    url: string
    triggerText: string
  }>
}

export type AnalysisHealthScoreDetail = {
  cycleCount: number
  baseScore: number
  healthScore: number
  totalDeduct: number
  items: Array<{ trigger: string; deduct: number }>
}

export async function getAnalysisOverview(limit = 6): Promise<AnalysisOverview> {
  const resp = await apiRequest<ApiResponse<AnalysisOverview>>({
    path: '/api/analysis/overview',
    method: 'GET',
    data: { limit },
  })
  return unwrap(resp, '获取总览分析失败')
}

export async function getAnalysisHealthScoreDetail(limit = 6): Promise<AnalysisHealthScoreDetail> {
  const resp = await apiRequest<ApiResponse<AnalysisHealthScoreDetail>>({
    path: '/api/analysis/health-score-detail',
    method: 'GET',
    data: { limit },
  })
  return unwrap(resp, '获取健康分数明细失败')
}

export async function getAnalysisCycles(params: { page: number; pageSize: number }): Promise<AnalysisCycleList> {
  const resp = await apiRequest<ApiResponse<AnalysisCycleList>>({
    path: '/api/analysis/cycles',
    method: 'GET',
    data: params,
  })
  return unwrap(resp, '获取周期列表失败')
}

export async function getAnalysisCycleDetail(cycleId: number): Promise<AnalysisCycleDetail> {
  const resp = await apiRequest<ApiResponse<AnalysisCycleDetail>>({
    path: `/api/analysis/cycles/${encodeURIComponent(String(cycleId))}`,
    method: 'GET',
  })
  return unwrap(resp, '获取周期详情失败')
}

