"use client"

export default function AdminMyPenaltiesPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Penalties</h1>
        <p className="text-sm text-muted-foreground">Penalties issued to your account and their status.</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
        Your penalties will appear here.
      </div>
    </>
  )
}
