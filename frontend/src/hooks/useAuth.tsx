'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/services/apiClient'
import Cookies from 'js-cookie'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar_url?: string
  level: number
  exp: number
  is_active: boolean
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, role?: string, avatar?: string) => Promise<void>
  logout: () => void
  updateUserAvatar: (avatarUrl?: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      // Verify token and get user data
      apiClient.get('/auth/me')
        .then(response => {
          setUser(response.data)
        })
        .catch(() => {
          Cookies.remove('access_token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const { access_token } = response.data
    Cookies.set('access_token', access_token, { expires: 7 })
    
    // Get user data
    const userResponse = await apiClient.get('/auth/me')
    setUser(userResponse.data)
  }

  const register = async (username: string, email: string, password: string, role: string = 'user', _avatar?: string) => {
    await apiClient.post('/auth/register', {
      username,
      email,
      password,
      role
    })
  }

  const logout = () => {
    Cookies.remove('access_token')
    setUser(null)
  }

  const updateUserAvatar = (avatarUrl?: string) => {
    setUser((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
