"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface AuthGuardProps {
  children: React.ReactNode
  role: "admin" | "member"
}

export function AuthGuard({ children, role }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/login")
      return
    }

    // Wrong role — send to the correct dashboard
    if (role === "admin" && !user.is_admin) {
      router.replace("/member/dashboard")
      return
    }

    if (role === "member" && user.is_admin) {
      router.replace("/admin/dashboard")
      return
    }
  }, [user, loading, role, router])

  if (loading) return null
  if (!user) return null
  if (role === "admin" && !user.is_admin) return null
  if (role === "member" && user.is_admin) return null

  return <>{children}</>
}
