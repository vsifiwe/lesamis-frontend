import { AuthGuard } from "@/components/auth-guard"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="member">{children}</AuthGuard>
}
