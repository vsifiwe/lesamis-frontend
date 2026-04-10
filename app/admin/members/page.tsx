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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Member {
  id: string
  member_number: string
  first_name: string
  last_name: string
  phone: string
  email: string
  status: string
  join_date: string
  exit_date: string | null
  share_count: number
}

interface ShareAccount {
  id: string
  member: string
  share_count: number
  share_unit_value: number
  total_value: number
}

// ── New Member form ───────────────────────────────────────────────────────────

const emptyMemberForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  join_date: new Date().toISOString().slice(0, 10),
  default_password: "",
}

// ── Adjust Shares form ────────────────────────────────────────────────────────

const emptyShareForm = {
  action: "INCREASE" as "INCREASE" | "DECREASE",
  amount: 1,
  payment_method: "cash" as "cash" | "bank" | "mobile_money",
  received_date: new Date().toISOString().slice(0, 10),
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New member dialog
  const [newMemberOpen, setNewMemberOpen] = useState(false)
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [savingMember, setSavingMember] = useState(false)

  // Adjust shares dialog
  const [shareTarget, setShareTarget] = useState<Member | null>(null)
  const [shareForm, setShareForm] = useState(emptyShareForm)
  const [savingShares, setSavingShares] = useState(false)

  useEffect(() => {
    api
      .get<Member[]>("/api/v1/members/")
      .then(setMembers)
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? `Failed to load members (${err.status})`
            : "Could not reach the server."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── New member ──────────────────────────────────────────────────────────────

  function handleMemberFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMemberForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCreateMember(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingMember(true)
    try {
      const member = await api.post<Member>("/api/v1/members/", memberForm)
      setMembers((prev) => [member, ...prev])
      setNewMemberOpen(false)
      setMemberForm(emptyMemberForm)
      toast.success(`${member.first_name} ${member.last_name} added successfully.`)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string[]> | null
        const first = data && Object.values(data)[0]?.[0]
        toast.error(first ?? `Failed to create member (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSavingMember(false)
    }
  }

  // ── Adjust shares ───────────────────────────────────────────────────────────

  function openShareDialog(member: Member) {
    setShareTarget(member)
    setShareForm(emptyShareForm)
  }

  function closeShareDialog() {
    setShareTarget(null)
    setShareForm(emptyShareForm)
  }

  async function handleAdjustShares(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!shareTarget) return
    setSavingShares(true)
    try {
      const payload: Record<string, unknown> = {
        member_id: shareTarget.id,
        action: shareForm.action,
        amount: shareForm.amount,
      }
      if (shareForm.action === "INCREASE") {
        payload.payment_method = shareForm.payment_method
        payload.received_date = shareForm.received_date
      }

      const account = await api.post<ShareAccount>("/api/v1/shares/adjust/", payload)

      // Reflect updated share count in the member list
      setMembers((prev) =>
        prev.map((m) =>
          m.id === shareTarget.id
            ? { ...m, share_count: account.share_count }
            : m
        )
      )

      closeShareDialog()
      toast.success(
        `Shares ${shareForm.action === "INCREASE" ? "increased" : "decreased"} to ${account.share_count}.`
      )
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string | string[]> | null
        const first =
          data &&
          (typeof Object.values(data)[0] === "string"
            ? (Object.values(data)[0] as string)
            : (Object.values(data)[0] as string[])[0])
        toast.error(first ?? `Failed to adjust shares (${err.status})`)
      } else {
        toast.error("Could not reach the server.")
      }
    } finally {
      setSavingShares(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage group members and their status.
          </p>
        </div>

        <Button size="sm" onClick={() => setNewMemberOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          New Member
        </Button>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted-foreground">
          Loading members…
        </div>
      )}
      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && members.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
          No members found.
        </div>
      )}

      {/* ── Desktop table ── */}
      {!loading && !error && members.length > 0 && (
        <>
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {m.member_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.first_name} {m.last_name}
                    </TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>{m.share_count}</TableCell>
                    <TableCell>{m.join_date}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "active" ? "default" : "secondary"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-10">
                      <MemberActionsMenu member={m} onAdjustShares={openShareDialog} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {members.map((m) => (
              <div key={m.id} className="rounded-lg border p-4 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {m.member_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === "active" ? "default" : "secondary"}>
                      {m.status}
                    </Badge>
                    <MemberActionsMenu member={m} onAdjustShares={openShareDialog} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span className="text-foreground">{m.email}</span>
                  <span>{m.phone}</span>
                  <span>Shares: {m.share_count}</span>
                  <span>Joined: {m.join_date}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── New Member dialog ── */}
      <Dialog
        open={newMemberOpen}
        onOpenChange={(v) => {
          setNewMemberOpen(v)
          if (!v) setMemberForm(emptyMemberForm)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <form id="new-member-form" onSubmit={handleCreateMember}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel htmlFor="first_name">First name</FieldLabel>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={memberForm.first_name}
                    onChange={handleMemberFieldChange}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">Last name</FieldLabel>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={memberForm.last_name}
                    onChange={handleMemberFieldChange}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={memberForm.email}
                  onChange={handleMemberFieldChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={memberForm.phone}
                  onChange={handleMemberFieldChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="join_date">Join date</FieldLabel>
                <Input
                  id="join_date"
                  name="join_date"
                  type="date"
                  value={memberForm.join_date}
                  onChange={handleMemberFieldChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="default_password">Default password</FieldLabel>
                <Input
                  id="default_password"
                  name="default_password"
                  type="password"
                  value={memberForm.default_password}
                  onChange={handleMemberFieldChange}
                  required
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter showCloseButton>
            <Button type="submit" form="new-member-form" disabled={savingMember}>
              {savingMember ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Shares dialog ── */}
      <Dialog open={!!shareTarget} onOpenChange={(v) => { if (!v) closeShareDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust Shares —{" "}
              {shareTarget
                ? `${shareTarget.first_name} ${shareTarget.last_name}`
                : ""}
            </DialogTitle>
          </DialogHeader>

          <form id="adjust-shares-form" onSubmit={handleAdjustShares}>
            <FieldGroup>
              {/* Action toggle */}
              <Field>
                <FieldLabel>Action</FieldLabel>
                <div className="flex gap-2">
                  {(["INCREASE", "DECREASE"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setShareForm((p) => ({ ...p, action: a }))}
                      className={[
                        "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        shareForm.action === a
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {a === "INCREASE" ? "Increase" : "Decrease"}
                    </button>
                  ))}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="share-amount">Number of shares</FieldLabel>
                <Input
                  id="share-amount"
                  type="number"
                  min={1}
                  value={shareForm.amount}
                  onChange={(e) =>
                    setShareForm((p) => ({ ...p, amount: Number(e.target.value) }))
                  }
                  required
                />
              </Field>

              {shareForm.action === "INCREASE" && (
                <>
                  <Field>
                    <FieldLabel htmlFor="payment-method">Payment method</FieldLabel>
                    <select
                      id="payment-method"
                      value={shareForm.payment_method}
                      onChange={(e) =>
                        setShareForm((p) => ({
                          ...p,
                          payment_method: e.target.value as typeof shareForm.payment_method,
                        }))
                      }
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="received-date">Date received</FieldLabel>
                    <Input
                      id="received-date"
                      type="date"
                      value={shareForm.received_date}
                      onChange={(e) =>
                        setShareForm((p) => ({ ...p, received_date: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>

          <DialogFooter showCloseButton>
            <Button type="submit" form="adjust-shares-form" disabled={savingShares}>
              {savingShares ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Three-dot actions menu ────────────────────────────────────────────────────

function MemberActionsMenu({
  member,
  onAdjustShares,
}: {
  member: Member
  onAdjustShares: (m: Member) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Actions for {member.first_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAdjustShares(member)}>
          Adjust Shares
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
