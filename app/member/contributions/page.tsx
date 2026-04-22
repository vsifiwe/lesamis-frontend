"use client"

import { useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  status: "expected" | "partially_paid" | "paid_unconfirmed" | "unpaid"
}

interface PurchaseItem {
  id: string
  share_count_snapshot: number
  share_unit_value_snapshot: number
  total_amount_expected: number
  created_at: string
}

interface ContributionsResponse {
  received: ReceivedItem[]
  pending: PendingItem[]
  purchases: PurchaseItem[]
}

type Row =
  | { kind: "received"; id: string; year: number; month: number; date: string; dateLabel: string; amount: number; status: "confirmed"; paymentMethod: string }
  | { kind: "pending";  id: string; year: number; month: number; date: string; dateLabel: string; amount: number; status: PendingItem["status"] }
  | { kind: "purchase"; id: string; date: string; dateLabel: string; amount: number; label: string }

function fmt(n: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n)) + " RWF"
}

function cycleLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_LABELS: Record<string, string> = {
  confirmed:        "Confirmed",
  expected:         "Expected",
  partially_paid:   "Partially Paid",
  paid_unconfirmed: "Submitted",
  unpaid:           "Unpaid",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  confirmed:        "default",
  expected:         "secondary",
  partially_paid:   "outline",
  paid_unconfirmed: "secondary",
  unpaid:           "destructive",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:         "Cash",
  bank:         "Bank",
  mobile_money: "Mobile Money",
}

export default function MemberContributionsPage() {
  const [data, setData] = useState<ContributionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ContributionsResponse>("/api/v1/me/contributions/")
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load contributions (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const rows: Row[] = data
    ? [
        ...data.received.map((r): Row => ({
          kind:          "received",
          id:            r.id,
          year:          r.cycle_year,
          month:         r.cycle_month,
          date:          r.received_date,
          dateLabel:     formatDate(r.received_date),
          amount:        Number(r.amount_applied),
          status:        "confirmed",
          paymentMethod: r.payment_method,
        })),
        ...data.pending.map((p): Row => ({
          kind:      "pending",
          id:        p.id,
          year:      p.cycle_year,
          month:     p.cycle_month,
          date:      p.due_date,
          dateLabel: `Due ${formatDate(p.due_date)}`,
          amount:    p.total_amount_expected,
          status:    p.status,
        })),
        ...data.purchases.map((p): Row => ({
          kind:      "purchase",
          id:        p.id,
          date:      p.created_at,
          dateLabel: formatDate(p.created_at),
          amount:    p.total_amount_expected,
          label:     `${p.share_count_snapshot} share${p.share_count_snapshot !== 1 ? "s" : ""} × ${fmt(p.share_unit_value_snapshot)}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Contributions</h1>
        <p className="text-sm text-muted-foreground">Your personal contribution history and upcoming payments.</p>
      </div>

      {loading && <Skeleton className="h-64 rounded-xl" />}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No contributions found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.kind + row.id}>
                    <TableCell className="font-medium">
                      {row.kind === "purchase"
                        ? <span className="text-muted-foreground italic">Share Purchase</span>
                        : cycleLabel(row.year, row.month)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.dateLabel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.kind === "received"
                        ? (PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod)
                        : row.kind === "purchase"
                          ? <span className="text-xs">{row.label}</span>
                          : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(row.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.kind === "purchase" ? "default" : STATUS_VARIANTS[row.status]}>
                        {row.kind === "purchase" ? "Confirmed" : (STATUS_LABELS[row.status] ?? row.status)}
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
