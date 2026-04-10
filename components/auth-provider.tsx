"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type TokenPayload,
  clearTokens,
  getStoredUser,
  saveTokens,
} from "@/lib/auth"

interface AuthContextValue {
  user: TokenPayload | null
  loading: boolean
  login: (access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    setLoading(false)
  }, [])

  function login(access: string, refresh: string) {
    saveTokens(access, refresh)
    setUser(getStoredUser())
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
