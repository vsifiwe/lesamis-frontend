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
  member_number: string
  member_name: string
  cycle: string
  penalty_type: string
  amount: string
  reason: string
  auto_generated: boolean
  waived: boolean
  waived_at: string | null
  created_at: string
}

function penaltyTypeLabel(type: string) {
  switch (type) {
    case "late_penalty":       return "Late"
    case "extra_late_penalty": return "Extra Late"
    case "manual":             return "Manual"
    default:                   return type
  }
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-RW", { minimumFractionDigits: 0 })
}

export default function AdminPenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Penalty[]>("/api/v1/penalties/")
      .then(setPenalties)
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? `Failed to load penalties (${err.status})`
            : "Could not reach the server."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const outstanding = penalties.filter((p) => !p.waived)
  const waived      = penalties.filter((p) => p.waived)

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Penalties</h1>
        <p className="text-sm text-muted-foreground">View and manage penalties issued to members.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && penalties.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
          No penalties recorded.
        </div>
      )}

      {!loading && !error && penalties.length > 0 && (
        <div className="space-y-8">
          {/* Outstanding */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Outstanding</h2>
              {outstanding.length > 0 && (
                <Badge variant="destructive">{outstanding.length}</Badge>
              )}
            </div>

            {outstanding.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No outstanding penalties.
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden rounded-lg border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Cycle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstanding.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <p className="font-medium">{p.member_name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{p.member_number}</p>
                          </TableCell>
                          <TableCell className="text-sm">{p.cycle}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{penaltyTypeLabel(p.penalty_type)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {p.reason || "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {fmt(p.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.auto_generated ? "Auto" : "Manual"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-3 md:hidden">
                  {outstanding.map((p) => (
                    <div key={p.id} className="rounded-lg border p-4 text-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{p.member_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{p.member_number}</p>
                        </div>
                        <Badge variant="secondary">{penaltyTypeLabel(p.penalty_type)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                        <span>Cycle: <span className="text-foreground">{p.cycle}</span></span>
                        <span>Amount: <span className="font-semibold text-foreground">{fmt(p.amount)}</span></span>
                        {p.reason && (
                          <span className="col-span-2 truncate">Reason: {p.reason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Waived */}
          {waived.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Waived</h2>
                <span className="text-xs text-muted-foreground">({waived.length})</span>
              </div>

              {/* Desktop */}
              <div className="hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Waived at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waived.map((p) => (
                      <TableRow key={p.id} className="opacity-60">
                        <TableCell>
                          <p className="font-medium">{p.member_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{p.member_number}</p>
                        </TableCell>
                        <TableCell className="text-sm">{p.cycle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{penaltyTypeLabel(p.penalty_type)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {p.reason || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(p.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.waived_at ? new Date(p.waived_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-3 md:hidden">
                {waived.map((p) => (
                  <div key={p.id} className="rounded-lg border p-4 text-sm opacity-60">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.member_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.member_number}</p>
                      </div>
                      <Badge variant="outline">{penaltyTypeLabel(p.penalty_type)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Cycle: <span className="text-foreground">{p.cycle}</span></span>
                      <span>Amount: <span className="font-semibold text-foreground">{fmt(p.amount)}</span></span>
                      {p.waived_at && (
                        <span className="col-span-2">
                          Waived: {new Date(p.waived_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
