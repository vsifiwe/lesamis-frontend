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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string
  member_number: string
  first_name: string
  last_name: string
}

interface LoanProduct {
  id: string
  name: string
  duration_months: number
  interest_rate_percent: string
  is_active: boolean
  notes: string
}

interface Loan {
  id: string
  member: string
  member_number: string
  member_name: string
  loan_product: string
  loan_product_name: string
  principal_amount: string
  interest_rate_percent_snapshot: string
  duration_months_snapshot: number
  total_repayment_amount: string
  monthly_installment_amount: string
  issued_date: string
  first_due_date: string
  status: string
  notes: string
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRate(r: string) {
  const n = parseFloat(r)
  return (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1)) + "%"
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("fr-RW", { minimumFractionDigits: 0 })
}

const emptyLoanForm = {
  member_id: "",
  loan_product_id: "",
  principal_amount: "",
  issued_date: new Date().toISOString().slice(0, 10),
  first_due_date: "",
  notes: "",
}

const emptyProductForm = {
  name: "",
  duration_months: "",
  interest_rate_percent: "",
  notes: "",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminLoansPage() {
  // Loans tab
  const [loans, setLoans]           = useState<Loan[]>([])
  const [loansLoading, setLoansLoading] = useState(true)
  const [loansError, setLoansError] = useState<string | null>(null)

  // New loan dialog
  const [newLoanOpen, setNewLoanOpen] = useState(false)
  const [loanForm, setLoanForm]       = useState(emptyLoanForm)
  const [savingLoan, setSavingLoan]   = useState(false)
  const [members, setMembers]         = useState<Member[]>([])

  // Loan products tab
  const [products, setProducts]     = useState<LoanProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError]     = useState<string | null>(null)

  // New product dialog
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [productForm, setProductForm]       = useState(emptyProductForm)
  const [savingProduct, setSavingProduct]   = useState(false)

  // Archive dialog
  const [archiveTarget, setArchiveTarget] = useState<LoanProduct | null>(null)
  const [archiving, setArchiving]         = useState(false)

  useEffect(() => {
    // Fetch loans, loan products, and members in parallel
    Promise.all([
      api.get<Loan[]>("/api/v1/loans/"),
      api.get<LoanProduct[]>("/api/v1/loan-products/"),
      api.get<Member[]>("/api/v1/members/"),
    ]).then(([loansData, productsData, membersData]) => {
      setLoans(loansData)
      setProducts(productsData)
      setMembers(membersData)
    }).catch((err) => {
      const msg =
        err instanceof ApiError
          ? `Failed to load data (${err.status})`
          : "Could not reach the server."
      setLoansError(msg)
      setProductsError(msg)
    }).finally(() => {
      setLoansLoading(false)
      setProductsLoading(false)
    })
  }, [])

  // ── New loan ────────────────────────────────────────────────────────────────

  async function handleCreateLoan(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingLoan(true)
    try {
      const loan = await api.post<Loan>("/api/v1/loans/", {
        member_id: loanForm.member_id,
        loan_product_id: loanForm.loan_product_id,
        principal_amount: loanForm.principal_amount,
        issued_date: loanForm.issued_date,
        first_due_date: loanForm.first_due_date,
        notes: loanForm.notes,
      })
      setLoans((prev) => [loan, ...prev])
      setNewLoanOpen(false)
      setLoanForm(emptyLoanForm)
      toast.success(`Loan issued to ${loan.member_name}.`)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to create loan (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSavingLoan(false)
    }
  }

  // ── New loan product ────────────────────────────────────────────────────────

  function handleProductFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProductForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCreateProduct(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProduct(true)
    try {
      const product = await api.post<LoanProduct>("/api/v1/loan-products/", {
        name: productForm.name,
        duration_months: Number(productForm.duration_months),
        interest_rate_percent: Number(productForm.interest_rate_percent),
        notes: productForm.notes,
      })
      setProducts((prev) => [product, ...prev])
      setNewProductOpen(false)
      setProductForm(emptyProductForm)
      toast.success(`"${product.name}" created.`)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string[]> | null
        const first = data && Object.values(data)[0]?.[0]
        toast.error(first ?? `Failed to create loan product (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSavingProduct(false)
    }
  }

  // ── Archive ─────────────────────────────────────────────────────────────────

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await api.patch(`/api/v1/loan-products/${archiveTarget.id}/archive/`)
      setProducts((prev) =>
        prev.map((p) => (p.id === archiveTarget.id ? { ...p, is_active: false } : p))
      )
      setArchiveTarget(null)
      toast.success(`"${archiveTarget.name}" archived.`)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { detail?: string } | null
        toast.error(data?.detail ?? `Failed to archive (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setArchiving(false)
    }
  }

  const activeProducts = products.filter((p) => p.is_active)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Loans</h1>
        <p className="text-sm text-muted-foreground">
          Manage loan applications, approvals, and repayments.
        </p>
      </div>

      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="loan-products">Loan Products</TabsTrigger>
        </TabsList>

        {/* ── Loans tab ── */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">All loans issued to members.</p>
            <Button size="sm" onClick={() => setNewLoanOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              New Loan
            </Button>
          </div>

          {loansLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {loansError && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-16 text-sm text-destructive">
              {loansError}
            </div>
          )}

          {!loansLoading && !loansError && loans.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
              No loans yet.
            </div>
          )}

          {!loansLoading && !loansError && loans.length > 0 && (
            <>
              {/* Desktop */}
              <div className="hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Total Repayment</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>First Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <p className="font-medium">{l.member_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{l.member_number}</p>
                        </TableCell>
                        <TableCell className="text-sm">{l.loan_product_name}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(l.principal_amount)}</TableCell>
                        <TableCell className="text-right">{fmt(l.total_repayment_amount)}</TableCell>
                        <TableCell className="text-right">{fmt(l.monthly_installment_amount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{l.issued_date}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{l.first_due_date}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === "active" ? "default" : "secondary"}>
                            {l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-3 md:hidden">
                {loans.map((l) => (
                  <div key={l.id} className="rounded-lg border p-4 text-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{l.member_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{l.member_number}</p>
                      </div>
                      <Badge variant={l.status === "active" ? "default" : "secondary"}>
                        {l.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Product: <span className="text-foreground">{l.loan_product_name}</span></span>
                      <span>Principal: <span className="font-semibold text-foreground">{fmt(l.principal_amount)}</span></span>
                      <span>Total: <span className="text-foreground">{fmt(l.total_repayment_amount)}</span></span>
                      <span>Monthly: <span className="text-foreground">{fmt(l.monthly_installment_amount)}</span></span>
                      <span>Issued: <span className="text-foreground">{l.issued_date}</span></span>
                      <span>First due: <span className="text-foreground">{l.first_due_date}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Loan Products tab ── */}
        <TabsContent value="loan-products" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define the loan terms available to members.
            </p>
            <Button size="sm" onClick={() => setNewProductOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              New Loan Product
            </Button>
          </div>

          {productsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {productsError && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-16 text-sm text-destructive">
              {productsError}
            </div>
          )}

          {!productsLoading && !productsError && products.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
              No loan products yet.
            </div>
          )}

          {!productsLoading && !productsError && products.length > 0 && (
            <>
              {/* Desktop */}
              <div className="hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.duration_months} months</TableCell>
                        <TableCell>{formatRate(p.interest_rate_percent)}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "secondary"}>
                            {p.is_active ? "Active" : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-10">
                          <LoanProductActionsMenu
                            product={p}
                            onArchive={() => setArchiveTarget(p)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-3 md:hidden">
                {products.map((p) => (
                  <div key={p.id} className="rounded-lg border p-4 text-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Active" : "Archived"}
                        </Badge>
                        <LoanProductActionsMenu
                          product={p}
                          onArchive={() => setArchiveTarget(p)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Duration: <span className="text-foreground">{p.duration_months} months</span></span>
                      <span>Rate: <span className="text-foreground">{formatRate(p.interest_rate_percent)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── New Loan dialog ── */}
      <Dialog
        open={newLoanOpen}
        onOpenChange={(v) => {
          setNewLoanOpen(v)
          if (!v) setLoanForm(emptyLoanForm)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue New Loan</DialogTitle>
          </DialogHeader>
          <form id="new-loan-form" onSubmit={handleCreateLoan}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="loan-member">Member</FieldLabel>
                <select
                  id="loan-member"
                  value={loanForm.member_id}
                  onChange={(e) => setLoanForm((p) => ({ ...p, member_id: e.target.value }))}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.member_number})
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="loan-product">Loan product</FieldLabel>
                <select
                  id="loan-product"
                  value={loanForm.loan_product_id}
                  onChange={(e) => setLoanForm((p) => ({ ...p, loan_product_id: e.target.value }))}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a product…</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="loan-principal">Principal amount</FieldLabel>
                <Input
                  id="loan-principal"
                  type="number"
                  min={1}
                  step={1}
                  value={loanForm.principal_amount}
                  onChange={(e) => setLoanForm((p) => ({ ...p, principal_amount: e.target.value }))}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel htmlFor="loan-issued">Issued date</FieldLabel>
                  <Input
                    id="loan-issued"
                    type="date"
                    value={loanForm.issued_date}
                    onChange={(e) => setLoanForm((p) => ({ ...p, issued_date: e.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="loan-first-due">First due date</FieldLabel>
                  <Input
                    id="loan-first-due"
                    type="date"
                    value={loanForm.first_due_date}
                    onChange={(e) => setLoanForm((p) => ({ ...p, first_due_date: e.target.value }))}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="loan-notes">Notes</FieldLabel>
                <Input
                  id="loan-notes"
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-loan-form" disabled={savingLoan}>
              {savingLoan ? "Issuing…" : "Issue Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Loan Product dialog ── */}
      <Dialog
        open={newProductOpen}
        onOpenChange={(v) => {
          setNewProductOpen(v)
          if (!v) setProductForm(emptyProductForm)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Loan Product</DialogTitle>
          </DialogHeader>
          <form id="new-product-form" onSubmit={handleCreateProduct}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="product-name">Name</FieldLabel>
                <Input
                  id="product-name"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFieldChange}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel htmlFor="product-duration">Duration (months)</FieldLabel>
                  <Input
                    id="product-duration"
                    name="duration_months"
                    type="number"
                    min={1}
                    value={productForm.duration_months}
                    onChange={handleProductFieldChange}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="product-rate">Interest rate (%)</FieldLabel>
                  <Input
                    id="product-rate"
                    name="interest_rate_percent"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="e.g. 5"
                    value={productForm.interest_rate_percent}
                    onChange={handleProductFieldChange}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
                <Input
                  id="product-notes"
                  name="notes"
                  value={productForm.notes}
                  onChange={handleProductFieldChange}
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-product-form" disabled={savingProduct}>
              {savingProduct ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Archive confirm dialog ── */}
      <Dialog open={!!archiveTarget} onOpenChange={(v) => { if (!v) setArchiveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Loan Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to archive{" "}
            <span className="font-semibold text-foreground">{archiveTarget?.name}</span>?
            It will no longer be available for new loans.
          </p>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Three-dot actions menu ────────────────────────────────────────────────────

function LoanProductActionsMenu({
  product,
  onArchive,
}: {
  product: LoanProduct
  onArchive: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Actions for {product.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={onArchive}
          disabled={!product.is_active}
          className="text-destructive focus:text-destructive"
        >
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
