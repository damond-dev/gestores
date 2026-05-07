'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string, accessCode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('gestor_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('gestor_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (error || !data) {
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }

      setUser(data)
      localStorage.setItem('gestor_user', JSON.stringify(data))
      return { success: true }
    } catch {
      return { success: false, error: 'Error al iniciar sesión' }
    }
  }

  const register = async (username: string, password: string, accessCode: string) => {
    try {
      // Check if access code is valid (for this example, we accept any unique code)
      const { data: existingCode } = await supabase
        .from('profiles')
        .select('id')
        .eq('access_code', accessCode)
        .single()

      if (existingCode) {
        return { success: false, error: 'El código de acceso ya está en uso' }
      }

      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { success: false, error: 'El nombre de usuario ya existe' }
      }

      // Create new user
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username,
          password,
          access_code: accessCode,
          role: 'gestor',
          total_commission: 0,
          total_items_sold: 0
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: 'Error al crear la cuenta' }
      }

      setUser(data)
      localStorage.setItem('gestor_user', JSON.stringify(data))
      return { success: true }
    } catch {
      return { success: false, error: 'Error al registrarse' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gestor_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
