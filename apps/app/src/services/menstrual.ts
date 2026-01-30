import { apiRequest } from './api'

export type ApiResponse<T> = {
  code: number
  message: string
  data?: T
}

function unwrapApiResponse<T>(resp: ApiResponse<T> | undefined | null, fallbackMessage: string): T {
  if (!resp) throw new Error(fallbackMessage)
  if (resp.code !== 200) throw new Error(resp.message || fallbackMessage)
  return resp.data as T
}

export type MenstrualEventType = 'pad' | 'tampon' | 'symptom'
export type MenstrualColor = 'pink' | 'red' | 'rust' | 'dark' | 'brown'

export type MenstrualEventInput = {
  eventTime: string
  eventType: MenstrualEventType
  productType?: string
  brand?: string
  series?: string
  lengthMm?: number
  model?: string
  absorbency?: string
  color?: MenstrualColor
  volumeMl?: number
  symptomName?: string
}

export type MenstrualDailySummary = {
  date: string
  hasBleeding: boolean
  totalVolumeMl: number
  dayColor: MenstrualColor | null
}

export type MenstrualDailyDetail = {
  date: string
  hasBleeding: boolean
  totalVolumeMl: number
  dayColor: MenstrualColor | null
  clotCounts: { small: number; large: number }
  events: Array<
    {
      id: number
    } & MenstrualEventInput
  >
}

export async function getMenstrualDailyRange(start: string, end: string): Promise<MenstrualDailySummary[]> {
  const resp = await apiRequest<ApiResponse<MenstrualDailySummary[]>>({
    path: '/api/menstrual/daily',
    method: 'GET',
    data: { start, end },
  })
  return unwrapApiResponse(resp, '获取每日记录区间数据失败')
}

export async function getMenstrualDailyByDate(date: string): Promise<MenstrualDailyDetail> {
  const resp = await apiRequest<ApiResponse<MenstrualDailyDetail>>({
    path: `/api/menstrual/daily/${encodeURIComponent(date)}`,
    method: 'GET',
  })
  return unwrapApiResponse(resp, '获取当日记录失败')
}

export async function putMenstrualDailyByDate(
  date: string,
  payload: { hasBleeding: boolean; events: MenstrualEventInput[] },
): Promise<{ date: string }> {
  const resp = await apiRequest<ApiResponse<{ date: string }>>({
    path: `/api/menstrual/daily/${encodeURIComponent(date)}`,
    method: 'PUT',
    data: payload,
  })
  return unwrapApiResponse(resp, '保存当日记录失败')
}

