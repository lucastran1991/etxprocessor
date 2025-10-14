import axios from 'axios'
import Cookies from 'js-cookie'

function resolveApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL
  if (explicit && explicit.trim().length > 0) return explicit

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:'
    const host = window.location.hostname
    // Default backend port in our stack
    const backendPort = '8000'
    return `${protocol}//${host}:${backendPort}`
  }

  // Fallback for SSR/build-time
  return 'http://localhost:8000'
}

const API_URL = resolveApiUrl()

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
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
