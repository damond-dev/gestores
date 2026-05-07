'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

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
      // Timeout de 10 segundos
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      const { data: profile, error } = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]) as Awaited<typeof queryPromise>

      if (error || !profile) {
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }

      // Guardar sesión en localStorage
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
      setUser(profile)
      return { success: true }
    } catch (err: any) {
      if (err?.message === 'timeout') {
        return { success: false, error: 'El servidor tardó demasiado. Intenta de nuevo.' }
      }
      return { success: false, error: 'Error al iniciar sesión' }
    }
  }

  const register = async (username: string, password: string, accessCode: string) => {
    try {
      // Verificar que el código empiece por GESTOR-
      if (!accessCode.startsWith('GESTOR-')) {
        return { success: false, error: 'Código inválido. Contacta con la administración.' }
      }

      // Verificar que el código no esté en uso
      const { data: existingCode } = await supabase
        .from('profiles')
        .select('id')
        .eq('access_code', accessCode)
        .maybeSingle()

      if (existingCode) {
        return { success: false, error: 'El código de acceso ya está en uso' }
      }

      // Verificar que el username no esté en uso
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (existingUser) {
        return { success: false, error: 'El nombre de usuario ya existe' }
      }

      // Insertar nuevo gestor en profiles
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          username,
          password,
          access_code: accessCode,
          role: 'gestor',
          total_commission: 0,
          total_items_sold: 0,
        })
        .select()
        .single()

      if (error || !newProfile) {
        return { success: false, error: 'Error al crear la cuenta' }
      }

      // Guardar sesión automáticamente tras registrarse
      localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile))
      setUser(newProfile)
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
