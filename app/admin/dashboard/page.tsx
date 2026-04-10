"use client"

import { useEffect, useState } from "react"
import { InfoIcon, WalletIcon, UsersIcon, Users2Icon } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"

interface FundAccount {
  id: string
  code: string
  name: string
  total_credits: number
  total_debits: number
  balance: number
}

const FUND_META: Record<string, { icon: React.ElementType; description: string }> = {
  SOCIAL:      { icon: UsersIcon,  description: "Member social contributions" },
  SOCIAL_PLUS: { icon: Users2Icon, description: "Member social plus contributions" },
  CAPITAL:     { icon: WalletIcon, description: "Member capital contributions" },
}

function fmt(n: number) {
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) +
    " RWF"
  )
}

export default function AdminDashboardPage() {
  const [accounts, setAccounts] = useState<FundAccount[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    api
      .get<FundAccount[]>("/api/v1/fund-accounts/balances/")
      .then(setAccounts)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load balances (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  // Enforce display order: Social, Social Plus, Capital
  const ORDER = ["CAPITAL", "SOCIAL", "SOCIAL_PLUS"]
  const sorted = ORDER.map((code) => accounts.find((a) => a.code === code)).filter(Boolean) as FundAccount[]
  // Append any unknown accounts at the end
  const extras = accounts.filter((a) => !ORDER.includes(a.code))
  const display = [...sorted, ...extras]

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the group&apos;s finances and activity.</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((account) => {
            const meta = FUND_META[account.code]
            const Icon = meta?.icon ?? WalletIcon
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {account.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold tracking-tight">{fmt(account.balance)}</p>
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          <InfoIcon className="h-3 w-3" />
                          Explain
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-56" side="top">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Balance breakdown
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total credits</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              +{fmt(account.total_credits)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total debits</span>
                            <span className="font-medium text-destructive">
                              −{fmt(account.total_debits)}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between border-t pt-2">
                            <span className="font-medium">Balance</span>
                            <span className="font-bold">{fmt(account.balance)}</span>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  {meta && (
                    <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
