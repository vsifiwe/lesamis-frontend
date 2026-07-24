"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface Member {
  id: string
  member_number: string
  first_name: string
  last_name: string
}

interface ReceivedItem {
  id: string
  cycle_year: number
  cycle_month: number
  amount_applied: string
  received_date: string
  payment_method: string
}

interface HistoricalItem {
  id: string
  year: number
  month: number
  fund_type: "capital" | "social" | "social_plus"
  amount: string
}

interface PendingItem {
  id: string
  cycle_year: number
  cycle_month: number
  due_date: string
  total_amount_expected: number
  amount_outstanding: string
  status: string
}

interface PurchaseItem {
  id: string
  share_count_snapshot: number
  shares_to_grant: number | null
  share_unit_value_snapshot: number
  total_amount_expected: number
  amount_outstanding: string
  status: string
  created_at: string
}

interface ContributionsResponse {
  member: Member
  received: ReceivedItem[]
  historical: HistoricalItem[]
  pending: PendingItem[]
  purchases: PurchaseItem[]
}

interface ContributionRow {
  id: string
  kind: "received" | "historical" | "pending" | "purchase"
  cycle: string
  date: string
  dateLabel: string
  source: string
  amount: number | string
  outstanding: string | null
  status: string
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  mobile_money: "Mobile Money",
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  expected: "Expected",
  partially_paid: "Partially Paid",
  paid_unconfirmed: "Submitted",
  unpaid: "Unpaid",
  historical: "Historical",
}

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  confirmed: "default",
  expected: "secondary",
  partially_paid: "outline",
  paid_unconfirmed: "secondary",
  unpaid: "destructive",
  historical: "outline",
}

function fmt(value: number | string) {
  return Number(value).toLocaleString()
}

function cycleLabel(year: number, month: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" })
    .format(new Date(year, month - 1, 1))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function fundTypeLabel(fundType: HistoricalItem["fund_type"]) {
  return fundType === "social_plus"
    ? "Social Plus"
    : fundType.charAt(0).toUpperCase() + fundType.slice(1)
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.status === 404
      ? "This member could not be found."
      : `Failed to load contributions (${error.status}).`
    : "Could not reach the server."
}

export default function AdminMemberContributionsPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const [data, setData] = useState<ContributionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<ContributionsResponse>(`/api/v1/members/${memberId}/contributions/`)
      .then(setData)
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [memberId])

  const rows = useMemo<ContributionRow[]>(() => {
    if (!data) return []

    return [
      ...data.received.map((item) => ({
        id: item.id,
        kind: "received" as const,
        cycle: cycleLabel(item.cycle_year, item.cycle_month),
        date: item.received_date,
        dateLabel: formatDate(item.received_date),
        source: paymentMethodLabels[item.payment_method] ?? item.payment_method,
        amount: item.amount_applied,
        outstanding: null,
        status: "confirmed",
      })),
      ...data.historical.map((item) => ({
        id: item.id,
        kind: "historical" as const,
        cycle: cycleLabel(item.year, item.month),
        date: `${item.year}-${String(item.month).padStart(2, "0")}-01`,
        dateLabel: "Imported record",
        source: `Historical import · ${fundTypeLabel(item.fund_type)}`,
        amount: item.amount,
        outstanding: null,
        status: "historical",
      })),
      ...data.pending.map((item) => ({
        id: item.id,
        kind: "pending" as const,
        cycle: cycleLabel(item.cycle_year, item.cycle_month),
        date: item.due_date,
        dateLabel: `Due ${formatDate(item.due_date)}`,
        source: "-",
        amount: item.total_amount_expected,
        outstanding: item.amount_outstanding,
        status: item.status,
      })),
      ...data.purchases.map((item) => {
        const shares = item.shares_to_grant ?? item.share_count_snapshot
        return {
          id: item.id,
          kind: "purchase" as const,
          cycle: "Share Purchase",
          date: item.created_at.slice(0, 10),
          dateLabel: formatDate(item.created_at.slice(0, 10)),
          source: `${shares} share${shares === 1 ? "" : "s"} × ${fmt(item.share_unit_value_snapshot)}`,
          amount: item.total_amount_expected,
          outstanding: item.amount_outstanding,
          status: item.status,
        }
      }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data])

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/members">
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Members
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {data ? `${data.member.first_name} ${data.member.last_name}` : "Member Contributions"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.member.member_number} · Contribution history, balances, and share purchases.`
              : "Contribution history, balances, and share purchases."}
          </p>
        </div>
      </div>

      {loading && <Skeleton className="h-64 rounded-xl" />}
      {error && (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-destructive">
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
                <TableHead>Payment / Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No contribution records found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.kind}-${row.id}`}>
                    <TableCell className="font-medium">{row.cycle}</TableCell>
                    <TableCell className="text-muted-foreground">{row.dateLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{row.source}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmt(row.amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {row.outstanding === null ? "-" : fmt(row.outstanding)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={statusVariants[row.status] ?? "secondary"}>
                        {statusLabels[row.status] ?? row.status}
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
