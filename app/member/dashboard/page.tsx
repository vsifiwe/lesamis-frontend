"use client"

import { useAuth } from "@/components/auth-provider"

export default function MemberDashboard() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Member Dashboard</h1>
      <p className="text-muted-foreground">Welcome back.</p>
      <button
        onClick={logout}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Log out
      </button>
    </div>
  )
}
