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

function fmt(n: number | string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n)) + " RWF"
}

function cycleLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

const TYPE_LABELS: Record<string, string> = {
  late_penalty:       "Late",
  extra_late_penalty: "Extra Late",
  manual:             "Manual",
}

export default function MemberPenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Penalty[]>("/api/v1/me/penalties/")
      .then(setPenalties)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load penalties (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Penalties</h1>
        <p className="text-sm text-muted-foreground">Penalties issued to your account and their status.</p>
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
                    <TableCell className="text-muted-foreground">{TYPE_LABELS[penalty.penalty_type] ?? penalty.penalty_type}</TableCell>
                    <TableCell className="text-muted-foreground">{penalty.reason || "—"}</TableCell>
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
