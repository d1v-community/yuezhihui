import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../storage/keys'
import { getStorageString, removeStorage } from '../storage/storage'

function getApiBaseUrl(): string {
  // H5 is served under Remix at `/app/*`, so same-origin `/api/*` works.
  if (process.env.TARO_ENV === 'h5') return ''

  // Mini-program requires full domain; configure it via env.
  const base = process.env.TARO_APP_API_BASE
  return typeof base === 'string' ? base : ''
}

type ApiRequestOptions = {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
}

export async function apiRequest<T>(opts: ApiRequestOptions): Promise<T> {
  const baseUrl = getApiBaseUrl()
  if (process.env.TARO_ENV !== 'h5' && !baseUrl) {
    throw new Error('Missing TARO_APP_API_BASE for mini-program environment')
  }

  const token = getStorageString(STORAGE_KEYS.authToken)
  const url = `${baseUrl}${opts.path}`

  const res = await Taro.request<T>({
    url,
    method: opts.method ?? 'GET',
    data: opts.data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  // Basic auth recovery: if server returns 401, clear token.
  // (Do not auto-redirect here; keep it UI-driven.)
  if (res.statusCode === 401) {
    removeStorage(STORAGE_KEYS.authToken)
  }

  return res.data
}
