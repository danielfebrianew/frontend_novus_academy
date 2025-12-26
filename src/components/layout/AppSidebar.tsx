"use client"

import * as React from "react"
import axios from "axios"
import {
  Sparkles,
  Wand2,
  Shuffle,
  Frame,
  FolderOpen,
  Folder,
  ImageIcon,
  CalendarClock,
  FileText,
  History,
  Settings,
  Users,
  CreditCard,
  LayoutDashboard,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  User,
  LineChart,
  Activity,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useRouter, usePathname } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import Cookies from "js-cookie"
import { logout } from "@/store/authSlice"
import { RootState } from "@/store/store"
import { toggleSection, setSectionOpen } from "@/store/sidebarSlice"

const navMain = [
  {
    title: "Nova Playground",
    id: "playground",
    url: "#",
    icon: Sparkles,
    items: [
      { title: "Generator", url: "/generate", icon: Wand2 },
      { title: "Video Mixer", url: "/video-mixer", icon: Shuffle },
      { title: "Editor (Canvas)", url: "/editor", icon: Frame },
    ],
  },
  {
    title: "My Workspace",
    id: "workspace",
    url: "#",
    icon: FolderOpen,
    items: [
      { title: "All Projects", url: "/projects", icon: Folder },
      { title: "Assets Library", url: "/assets", icon: ImageIcon },
      { title: "Post Scheduler", url: "/scheduler", icon: CalendarClock },
      { title: "Prompt Library", url: "/prompts", icon: FileText },
      { title: "History", url: "/history", icon: History },
    ],
  },
  {
    title: "Reports",
    id: "reports", // Jangan lupa tambahkan 'reports': true di sidebarSlice.ts (defaultState)
    url: "#",
    icon: LineChart,
    items: [
      { title: "Earnings & Commission", url: "/reports", icon: Activity }, // Mapping: revenue, est_komisi, base_revenue
    ],
  },
  {
    title: "Settings",
    id: "settings",
    url: "#",
    icon: Settings,
    items: [
      { title: "Tiktok Accounts", url: "/accounts", icon: Users },
      { title: "Billing & Usage", url: "/billing", icon: CreditCard },
      { title: "Team Members", url: "/team", icon: Users },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch()
  
  const { user } = useSelector((state: RootState) => state.auth)
  const expandedSections = useSelector((state: RootState) => state.sidebar?.expandedSections || {})

  const userData = {
    name: user?.username || user?.name || "Guest",
    email: user?.email || "",
    avatar: user?.avatar || "",
    initials: user?.username ? user.username.substring(0, 2).toUpperCase() : "CN"
  }

  React.useEffect(() => {
    navMain.forEach((section) => {
      const isActive = section.items.some((item) => pathname.startsWith(item.url) && item.url !== "#")
      
      if (isActive && !expandedSections[section.id]) {
        dispatch(setSectionOpen({ id: section.id, isOpen: true }))
      }
    })
  }, [pathname, dispatch, expandedSections])

  const handleLogout = async () => {
    try {
      const token = Cookies.get("accessToken")
      if (token) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch (error) {
      console.error(error)
    } finally {
      Cookies.remove("accessToken")
      Cookies.remove("currentUser")
      dispatch(logout())
      router.push("/")
      router.refresh()
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === "/dashboard"}>
                <a href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
                const isOpen = expandedSections[item.id] ?? true

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    open={isOpen}
                    onOpenChange={() => dispatch(toggleSection(item.id))}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <a href={subItem.url}>
                                  {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 opacity-70" />}
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="rounded-lg">{userData.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userData.name}</span>
                    <span className="truncate text-xs">{userData.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userData.avatar} alt={userData.name} />
                      <AvatarFallback className="rounded-lg">{userData.initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userData.name}</span>
                      <span className="truncate text-xs">{userData.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}