import axios from 'axios'

const DEFAULT_DEV_API_URL = 'http://localhost:4000'
const localHostnames = new Set(['localhost', '127.0.0.1'])

const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return ''
  }

  const trimmedValue = trimTrailingSlash(value.trim())

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.startsWith('/')) {
    return trimmedValue === '/' ? '' : trimmedValue
  }

  try {
    const parsedUrl = new URL(trimmedValue)

    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      parsedUrl.protocol === 'http:' &&
      !localHostnames.has(parsedUrl.hostname)
    ) {
      parsedUrl.protocol = 'https:'
    }

    return trimTrailingSlash(parsedUrl.toString())
  } catch (error) {
    console.error('FULL ERROR:', error)

    if (import.meta.env.DEV) {
      console.warn(`[api] Invalid VITE_BACKEND_URL "${trimmedValue}". Falling back to ${DEFAULT_DEV_API_URL}.`)
      return DEFAULT_DEV_API_URL
    }

    return trimmedValue
  }
}

export const apiBaseUrl =
  normalizeApiBaseUrl(import.meta.env.VITE_BACKEND_URL) ||
  (import.meta.env.DEV ? DEFAULT_DEV_API_URL : '')

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
})

if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase() || 'GET'
    const requestUrl = `${config.baseURL || ''}${config.url || ''}`
    console.log(`[API REQUEST] ${method} ${requestUrl}`)
    return config
  })

  api.interceptors.response.use(
    (response) => {
      console.log(`[API RESPONSE] ${response.status} ${response.config.url}`)
      return response
    },
    (error) => {
      console.error('FULL ERROR:', error)
      return Promise.reject(error)
    }
  )
}

export const getApiErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Network Error'
  }

  return error instanceof Error ? error.message : 'Something went wrong'
}
