import { apiRequest } from './api'
import type { ApiResponse } from './menstrual'

export type SubmitFeedbackPayload = {
  typeIndex: number
  content: string
  contact?: string
  images?: string[]
  meta?: Record<string, any>
}

export type SubmitFeedbackResult = {
  id: string
}

function unwrap<T>(resp: ApiResponse<T> | undefined | null, fallbackMessage: string): T {
  if (!resp) throw new Error(fallbackMessage)
  if (resp.code !== 200) throw new Error(resp.message || fallbackMessage)
  return resp.data as T
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResult> {
  const resp = await apiRequest<ApiResponse<SubmitFeedbackResult>>({
    path: '/api/feedback',
    method: 'POST',
    data: payload,
  })
  return unwrap(resp, '提交反馈失败')
}

