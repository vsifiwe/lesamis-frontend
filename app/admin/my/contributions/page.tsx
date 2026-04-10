"use client"

export default function AdminMyContributionsPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Contributions</h1>
        <p className="text-sm text-muted-foreground">Your personal contribution history and upcoming payments.</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
        Your contribution history will appear here.
      </div>
    </>
  )
}
