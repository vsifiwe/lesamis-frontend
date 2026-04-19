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

function fmt(n: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n)) + " RWF"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active:    "default",
  closed:    "secondary",
  defaulted: "destructive",
  cancelled: "outline",
}

const STATUS_LABELS: Record<string, string> = {
  active:    "Active",
  closed:    "Closed",
  defaulted: "Defaulted",
  cancelled: "Cancelled",
}

export default function MemberLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Loan[]>("/api/v1/me/loans/")
      .then(setLoans)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load loans (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Loans</h1>
        <p className="text-sm text-muted-foreground">Your active and past loan records.</p>
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
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(loan.monthly_installment_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={STATUS_VARIANTS[loan.status]}>
                        {STATUS_LABELS[loan.status] ?? loan.status}
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
