"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  HomeIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  AlertCircleIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  ChevronUpIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth-provider"
import { useMe } from "@/hooks/use-me"

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
  const me = useMe()
  const { theme, setTheme } = useTheme()

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-1.5">
                  <div className="flex flex-col gap-0.5 text-xs text-left">
                    <span className="font-medium text-foreground">{me?.full_name ?? user?.user_id}</span>
                    <span className="text-muted-foreground">{me?.role ?? "Member"}</span>
                  </div>
                  <ChevronUpIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  <span className="flex-1">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  <Switch checked={theme === "dark"} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
