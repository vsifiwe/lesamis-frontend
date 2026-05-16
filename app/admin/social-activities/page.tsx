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

interface SocialActivityRecord {
  id: string
  fund_account: string
  fund_account_code: string
  fund_account_name: string
  activity_date: string
  category: "event" | "support" | "visit"
  name: string
  description: string
  amount: string
  created_at: string
}

interface FundAccount {
  id: string
  code: string
  name: string
}

const emptyForm = {
  fund_account: "",
  activity_date: "",
  category: "",
  name: "",
  description: "",
  amount: "",
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-RW", { minimumFractionDigits: 0 })
}

function categoryLabel(c: string) {
  switch (c) {
    case "event":   return "Event"
    case "support": return "Support"
    case "visit":   return "Visit"
    default:        return c
  }
}

function categoryVariant(c: string): "default" | "secondary" | "outline" {
  if (c === "support") return "default"
  if (c === "event")   return "secondary"
  return "outline"
}

export default function SocialActivitiesPage() {
  const [records, setRecords]           = useState<SocialActivityRecord[]>([])
  const [accounts, setAccounts]         = useState<FundAccount[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [newOpen, setNewOpen]           = useState(false)
  const [form, setForm]                 = useState(emptyForm)
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<SocialActivityRecord[]>("/api/v1/social-activities/"),
      api.get<FundAccount[]>("/api/v1/fund-accounts/balances/"),
    ])
      .then(([recs, accs]) => {
        setRecords(recs)
        setAccounts(accs.filter((a) => a.code === "SOCIAL" || a.code === "SOCIAL_PLUS"))
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `Failed to load social activities (${err.status})`
            : "Could not reach the server."
        )
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
      const record = await api.post<SocialActivityRecord>("/api/v1/social-activities/", {
        fund_account: form.fund_account,
        activity_date: form.activity_date,
        category: form.category,
        name: form.name,
        description: form.description,
        amount: Number(form.amount),
      })
      setRecords((prev) => [record, ...prev])
      setNewOpen(false)
      setForm(emptyForm)
      toast.success("Social activity recorded.")
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to record activity (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSaving(false)
    }
  }

  const total = records.reduce((s, r) => s + parseFloat(r.amount), 0)

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Social Activities</h1>
          <p className="text-sm text-muted-foreground">
            Wedding contributions, outings, meetings, and other social expenses.
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          New Record
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
          No social activities recorded yet.
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead className="text-right">Amount (RWF)</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="text-sm tabular-nums">{rec.activity_date}</TableCell>
                    <TableCell>
                      <Badge variant={categoryVariant(rec.category)}>
                        {categoryLabel(rec.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rec.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rec.fund_account_code}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(rec.amount)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {rec.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={4} className="text-right text-sm text-muted-foreground">
                    Total
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {records.map((rec) => (
              <div key={rec.id} className="rounded-lg border p-4 text-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-semibold">{rec.name}</p>
                  <Badge variant={categoryVariant(rec.category)}>
                    {categoryLabel(rec.category)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Date: <span className="text-foreground">{rec.activity_date}</span></span>
                  <span>Fund: <span className="text-foreground">{rec.fund_account_code}</span></span>
                  <span>
                    Amount:{" "}
                    <span className="font-semibold text-foreground">{fmt(rec.amount)}</span>
                  </span>
                </div>
                {rec.description && (
                  <p className="mt-2 truncate text-muted-foreground">{rec.description}</p>
                )}
              </div>
            ))}
            <div className="rounded-lg border bg-muted/40 px-4 py-2 text-sm font-semibold flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </>
      )}

      {/* New Record dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Social Activity</DialogTitle>
          </DialogHeader>
          <form id="new-social-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="soc-fund">Fund account</FieldLabel>
                <select
                  id="soc-fund"
                  value={form.fund_account}
                  onChange={(e) => set("fund_account", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a fund…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="soc-date">Date</FieldLabel>
                <Input
                  id="soc-date"
                  type="date"
                  value={form.activity_date}
                  onChange={(e) => set("activity_date", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="soc-category">Category</FieldLabel>
                <select
                  id="soc-category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a category…</option>
                  <option value="event">Event</option>
                  <option value="support">Support</option>
                  <option value="visit">Visit</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="soc-name">Name</FieldLabel>
                <Input
                  id="soc-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="e.g. Guhemba Jean & Marie"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="soc-amount">Amount (RWF)</FieldLabel>
                <Input
                  id="soc-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  required
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="soc-description">Description</FieldLabel>
                <Input
                  id="soc-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional notes"
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-social-form" disabled={saving}>
              {saving ? "Saving…" : "Record Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
