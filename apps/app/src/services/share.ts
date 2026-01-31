import { apiRequest } from './api'
import type { ApiResponse } from './menstrual'

export type ShareCreateResp = {
  shareCode: string
  expireAt: string
  path: string
}

function unwrap<T>(resp: ApiResponse<T> | undefined | null, fallbackMessage: string): T {
  if (!resp) throw new Error(fallbackMessage)
  if (resp.code !== 200) throw new Error(resp.message || fallbackMessage)
  return resp.data as T
}

export async function createPeriodShare(cycleId: number): Promise<ShareCreateResp> {
  const resp = await apiRequest<ApiResponse<ShareCreateResp>>({
    path: '/api/share',
    method: 'POST',
    data: { type: 'period', cycleId },
  })
  return unwrap(resp, '创建分享失败')
}

export async function createOverviewShare(limit = 6): Promise<ShareCreateResp> {
  const resp = await apiRequest<ApiResponse<ShareCreateResp>>({
    path: '/api/share',
    method: 'POST',
    data: { type: 'overview', limit },
  })
  return unwrap(resp, '创建分享失败')
}

