"use client"

import { AuthGuard } from "@/components/auth-guard"
import { MemberSidebar } from "@/components/member-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="member">
      <SidebarProvider>
        <MemberSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex flex-1 flex-col gap-6 p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
