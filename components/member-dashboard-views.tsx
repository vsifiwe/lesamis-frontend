"use client"

import { useEffect, useState } from "react"
import {
  AlertCircleIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  LandmarkIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface ReceivedItem {
  id: string
  cycle_year: number
  cycle_month: number
  amount_applied: string
  received_date: string
  payment_method: string
}

interface PendingItem {
  id: string
  cycle_year: number
  cycle_month: number
  due_date: string
  total_amount_expected: number
  amount_paid: string
  amount_outstanding: string
  status: "expected" | "partially_paid" | "paid_unconfirmed" | "unpaid"
}

interface PurchaseItem {
  id: string
  share_count_snapshot: number
  shares_to_grant: number | null
  share_unit_value_snapshot: number
  total_amount_expected: number
  amount_paid: string
  amount_outstanding: string
  status: "expected" | "partially_paid" | "paid_unconfirmed" | "confirmed" | "unpaid"
  created_at: string
}

interface ContributionsResponse {
  received: ReceivedItem[]
  pending: PendingItem[]
  purchases: PurchaseItem[]
}

interface Loan {
  id: string
  loan_product_name: string
  principal_amount: string
  interest_rate_percent_snapshot: string
  duration_months_snapshot: number
  total_repayment_amount: string
  monthly_installment_amount: string
  outstanding_amount: string
  total_paid: string
  issued_date: string
  first_due_date: string
  status: "active" | "closed" | "defaulted" | "cancelled"
}

interface Penalty {
  id: string
  cycle_year: number
  cycle_month: number
  penalty_type: "late_penalty" | "extra_late_penalty" | "manual"
  amount: string
  reason: string
  waived: boolean
  waived_at: string | null
  created_at: string
}

type ContributionRow =
  | {
      kind: "received"
      id: string
      year: number
      month: number
      date: string
      dateLabel: string
      amount: number
      status: "confirmed"
      paymentMethod: string
    }
  | {
      kind: "pending"
      id: string
      year: number
      month: number
      date: string
      dateLabel: string
      amount: number
      outstanding: number
      status: PendingItem["status"]
    }
  | {
      kind: "purchase"
      id: string
      date: string
      dateLabel: string
      amount: number
      outstanding: number
      label: string
      status: PurchaseItem["status"]
    }

function fmt(n: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n)) + " RWF"
}

function cycleLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function errorMessage(err: unknown, subject: string) {
  if (err instanceof ApiError && err.status === 403) {
    return "No member profile is linked to this user account."
  }
  return err instanceof ApiError
    ? `Failed to load ${subject} (${err.status})`
    : "Could not reach the server."
}

function EmptyState({ children, destructive = false }: { children: React.ReactNode; destructive?: boolean }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm ${
        destructive ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {children}
    </div>
  )
}

const CONTRIBUTION_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  expected: "Expected",
  partially_paid: "Partially Paid",
  paid_unconfirmed: "Submitted",
  unpaid: "Unpaid",
}

const CONTRIBUTION_STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  confirmed: "default",
  expected: "secondary",
  partially_paid: "outline",
  paid_unconfirmed: "secondary",
  unpaid: "destructive",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  mobile_money: "Mobile Money",
}

const LOAN_STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  closed: "secondary",
  defaulted: "destructive",
  cancelled: "outline",
}

const LOAN_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  closed: "Closed",
  defaulted: "Defaulted",
  cancelled: "Cancelled",
}

const PENALTY_TYPE_LABELS: Record<string, string> = {
  late_penalty: "Late",
  extra_late_penalty: "Extra Late",
  manual: "Manual",
}

