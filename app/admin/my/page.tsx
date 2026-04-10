"use client"

import { CircleDollarSignIcon, CreditCardIcon, AlertCircleIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const stats = [
  { label: "My Contributions", value: "—", icon: CircleDollarSignIcon, description: "Total contributed to date" },
  { label: "Active Loans", value: "—", icon: CreditCardIcon, description: "Loans currently outstanding" },
  { label: "Penalties", value: "—", icon: AlertCircleIcon, description: "Outstanding penalties" },
]

export default function AdminMyHomePage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">My Information</h1>
        <p className="text-sm text-muted-foreground">A personal view of your contributions, loans, and penalties.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
