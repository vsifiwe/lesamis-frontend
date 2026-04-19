"use client"

import { useEffect, useState } from "react"
import { CircleDollarSignIcon, CreditCardIcon, AlertCircleIcon, LandmarkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, ApiError } from "@/lib/api"

interface FundAccount {
  id: string
  code: string
  name: string
  total_credits: number
  total_debits: number
  balance: number
}

interface MemberSummary {
  total_contributions: string
  active_loans: number
  active_loan_amount: string
  total_penalties: string
}

function fmt(n: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n)) + " RWF"
}

export default function MemberDashboardPage() {
  const [accounts, setAccounts] = useState<FundAccount[]>([])
  const [summary, setSummary] = useState<MemberSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<FundAccount[]>("/api/v1/fund-accounts/balances/"),
      api.get<MemberSummary>("/api/v1/me/summary/"),
    ])
      .then(([accs, memberSummary]) => {
        setAccounts(accs)
        setSummary(memberSummary)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load dashboard (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const ORDER = ["CAPITAL", "SOCIAL", "SOCIAL_PLUS"]
  const sorted = ORDER.map((code) => accounts.find((a) => a.code === code)).filter(Boolean) as FundAccount[]
  const extras = accounts.filter((a) => !ORDER.includes(a.code))
  const display = [...sorted, ...extras]

  const memberStats = [
    {
      label: "My Contributions",
      value: summary ? fmt(summary.total_contributions) : "—",
      icon: CircleDollarSignIcon,
      description: "Total contributed to date",
    },
    {
      label: "Active Loans",
      value: summary ? `${summary.active_loans} (${fmt(summary.active_loan_amount)})` : "—",
      icon: CreditCardIcon,
      description: "Loans currently outstanding",
    },
    {
      label: "Penalties",
      value: summary ? fmt(summary.total_penalties) : "—",
      icon: AlertCircleIcon,
      description: "Outstanding penalties",
    },
  ]

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Information</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here&apos;s a summary of your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : memberStats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardHeader className="pt-0">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <CardDescription>{stat.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <LandmarkIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Group Fund Balances</h2>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {display.map((account) => (
              <Card key={account.id}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{account.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-bold tabular-nums">{fmt(account.balance)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
