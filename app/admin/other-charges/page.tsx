"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
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

interface FundAccount {
  id: string
  code: string
  name: string
}

interface OtherCharge {
  id: string
  charge_type: "bank_charge" | "adjustment" | "correction"
  amount: string
  direction: "debit" | "credit"
  fund_account: string
  fund_account_name: string
  charge_date: string
  description: string
  recorded_by_email: string
  created_at: string
}

const today = new Date().toISOString().slice(0, 10)

const emptyForm = {
  charge_type: "",
  direction: "",
  fund_account: "",
  amount: "",
  charge_date: today,
  description: "",
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-RW", { minimumFractionDigits: 0 })
}

function chargeTypeLabel(t: string) {
  switch (t) {
    case "bank_charge":  return "Bank Charge"
    case "adjustment":   return "Adjustment"
    case "correction":   return "Correction"
    default:             return t
  }
}

function directionVariant(d: string): "default" | "outline" {
  return d === "credit" ? "default" : "outline"
}

export default function AdminOtherChargesPage() {
  const [charges, setCharges]           = useState<OtherCharge[]>([])
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<OtherCharge[]>("/api/v1/other-charges/"),
      api.get<FundAccount[]>("/api/v1/fund-accounts/balances/"),
    ])
      .then(([c, fa]) => {
        setCharges(c)
        setFundAccounts(fa)
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? `Failed to load data (${err.status})`
            : "Could not reach the server."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const charge = await api.post<OtherCharge>("/api/v1/other-charges/", {
        charge_type:  form.charge_type,
        direction:    form.direction,
        fund_account: form.fund_account,
        amount:       Number(form.amount),
        charge_date:  form.charge_date,
        description:  form.description,
      })
      setCharges((prev) => [charge, ...prev])
      setNewOpen(false)
      setForm(emptyForm)
      toast.success("Charge recorded.")
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to record charge (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Other Charges</h1>
          <p className="text-sm text-muted-foreground">Record bank charges, adjustments, and corrections.</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          New Charge
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

      {!loading && !error && charges.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
          No charges recorded yet.
        </div>
      )}

      {!loading && !error && charges.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Fund Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.charge_date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{chargeTypeLabel(c.charge_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={directionVariant(c.direction)}>
                        {c.direction.charAt(0).toUpperCase() + c.direction.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.fund_account_name}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(c.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {c.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.recorded_by_email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {charges.map((c) => (
              <div key={c.id} className="rounded-lg border p-4 text-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{chargeTypeLabel(c.charge_type)}</Badge>
                    <Badge variant={directionVariant(c.direction)}>
                      {c.direction.charAt(0).toUpperCase() + c.direction.slice(1)}
                    </Badge>
                  </div>
                  <span className="font-semibold">{fmt(c.amount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Date: <span className="text-foreground">{c.charge_date}</span></span>
                  <span>Fund: <span className="text-foreground">{c.fund_account_name}</span></span>
                </div>
                {c.description && (
                  <p className="mt-2 truncate text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{c.recorded_by_email}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New Charge dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Charge</DialogTitle>
          </DialogHeader>
          <form id="new-charge-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="charge-type">Charge type</FieldLabel>
                <select
                  id="charge-type"
                  value={form.charge_type}
                  onChange={(e) => set("charge_type", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a type…</option>
                  <option value="bank_charge">Bank Charge</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="correction">Correction</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="charge-direction">Direction</FieldLabel>
                <select
                  id="charge-direction"
                  value={form.direction}
                  onChange={(e) => set("direction", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a direction…</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="charge-fund">Fund account</FieldLabel>
                <select
                  id="charge-fund"
                  value={form.fund_account}
                  onChange={(e) => set("fund_account", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a fund account…</option>
                  {fundAccounts.map((fa) => (
                    <option key={fa.id} value={fa.id}>{fa.name}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="charge-amount">Amount</FieldLabel>
                <Input
                  id="charge-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  required
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="charge-date">Charge date</FieldLabel>
                <Input
                  id="charge-date"
                  type="date"
                  value={form.charge_date}
                  onChange={(e) => set("charge_date", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="charge-description">
                  Description
                  {form.charge_type === "adjustment" && (
                    <span className="ml-1 text-xs text-muted-foreground">(min. 50 characters)</span>
                  )}
                </FieldLabel>
                <Input
                  id="charge-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={form.charge_type === "adjustment" ? "Explain the reason for this adjustment…" : "Optional notes"}
                  required={form.charge_type === "adjustment"}
                  minLength={form.charge_type === "adjustment" ? 50 : undefined}
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-charge-form" disabled={saving}>
              {saving ? "Saving…" : "Record Charge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