export function MemberDashboardHome() {
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
      .catch((err) => setError(errorMessage(err, "dashboard")))
      .finally(() => setLoading(false))
  }, [])

  const order = ["CAPITAL", "SOCIAL", "SOCIAL_PLUS"]
  const sorted = order.map((code) => accounts.find((a) => a.code === code)).filter(Boolean) as FundAccount[]
  const extras = accounts.filter((a) => !order.includes(a.code))
  const display = [...sorted, ...extras]

  const memberStats = [
    {
      label: "My Contributions",
      value: summary ? fmt(summary.total_contributions) : "-",
      icon: CircleDollarSignIcon,
      description: "Total contributed to date",
    },
    {
      label: "Active Loans",
      value: summary ? `${summary.active_loans} (${fmt(summary.active_loan_amount)})` : "-",
      icon: CreditCardIcon,
      description: "Loans currently outstanding",
    },
    {
      label: "Penalties",
      value: summary ? fmt(summary.total_penalties) : "-",
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

      {error && <EmptyState destructive>{error}</EmptyState>}

      {!error && (
        <>
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

            {!loading && (
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
      )}
    </>
  )
}

export function MemberContributionsView() {
  const [data, setData] = useState<ContributionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ContributionsResponse>("/api/v1/me/contributions/")
      .then(setData)
      .catch((err) => setError(errorMessage(err, "contributions")))
      .finally(() => setLoading(false))
  }, [])

  const rows: ContributionRow[] = data
    ? [
        ...data.received.map(
          (r): ContributionRow => ({
            kind: "received",
            id: r.id,
            year: r.cycle_year,
            month: r.cycle_month,
            date: r.received_date,
            dateLabel: formatDate(r.received_date),
            amount: Number(r.amount_applied),
            status: "confirmed",
            paymentMethod: r.payment_method,
          })
        ),
        ...data.pending.map(
          (p): ContributionRow => ({
            kind: "pending",
            id: p.id,
            year: p.cycle_year,
            month: p.cycle_month,
            date: p.due_date,
            dateLabel: `Due ${formatDate(p.due_date)}`,
            amount: p.total_amount_expected,
            outstanding: Number(p.amount_outstanding),
            status: p.status,
          })
        ),
        ...data.purchases.map(
          (p): ContributionRow => ({
            kind: "purchase",
            id: p.id,
            date: p.created_at,
            dateLabel: formatDate(p.created_at),
            amount: p.total_amount_expected,
            outstanding: Number(p.amount_outstanding),
            label: `${p.shares_to_grant ?? p.share_count_snapshot} share${
              (p.shares_to_grant ?? p.share_count_snapshot) !== 1 ? "s" : ""
            } x ${fmt(p.share_unit_value_snapshot)}`,
            status: p.status,
          })
        ),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Contributions</h1>
        <p className="text-sm text-muted-foreground">Your personal contribution history and upcoming payments.</p>
      </div>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {error && <EmptyState destructive>{error}</EmptyState>}

      {!loading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No contributions found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.kind + row.id}>
                    <TableCell className="font-medium">
                      {row.kind === "purchase" ? (
                        <span className="text-muted-foreground italic">Share Purchase</span>
                      ) : (
                        cycleLabel(row.year, row.month)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.dateLabel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.kind === "received"
                        ? PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod
                        : row.kind === "purchase"
                          ? <span className="text-xs">{row.label}</span>
                          : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(row.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.kind === "received" ? "-" : fmt(row.outstanding)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={CONTRIBUTION_STATUS_VARIANTS[row.status]}>
                        {CONTRIBUTION_STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

export function MemberLoansView() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Loan[]>("/api/v1/me/loans/")
      .then(setLoans)
      .catch((err) => setError(errorMessage(err, "loans")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Loans</h1>
        <p className="text-sm text-muted-foreground">Your active and past loan records.</p>
      </div>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {error && <EmptyState destructive>{error}</EmptyState>}

      {!loading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Total Repayment</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No loans found.
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.loan_product_name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(loan.issued_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(loan.principal_amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(loan.total_repayment_amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(loan.total_paid)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(loan.outstanding_amount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fmt(loan.monthly_installment_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={LOAN_STATUS_VARIANTS[loan.status]}>
                        {LOAN_STATUS_LABELS[loan.status] ?? loan.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

export function MemberPenaltiesView() {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Penalty[]>("/api/v1/me/penalties/")
      .then(setPenalties)
      .catch((err) => setError(errorMessage(err, "penalties")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Penalties</h1>
        <p className="text-sm text-muted-foreground">Penalties issued to your account and their status.</p>
      </div>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {error && <EmptyState destructive>{error}</EmptyState>}

      {!loading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No penalties on your account.
                  </TableCell>
                </TableRow>
              ) : (
                penalties.map((penalty) => (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">{cycleLabel(penalty.cycle_year, penalty.cycle_month)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {PENALTY_TYPE_LABELS[penalty.penalty_type] ?? penalty.penalty_type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{penalty.reason || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(penalty.amount)}</TableCell>
                    <TableCell className="text-right">
                      {penalty.waived ? (
                        <Badge variant="secondary">Waived</Badge>
                      ) : (
                        <Badge variant="destructive">Outstanding</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
