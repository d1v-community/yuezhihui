import { apiRequest } from './api'
import type { ApiResponse } from './menstrual'

export type UpdateProfilePayload = {
  displayName?: string
  avatarUrl?: string
}

function unwrap<T>(resp: ApiResponse<T> | undefined | null, fallbackMessage: string): T {
  if (!resp) throw new Error(fallbackMessage)
  if (resp.code !== 200) throw new Error(resp.message || fallbackMessage)
  return resp.data as T
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<{ ok: true }> {
  const resp = await apiRequest<ApiResponse<{ ok: true }>>({
    path: '/api/user/profile',
    method: 'PATCH',
    data: payload,
  })
  return unwrap(resp, '更新资料失败')
}

