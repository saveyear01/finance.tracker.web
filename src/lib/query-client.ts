import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

/**
 * Never retry a request the server has already answered with an auth or
 * client error — retrying a 401/403/404 only delays the real outcome.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status && status >= 400 && status < 500) {
      return false
    }
  }

  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
})
