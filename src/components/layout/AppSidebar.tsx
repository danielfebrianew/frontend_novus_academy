"use client"

import * as React from "react"
// Import Axios
import axios from "axios" //
import {
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Settings2,
  History,
  LogOut,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  LayoutDashboard,
  FolderOpen,
  Image as ImageIcon,
  CalendarClock,
  FileText,
  Code,
  Wand2,
  Shuffle,
  Frame,
  SlidersHorizontal,
  Users,
  BookText,
  Folder,
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
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import Cookies from "js-cookie"
import { logout } from "@/store/authSlice"

// --- DATA DUMMY (SAMA SEPERTI SEBELUMNYA) ---
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Nova Playground",
      url: "#",
      icon: Sparkles,
      isActive: true,
      items: [
        {
          title: "Generator",
          url: "/generate",
          icon: Wand2,
        },
        {
          title: "Video Mixer",
          url: "/video-mixer",
          icon: Shuffle,
        },
        {
          title: "Editor (Canvas)",
          url: "#",
          icon: Frame,
        },
      ],
    },
    {
      title: "My Workspace",
      url: "#",
      icon: FolderOpen,
      isActive: true,
      items: [
        {
          title: "All Projects",
          url: "#",
          icon: Folder,
        },
        {
          title: "Assets Library",
          url: "#",
          icon: ImageIcon,
        },
        {
          title: "Post Scheduler",
          url: "/scheduler",
          icon: CalendarClock,
        },
        {
          title: "Prompt Library",
          url: "#",
          icon: FileText,
        },
        {
          title: "History",
          url: "#",
          icon: History,
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "AI Models",
          url: "#",
          icon: Bot,
        },
        {
          title: "API & Developers",
          url: "#",
          icon: Code,
        },
        {
          title: "Documentation",
          url: "#",
          icon: BookText,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
          icon: SlidersHorizontal,
        },
        {
          title: "Billing & Usage",
          url: "#",
          icon: CreditCard,
        },
        {
          title: "Team Members",
          url: "#",
          icon: Users,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const dispatch = useDispatch()

  // --- REVISI: LOGOUT MENGGUNAKAN AXIOS ---
  const handleLogout = async () => {
    try {
      // 1. Ambil token dari cookies
      const token = Cookies.get("accessToken")

      if (token) {
        // 2. Kirim request POST ke endpoint logout backend
        // Menggunakan axios untuk request HTTP yang lebih bersih
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`,
          {}, // Body kosong untuk request logout standar
          {
            headers: {
              Authorization: `Bearer ${token}`, // Header Authorization Wajib untuk Redis session
            },
          }
        )
      }
    } catch (error) {
      // Log error jika request backend gagal, tapi flow logout di frontend tetap jalan
      console.error("Logout failed on server:", error)
    } finally {
      // 3. Bersihkan state Frontend (Cookies & Redux) apapun hasil request server
      Cookies.remove("accessToken")
      Cookies.remove("currentUser")
      
      dispatch(logout())

      // 4. Redirect dan refresh untuk update UI
      router.push("/")
      router.refresh()
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        {/* Dashboard Link Langsung */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <a href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Menu Navigasi Utama */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
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
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              {/* Render icon jika ada di data dummy */}
                              {/* @ts-ignore - Bypass TS check untuk properti icon dinamis */}
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
            ))}
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
                    <AvatarImage src={data.user.avatar} alt={data.user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
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
                      <AvatarImage src={data.user.avatar} alt={data.user.name} />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{data.user.name}</span>
                      <span className="truncate text-xs">{data.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {/* Trigger Logout Function */}
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