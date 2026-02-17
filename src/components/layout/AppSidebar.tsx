"use client"

import * as React from "react"
import {
  Sparkles,
  Shuffle,
  FolderOpen,
  CalendarClock,
  Settings,
  Users,
  CreditCard,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  User,
  LineChart,
  Activity,
  Images,
  Clapperboard,
  ImagePlus,
  Video,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
import { logout } from "@/store/authSlice"
import { authService } from "@/lib/authService"
import { RootState } from "@/store/store"
import { toggleSection, setSectionOpen } from "@/store/sidebarSlice"

const navMain = [
  {
    title: "Nova Playground",
    id: "playground",
    url: "#",
    icon: Sparkles,
    items: [
      { title: "Video Generator", url: "/generate-video", icon: Clapperboard },
      { title: "Pro Video Generator", url: "/generate-pro", icon: Video },
      { title: "Image Generator ", url: "/generate-image", icon: ImagePlus },
      { title: "Video Mixer", url: "/video-mixer", icon: Shuffle },
    ],
  },
  {
    title: "My Workspace",
    id: "workspace",
    url: "#",
    icon: FolderOpen,
    items: [
      { title: "Assets Gallery", url: "/gallery", icon: Images },
      { title: "Post Scheduler", url: "/scheduler", icon: CalendarClock },
      // { title: "Caption Creation", url: "/prompts", icon: FileText },
    ],
  },
  {
    title: "Reports",
    id: "reports", // Jangan lupa tambahkan 'reports': true di sidebarSlice.ts (defaultState)
    url: "#",
    icon: LineChart,
    items: [
      { title: "Revenue", url: "/reports", icon: Activity }, // Mapping: revenue, est_komisi, base_revenue
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
      await authService.logout()
    } catch (error) {
      console.error(error)
    } finally {
      localStorage.removeItem("currentUser")
      dispatch(logout())
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navMain.map((item) => {
              const isOpen = expandedSections[item.id] ?? false

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