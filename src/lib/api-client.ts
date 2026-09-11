import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/config/env'

/**
 * The API authenticates with HTTP-only JWT cookies (`access_token` /
 * `refresh_token`), so every request must carry credentials and no token is
 * ever readable from JS.
 */
export const apiClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Paths that must never trigger a refresh-and-retry cycle.
 *
 * This matters more than it looks: a failed login answers **401**, the same
 * status as an expired session. Without this list, wrong credentials would
 * kick off a refresh and silently replay the login.
 */
const AUTH_PATHS = ['/auth/login/', '/auth/logout/', '/auth/token/refresh/']

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

/**
 * A single in-flight refresh shared by every request that got a 401, so a
 * burst of parallel queries triggers one refresh instead of N.
 */
let refreshPromise: Promise<void> | null = null

function refreshSession(): Promise<void> {
  refreshPromise ??= apiClient
    .post('/auth/token/refresh/')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    const isRefreshable =
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !AUTH_PATHS.some((path) => config.url?.includes(path))

    if (!isRefreshable) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      await refreshSession()
      return await apiClient(config)
    } catch {
      // Refresh failed — the session is genuinely gone. Surface the original
      // 401 and let the route guard redirect to /login.
      return Promise.reject(error)
    }
  },
)

/**
 * Every error this API returns shares one envelope, including framework-raised
 * 404s and Pydantic validation failures:
 *
 *     {"error": {"code": "...", "message": "...", "details": {...}}}
 */
type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
    details?: { errors?: Array<{ loc?: string[]; msg?: string }> }
  }
}

/** The API's `error.code` for the failure, when there is one. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined
  }

  return (error.response?.data as ApiErrorBody | undefined)?.error?.code
}

/**
 * Turn an unknown thrown value into a message safe to show a user.
 * The API already writes human-readable messages, so prefer its own.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const body = error.response.data as ApiErrorBody | undefined
  const apiError = body?.error

  if (!apiError) {
    return fallback
  }

  // A validation failure's top-level message is generic ("The request failed
  // validation."); the useful text is in the first field error.
  if (apiError.code === 'validation_error') {
    const first = apiError.details?.errors?.[0]
    if (first?.msg) {
      return first.msg
    }
  }

  return apiError.message ?? fallback
}

/** Narrow helper for endpoints that return a body. */
export async function unwrap<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
  const response = await promise
  return response.data
}
