import axios from 'axios'
import Cookies from 'js-cookie'
import { resolveApiBaseUrl } from '@/utils/apiBase'

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

// Ensure baseURL is resolved at request time (avoids SSR/static export bake-in)
apiClient.interceptors.request.use((config) => {
  const isAbsolute = /^https?:\/\//i.test(config.url || '')
  if (!isAbsolute) {
    const apiUrl = `${resolveApiBaseUrl()}/api/v1`
    config.baseURL = apiUrl
  }
  return config
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
