'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'


interface Profile {
  id: string
  username: string
  access_code: string
  role: string
  password: string
  total_commission: number
  total_items_sold: number
}

interface AuthContextType {
  user: Profile | null
  loading: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string, accessCode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = 'gestor_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Recuperar sesión del localStorage al cargar
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (!data.success) {
      return { success: false, error: data.error }
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(data.profile))
    setUser(data.profile)
    return { success: true }
  } catch {
    return { success: false, error: 'Error al iniciar sesión' }
  }
}

  const register = async (username: string, password: string, accessCode: string) => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, accessCode }),
    })
    const data = await res.json()

    if (!data.success) {
      return { success: false, error: data.error }
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(data.profile))
    setUser(data.profile)
    return { success: true }
  } catch {
    return { success: false, error: 'Error al registrarse' }
  }
}

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }}>
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
