"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboardIcon,
  UsersIcon,
  WalletIcon,
  TriangleAlertIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  FileBarChart2Icon,
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
  SidebarSeparator,
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

const adminNav = [
  { title: "Home", url: "/admin/dashboard", icon: LayoutDashboardIcon },
  { title: "Members", url: "/admin/members", icon: UsersIcon },
  { title: "Contributions", url: "/admin/contributions", icon: WalletIcon },
  { title: "Penalties", url: "/admin/penalties", icon: TriangleAlertIcon },
  { title: "Loans", url: "/admin/loans", icon: HandCoinsIcon },
  { title: "Investments", url: "/admin/investments", icon: TrendingUpIcon },
  { title: "Reports & Audit", url: "/admin/reports", icon: FileBarChart2Icon },
]

const myInfoNav = [
  { title: "Home", url: "/admin/my", icon: HomeIcon },
  { title: "My Contributions", url: "/admin/my/contributions", icon: CircleDollarSignIcon },
  { title: "My Loans", url: "/admin/my/loans", icon: CreditCardIcon },
  { title: "My Penalties", url: "/admin/my/penalties", icon: AlertCircleIcon },
]

export function AdminSidebar() {
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
              <Link href="/admin/dashboard">
                <span className="text-base font-semibold">Les Amis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Administration section */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
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

        <SidebarSeparator />

        {/* My Information section */}
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
                    <span className="text-muted-foreground">{me?.role ?? "Admin"}</span>
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
