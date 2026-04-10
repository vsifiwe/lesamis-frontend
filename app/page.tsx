import Link from "next/link"
import { PiggyBankIcon, TrendingUpIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LandingNav } from "@/components/landing-nav"

const features = [
  {
    icon: PiggyBankIcon,
    title: "Monthly Savings",
    description:
      "Every member contributes to the shared fund each month. Track balances, view contribution history, and stay accountable together.",
  },
  {
    icon: TrendingUpIcon,
    title: "Group Investments",
    description:
      "Put your pooled savings to work. Make collective investment decisions and watch your group's wealth grow over time.",
  },
  {
    icon: UsersIcon,
    title: "Social Gatherings",
    description:
      "More than money — Les Amis is about friendship. Organise visits, celebrations, and events to support each other.",
  },
]

const steps = [
  {
    number: "01",
    title: "Log in to your account",
    description: "Access your personal dashboard using the credentials provided by your group admin.",
  },
  {
    number: "02",
    title: "View contributions",
    description: "See your contribution history, check your balance, and stay up to date with the group fund.",
  },
  {
    number: "03",
    title: "Stay connected",
    description: "Keep track of investments, upcoming gatherings, and everything happening in the group.",
  },
]

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <LandingNav />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Your Group.{" "}
            <span className="text-primary">Your Dashboard.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Welcome to Les Amis — the private dashboard for members to track monthly contributions,
            shared investments, and group gatherings.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Login to your account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything your group needs
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Getting started
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-2">
                <span className="text-3xl font-bold text-primary/30">{step.number}</span>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">
            Your group is waiting.
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
            Log in to view your contributions, track group investments, and stay connected with your friends.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-8 w-full sm:w-auto"
          >
            <Link href="/login">Login to your account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Separator className="mb-6" />
          <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <span className="font-medium text-foreground">Les Amis</span>
            <span>&copy; {new Date().getFullYear()} Les Amis. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
