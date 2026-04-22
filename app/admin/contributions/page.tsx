"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Obligation {
  id: string
  member: string
  member_number: string
  member_name: string
  contribution_cycle: string
  cycle: string
  obligation_type: "contribution" | "share_purchase"
  share_count_snapshot: number
  shares_to_grant: number | null
  share_unit_value_snapshot: number
  capital_amount_expected: number
  social_amount_expected: number
  social_plus_amount_expected: number
  total_amount_expected: number
  amount_paid: string
  amount_outstanding: string
  status: string
}

interface ReceiptItem {
  id: string
  obligation: string
  member_number: string
  member_name: string
  amount_applied: string
}

interface Receipt {
  id: string
  amount_received: string
  received_date: string
  payment_method: string
  status: string
  confirmed_by_email: string
  created_by_email: string
  created_at: string
  notes: string
  items: ReceiptItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | string) {
  return Number(n).toLocaleString()
}

function methodLabel(m: string) {
  return { cash: "Cash", bank: "Bank", mobile_money: "Mobile Money" }[m] ?? m
}

function obligationLabel(o: Obligation) {
  if (o.obligation_type === "share_purchase") {
    const shares = o.shares_to_grant ?? o.share_count_snapshot
    return `${shares} share${shares !== 1 ? "s" : ""} purchase`
  }
  return o.cycle
}

const today = new Date().toISOString().slice(0, 10)

