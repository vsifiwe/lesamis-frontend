"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  HomeIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  AlertCircleIcon,
  LogOutIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"

const myInfoNav = [
  { title: "Home", url: "/member/dashboard", icon: HomeIcon },
  { title: "My Contributions", url: "/member/contributions", icon: CircleDollarSignIcon },
  { title: "My Loans", url: "/member/loans", icon: CreditCardIcon },
  { title: "My Penalties", url: "/member/penalties", icon: AlertCircleIcon },
]

export function MemberSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/member/dashboard">
                <span className="text-base font-semibold">Les Amis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {myInfoNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-1 px-2 py-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Member</span>
              <span className="truncate">{user?.user_id}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
              <LogOutIcon />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
