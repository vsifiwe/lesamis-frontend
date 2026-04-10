"use client"

export default function AdminMyLoansPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Loans</h1>
        <p className="text-sm text-muted-foreground">Your active and past loan records.</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
        Your loan history will appear here.
      </div>
    </>
  )
}
