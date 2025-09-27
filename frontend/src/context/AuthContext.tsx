'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  userId: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('auth-token')
    const userData = Cookies.get('user-data')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse user data:', error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await authApi.login(email, password)
      
      const userData = {
        userId: response.userId,
        email: response.email,
      }

      Cookies.set('auth-token', response.token, { expires: 7 })
      Cookies.set('user-data', JSON.stringify(userData), { expires: 7 })
      
      setUser(userData)
      toast.success('Welcome back!')
      return true
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await authApi.register(email, password)
      
      const userData = {
        userId: response.userId,
        email: response.email,
      }

      Cookies.set('auth-token', response.token, { expires: 7 })
      Cookies.set('user-data', JSON.stringify(userData), { expires: 7 })
      
      setUser(userData)
      toast.success('Account created successfully!')
      return true
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    Cookies.remove('auth-token')
    Cookies.remove('user-data')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