const emptyForm = {
  received_date: today,
  payment_method: "bank",
  notes: "",
  selections: {} as Record<string, string>,
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminContributionsPage() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<Obligation[]>("/api/v1/obligations/"),
      api.get<Receipt[]>("/api/v1/receipts/"),
    ])
      .then(([obs, recs]) => {
        setObligations(obs)
        setReceipts(recs)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load data (${err.status})`
            : "Could not reach the server."
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const pending = obligations.filter((o) => o.status !== "confirmed")

  // ── Receipt form helpers ────────────────────────────────────────────────────

  function toggleObligation(id: string, defaultAmount: number) {
    setForm((prev) => {
      const next = { ...prev, selections: { ...prev.selections } }
      if (next.selections[id] !== undefined) {
        delete next.selections[id]
      } else {
        next.selections[id] = String(defaultAmount)
      }
      return next
    })
  }

  function setAmount(id: string, value: string) {
    setForm((prev) => ({
      ...prev,
      selections: { ...prev.selections, [id]: value },
    }))
  }

  const total = Object.values(form.selections).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  )

  function closeDialog() {
    setDialogOpen(false)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const items = Object.entries(form.selections).map(([obligation_id, amount_applied]) => ({
      obligation_id,
      amount_applied,
    }))
    if (items.length === 0) {
      toast.error("Select at least one obligation.")
      return
    }

    setSaving(true)
    try {
      const receipt = await api.post<Receipt>("/api/v1/receipts/", {
        amount_received: String(total),
        received_date: form.received_date,
        payment_method: form.payment_method,
        notes: form.notes,
        items,
      })

      const refreshedObligations = await api.get<Obligation[]>("/api/v1/obligations/")
      setReceipts((prev) => [receipt, ...prev])
      setObligations(refreshedObligations)
      closeDialog()
      toast.success("Receipt created successfully.")
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to create receipt (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Contributions</h1>
          <p className="text-sm text-muted-foreground">
            Track member obligations and payment receipts.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          New Receipt
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Pending Obligations ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending Obligations
        </h2>

        {loading ? (
          <>
            <div className="hidden md:block"><TableSkeleton rows={4} cols={9} /></div>
            <div className="md:hidden"><CardSkeleton count={3} /></div>
          </>
        ) : pending.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            No pending obligations.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">Social</TableHead>
                    <TableHead className="text-right">Social+</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <p className="font-medium">{o.member_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{o.member_number}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p>{obligationLabel(o)}</p>
                          {o.obligation_type === "share_purchase" && (
                            <p className="text-xs text-muted-foreground">
                              {fmt(o.share_unit_value_snapshot)} per share
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{fmt(o.capital_amount_expected)}</TableCell>
                      <TableCell className="text-right">{fmt(o.social_amount_expected)}</TableCell>
                      <TableCell className="text-right">{fmt(o.social_plus_amount_expected)}</TableCell>
                      <TableCell className="text-right">{fmt(o.amount_paid)}</TableCell>
                      <TableCell className="text-right">{fmt(o.amount_outstanding)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(o.total_amount_expected)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-3 md:hidden">
              {pending.map((o) => (
                <div key={o.id} className="rounded-lg border p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{o.member_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{o.member_number}</p>
                    </div>
                    <Badge variant="secondary">{o.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                    <span className="col-span-2 text-foreground">{obligationLabel(o)}</span>
                    <span>Capital: {fmt(o.capital_amount_expected)}</span>
                    <span>Social: {fmt(o.social_amount_expected)}</span>
                    <span>Social+: {fmt(o.social_plus_amount_expected)}</span>
                    <span>Paid: {fmt(o.amount_paid)}</span>
                    <span>Outstanding: {fmt(o.amount_outstanding)}</span>
                    <span className="font-semibold text-foreground">Total: {fmt(o.total_amount_expected)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* ── Receipts ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Receipts
        </h2>

        {loading ? (
          <>
            <div className="hidden md:block"><TableSkeleton rows={3} cols={5} /></div>
            <div className="md:hidden"><CardSkeleton count={2} /></div>
          </>
        ) : receipts.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            No receipts yet.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.received_date}</TableCell>
                      <TableCell>
                        {r.items.length > 0 ? (
                          <div className="space-y-0.5">
                            {r.items.map((i) => (
                              <div key={i.id} className="flex items-baseline gap-1.5">
                                <span className="font-medium">{i.member_name}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {i.member_number}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  — {fmt(i.amount_applied)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{r.notes || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmt(r.amount_received)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{methodLabel(r.payment_method)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "confirmed" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-3 md:hidden">
              {receipts.map((r) => (
                <div key={r.id} className="rounded-lg border p-4 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{r.received_date}</span>
                    <span className="font-semibold">{fmt(r.amount_received)}</span>
                  </div>
                  <div className="mb-2 flex gap-2">
                    <Badge variant="secondary">{methodLabel(r.payment_method)}</Badge>
                    <Badge variant={r.status === "confirmed" ? "default" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                  {r.items.length > 0 ? (
                    <div className="space-y-0.5">
                      {r.items.map((i) => (
                        <div key={i.id} className="flex justify-between text-muted-foreground">
                          <span>
                            {i.member_name}{" "}
                            <span className="font-mono text-xs">({i.member_number})</span>
                          </span>
                          <span>{fmt(i.amount_applied)}</span>
                        </div>
                      ))}
                    </div>
                  ) : r.notes ? (
                    <p className="text-muted-foreground">{r.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Create Receipt Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Receipt</DialogTitle>
          </DialogHeader>

          <form id="receipt-form" onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Obligation picker */}
              <Field>
                <FieldLabel>Obligations</FieldLabel>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending obligations.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                    {pending.map((o) => {
                      const checked = form.selections[o.id] !== undefined
                      return (
                        <div key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                          <Checkbox
                            id={`ob-${o.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleObligation(o.id, Number(o.amount_outstanding))}
                          />
                          <label
                            htmlFor={`ob-${o.id}`}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium leading-none">
                              {o.member_name}
                              <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                                {o.member_number}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{obligationLabel(o)}</p>
                          </label>
                          <Input
                            type="number"
                            min={1}
                            className="w-28 text-right"
                            value={checked ? form.selections[o.id] : o.amount_outstanding}
                            disabled={!checked}
                            onChange={(e) => setAmount(o.id, e.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
                {Object.keys(form.selections).length > 0 && (
                  <p className="pt-1 text-right text-xs text-muted-foreground">
                    Total:{" "}
                    <span className="font-semibold text-foreground">{fmt(total)}</span>
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="receipt-method">Payment method</FieldLabel>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => setForm((p) => ({ ...p, payment_method: v }))}
                  >
                    <SelectTrigger id="receipt-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="receipt-date">Date received</FieldLabel>
                  <Input
                    id="receipt-date"
                    type="date"
                    value={form.received_date}
                    onChange={(e) => setForm((p) => ({ ...p, received_date: e.target.value }))}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="receipt-notes">Notes (optional)</FieldLabel>
                <Input
                  id="receipt-notes"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </Field>
            </FieldGroup>
          </form>

          <DialogFooter showCloseButton>
            <Button type="submit" form="receipt-form" disabled={saving}>
              {saving ? "Saving…" : "Create Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
