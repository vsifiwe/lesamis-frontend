"use client"

import { useEffect, useState } from "react"
import {
  BriefcaseIcon,
  HandCoinsIcon,
  InfoIcon,
  WalletIcon,
} from "lucide-react"
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

interface FundSummary {
  total_credit: number
  total_debit: number
  current_available: number
  expected_total: number
  available_for_investment: number
  realized_profits: number
}

interface LoanSummary {
  total_loans_disbursed: number
  expected_interest: number
  total_loan_interest_paid: number  // total repaid: principal + interest
  fund_summary: FundSummary
}

interface Investment {
  id: string
  amount_invested: string
  total_profit: string
  status: "active" | "exited" | "partial_exit"
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " RWF"
}

// ── Hero stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  explain,
}: {
  label: string
  value: string
  icon?: React.ElementType
  explain?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {explain && (
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
                {explain}
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Detail table ───────────────────────────────────────────────────────────────

function DetailTable({
  title,
  rows,
}: {
  title: string
  rows: { label: string; value: string }[]
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [accounts, setAccounts]         = useState<FundAccount[]>([])
  const [loans, setLoans]               = useState<LoanSummary | null>(null)
  const [investments, setInvestments]   = useState<Investment[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<FundAccount[]>("/api/v1/fund-accounts/balances/"),
      api.get<LoanSummary>("/api/v1/dashboard/summary/"),
      api.get<Investment[]>("/api/v1/investments/"),
    ])
      .then(([accs, summary, invs]) => {
        setAccounts(accs)
        setLoans(summary)
        setInvestments(invs)
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

  const totalInvested  = investments.reduce((s, i) => s + parseFloat(i.amount_invested), 0)
  const totalProfit    = investments.reduce((s, i) => s + parseFloat(i.total_profit), 0)
  const roiPct         = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  const ORDER = ["CAPITAL", "SOCIAL", "SOCIAL_PLUS"]
  const sorted = ORDER.map((code) => accounts.find((a) => a.code === code)).filter(Boolean) as FundAccount[]
  const extras = accounts.filter((a) => !ORDER.includes(a.code))
  const display = [...sorted, ...extras]

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the group&apos;s finances and activity.</p>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">

          {/* ── Hero KPIs ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            {loans?.fund_summary && (
              <StatCard
                label="Currently Available"
                value={fmt(loans.fund_summary.current_available)}
                icon={WalletIcon}
                explain={
                  <div className="space-y-1.5 text-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      How it&apos;s calculated
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total credits</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        +{fmt(loans.fund_summary.total_credit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total debits</span>
                      <span className="font-medium text-destructive">
                        −{fmt(loans.fund_summary.total_debit)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t pt-2">
                      <span className="font-medium">Available</span>
                      <span className="font-bold">{fmt(loans.fund_summary.current_available)}</span>
                    </div>
                  </div>
                }
              />
            )}
            {loans && (
              <StatCard
                label="Total Disbursed"
                value={fmt(loans.total_loans_disbursed)}
                icon={HandCoinsIcon}
              />
            )}
            {investments.length > 0 && (
              <StatCard
                label="Total Invested"
                value={fmt(totalInvested)}
                icon={BriefcaseIcon}
              />
            )}
          </div>

          {/* ── Detail tables ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailTable
              title="Fund Accounts"
              rows={display.map((a) => ({ label: a.name, value: fmt(a.balance) }))}
            />
            {loans?.fund_summary && (
              <DetailTable
                title="Fund Overview"
                rows={[
                  { label: "Total Credits",            value: fmt(loans.fund_summary.total_credit) },
                  { label: "Total Debits",             value: fmt(loans.fund_summary.total_debit) },
                  { label: "Expected Total",           value: fmt(loans.fund_summary.expected_total) },
                  { label: "Available for Investment", value: fmt(loans.fund_summary.available_for_investment) },
                ]}
              />
            )}
            {loans && (
              <DetailTable
                title="Loans"
                rows={[
                  { label: "Expected Interest", value: fmt(loans.expected_interest) },
                  { label: "Total Repaid",       value: fmt(loans.total_loan_interest_paid) },
                ]}
              />
            )}
            {investments.length > 0 && (
              <DetailTable
                title="Investments"
                rows={[
                  { label: "Total Profit",        value: fmt(totalProfit) },
                  { label: "Return on Investment", value: `${roiPct.toFixed(1)}%` },
                  { label: "Realized Profit",      value: fmt(loans?.fund_summary.realized_profits ?? 0) },
                ]}
              />
            )}
          </div>

        </div>
      )}
    </>
  )
}
