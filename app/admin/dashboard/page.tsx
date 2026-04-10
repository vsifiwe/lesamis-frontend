"use client"

import { WalletIcon, UsersIcon, HandCoinsIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const stats = [
  { label: "Total Fund", value: "—", icon: WalletIcon, description: "Combined group savings" },
  { label: "Active Members", value: "—", icon: UsersIcon, description: "Members in good standing" },
  { label: "Active Loans", value: "—", icon: HandCoinsIcon, description: "Loans currently outstanding" },
  { label: "Total Invested", value: "—", icon: TrendingUpIcon, description: "Group investment portfolio" },
]

export default function AdminDashboardPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the group&apos;s finances and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardHeader className="pt-0">
              <p className="text-2xl font-bold">{stat.value}</p>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  )
}
