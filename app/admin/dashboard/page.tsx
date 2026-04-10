"use client"

import { useEffect, useState } from "react"
import {
  BriefcaseIcon,
  ChartBarIcon,
  HandCoinsIcon,
  InfoIcon,
  TrendingUpIcon,
  WalletIcon,
  UsersIcon,
  Users2Icon,
  ReceiptIcon,
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

interface LoanSummary {
  total_loans_disbursed: number
  expected_interest: number
  total_loan_interest_paid: number  // total repaid: principal + interest
}

interface Investment {
  id: string
  amount_invested: string
  total_profit: string
  status: "active" | "exited" | "partial_exit"
}

const FUND_META: Record<string, { icon: React.ElementType }> = {
  SOCIAL:      { icon: UsersIcon  },
  SOCIAL_PLUS: { icon: Users2Icon },
  CAPITAL:     { icon: WalletIcon },
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " RWF"
}

// ── Uniform stat card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  explain,
}: {
  label: string
  value: string
  icon?: React.ElementType
  sub?: string
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
          <p className="text-2xl font-bold tracking-tight">{value}</p>
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
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
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

  const totalInvested = investments.reduce((s, i) => s + parseFloat(i.amount_invested), 0)
  const totalProfit   = investments.reduce((s, i) => s + parseFloat(i.total_profit), 0)
  const roiPct        = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
  const activeCount   = investments.filter((i) => i.status === "active").length

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
        <div className="space-y-8">
          {[3, 3, 3].map((count, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: count }).map((_, j) => (
                  <Skeleton key={j} className="h-28 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">

          {/* ── Fund Accounts ── */}
          <Section title="Fund Accounts">
            {display.map((account) => {
              const meta = FUND_META[account.code]
              return (
                <StatCard
                  key={account.id}
                  label={account.name}
                  value={fmt(account.balance)}
                  icon={meta?.icon}
                  explain={
                    <div>
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
                    </div>
                  }
                />
              )
            })}
          </Section>

          {/* ── Loans ── */}
          {loans && (
            <Section title="Loans">
              <StatCard
                label="Total Disbursed"
                value={fmt(loans.total_loans_disbursed)}
                icon={HandCoinsIcon}
              />
              <StatCard
                label="Expected Interest"
                value={fmt(loans.expected_interest)}
                icon={TrendingUpIcon}
              />
              <StatCard
                label="Total Repaid"
                value={fmt(loans.total_loan_interest_paid)}
                icon={ReceiptIcon}
                sub="principal + interest"
              />
            </Section>
          )}

          {/* ── Investments ── */}
          {investments.length > 0 && (
            <Section title="Investments">
              <StatCard
                label="Total Invested"
                value={fmt(totalInvested)}
                icon={BriefcaseIcon}
              />
              <StatCard
                label="Total Profit"
                value={fmt(totalProfit)}
                icon={TrendingUpIcon}
                explain={
                  <div className="space-y-1.5 text-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Return on investment
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total invested</span>
                      <span className="font-medium">{fmt(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total profit</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        +{fmt(totalProfit)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t pt-2">
                      <span className="font-medium">ROI</span>
                      <span className="font-bold">{roiPct.toFixed(1)}%</span>
                    </div>
                  </div>
                }
              />
              <StatCard
                label="Active Investments"
                value={String(activeCount)}
                icon={ChartBarIcon}
                sub="currently active"
              />
            </Section>
          )}

        </div>
      )}
    </>
  )
}
