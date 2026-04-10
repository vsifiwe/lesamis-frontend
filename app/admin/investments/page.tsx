"use client"

import { useEffect, useState } from "react"
import { MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Investment {
  id: string
  name: string
  investment_type: "shares" | "land" | "bond" | "other"
  investment_date: string
  amount_invested: string
  status: "active" | "exited" | "partial_exit"
  description: string
  created_by: string
  created_by_email: string
  created_at: string
  updated_at: string
}

const emptyForm = {
  name: "",
  investment_type: "",
  investment_date: "",
  amount_invested: "",
  status: "active",
  description: "",
}

const emptyProfitForm = {
  profit_date: "",
  amount: "",
  description: "",
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-RW", { minimumFractionDigits: 0 })
}

function typeLabel(t: string) {
  switch (t) {
    case "shares": return "Shares"
    case "land":   return "Land"
    case "bond":   return "Bond"
    case "other":  return "Other"
    default:       return t
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "active":       return "Active"
    case "exited":       return "Exited"
    case "partial_exit": return "Partial Exit"
    default:             return s
  }
}

function statusVariant(s: string): "default" | "outline" | "secondary" {
  if (s === "active") return "default"
  if (s === "exited") return "outline"
  return "secondary"
}

function ActionsMenu({ investment, onRecordProfit }: {
  investment: Investment
  onRecordProfit: (inv: Investment) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onRecordProfit(investment)}>
          Record Profit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // New investment dialog
  const [newOpen, setNewOpen]   = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)

  // Record profit dialog
  const [profitTarget, setProfitTarget]   = useState<Investment | null>(null)
  const [profitForm, setProfitForm]       = useState(emptyProfitForm)
  const [savingProfit, setSavingProfit]   = useState(false)

  useEffect(() => {
    api
      .get<Investment[]>("/api/v1/investments/")
      .then(setInvestments)
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? `Failed to load investments (${err.status})`
            : "Could not reach the server."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setProfit(field: keyof typeof emptyProfitForm, value: string) {
    setProfitForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const investment = await api.post<Investment>("/api/v1/investments/", {
        name: form.name,
        investment_type: form.investment_type,
        investment_date: form.investment_date,
        amount_invested: Number(form.amount_invested),
        status: form.status,
        description: form.description,
      })
      setInvestments((prev) => [investment, ...prev])
      setNewOpen(false)
      setForm(emptyForm)
      toast.success("Investment recorded.")
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to record investment (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleProfitSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profitTarget) return
    setSavingProfit(true)
    try {
      await api.post(`/api/v1/investments/${profitTarget.id}/profit-entries/`, {
        profit_date: profitForm.profit_date,
        amount: Number(profitForm.amount),
        description: profitForm.description,
      })
      setProfitTarget(null)
      setProfitForm(emptyProfitForm)
      toast.success(`Profit recorded for "${profitTarget.name}".`)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to record profit (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSavingProfit(false)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Investments</h1>
          <p className="text-sm text-muted-foreground">Track and manage the group&apos;s investment portfolio.</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          New Investment
        </Button>
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

      {!loading && !error && investments.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
          No investments recorded yet.
        </div>
      )}

      {!loading && !error && investments.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel(inv.investment_type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{inv.investment_date}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(inv.amount_invested)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inv.status)}>{statusLabel(inv.status)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {inv.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionsMenu investment={inv} onRecordProfit={setProfitTarget} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {investments.map((inv) => (
              <div key={inv.id} className="rounded-lg border p-4 text-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-semibold">{inv.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={statusVariant(inv.status)}>{statusLabel(inv.status)}</Badge>
                    <ActionsMenu investment={inv} onRecordProfit={setProfitTarget} />
                  </div>
                </div>
                <div className="mb-2">
                  <Badge variant="secondary">{typeLabel(inv.investment_type)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Date: <span className="text-foreground">{inv.investment_date}</span></span>
                  <span>Amount: <span className="font-semibold text-foreground">{fmt(inv.amount_invested)}</span></span>
                </div>
                {inv.description && (
                  <p className="mt-2 truncate text-muted-foreground">{inv.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* New Investment dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Investment</DialogTitle>
          </DialogHeader>
          <form id="new-investment-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="inv-name">Name</FieldLabel>
                <Input
                  id="inv-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="e.g. BRD Sustainability Bond"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-type">Investment type</FieldLabel>
                <select
                  id="inv-type"
                  value={form.investment_type}
                  onChange={(e) => set("investment_type", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a type…</option>
                  <option value="shares">Shares</option>
                  <option value="land">Land</option>
                  <option value="bond">Bond</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-date">Investment date</FieldLabel>
                <Input
                  id="inv-date"
                  type="date"
                  value={form.investment_date}
                  onChange={(e) => set("investment_date", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-amount">Amount invested</FieldLabel>
                <Input
                  id="inv-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount_invested}
                  onChange={(e) => set("amount_invested", e.target.value)}
                  required
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-status">Status</FieldLabel>
                <select
                  id="inv-status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="exited">Exited</option>
                  <option value="partial_exit">Partial Exit</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-description">Description</FieldLabel>
                <Input
                  id="inv-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional notes"
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-investment-form" disabled={saving}>
              {saving ? "Saving…" : "Record Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Profit dialog */}
      <Dialog open={!!profitTarget} onOpenChange={(open) => { if (!open) { setProfitTarget(null); setProfitForm(emptyProfitForm) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Profit</DialogTitle>
            {profitTarget && (
              <p className="text-sm text-muted-foreground">{profitTarget.name}</p>
            )}
          </DialogHeader>
          <form id="profit-form" onSubmit={handleProfitSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="profit-date">Profit date</FieldLabel>
                <Input
                  id="profit-date"
                  type="date"
                  value={profitForm.profit_date}
                  onChange={(e) => setProfit("profit_date", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profit-amount">Amount</FieldLabel>
                <Input
                  id="profit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={profitForm.amount}
                  onChange={(e) => setProfit("amount", e.target.value)}
                  required
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profit-description">Description</FieldLabel>
                <Input
                  id="profit-description"
                  value={profitForm.description}
                  onChange={(e) => setProfit("description", e.target.value)}
                  placeholder="Optional notes"
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="profit-form" disabled={savingProfit}>
              {savingProfit ? "Saving…" : "Record Profit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
