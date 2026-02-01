export type ApiResponse<T> = {
  code: number
  message: string
  data?: T
}

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 200, message, data }
}

export function fail(message: string, code = 400): ApiResponse<never> {
  return { code, message }
}

