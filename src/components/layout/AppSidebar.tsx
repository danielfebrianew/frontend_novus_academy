"use client"

import * as React from "react"
import {
  Sparkles,
  FolderOpen,
  ChevronRight,
  Images,
  Clapperboard,
  ImagePlus,
  Video,
  ReceiptText,
  Clock,
  ArrowDownLeft,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
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
    ],
  },
  {
    title: "My Workspace",
    id: "workspace",
    url: "#",
    icon: FolderOpen,
    items: [
      { title: "Assets Gallery", url: "/gallery", icon: Images },
    ],
  },
  {
    title: "Billing & Finance",
    id: "billing",
    url: "#",
    icon: ReceiptText,
    items: [
      { title: "Top Up Deposit", url: "/deposit", icon: ArrowDownLeft },
      { title: "History Saldo", url: "/history-saldo", icon: Clock },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const dispatch = useDispatch()

  const expandedSections = useSelector((state: RootState) => state.sidebar?.expandedSections || {})

  React.useEffect(() => {
    navMain.forEach((section) => {
      const isActive = section.items.some((item) => pathname.startsWith(item.url) && item.url !== "#")

      if (isActive && !expandedSections[section.id]) {
        dispatch(setSectionOpen({ id: section.id, isOpen: true }))
      }
    })
  }, [pathname, dispatch])

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
                  defaultOpen={isOpen || item.items?.some((sub) => pathname.startsWith(sub.url))}
                  onOpenChange={() => dispatch(toggleSection(item.id))}
                  className="group/collapsible"
                >
                  <SidebarMenuItem suppressHydrationWarning>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} suppressHydrationWarning>
                        {item.icon && <item.icon />}
                        <span suppressHydrationWarning>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" suppressHydrationWarning />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent suppressHydrationWarning>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 opacity-70" />}
                                <span>{subItem.title}</span>
                              </Link>
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
      <SidebarRail />
    </Sidebar>
  )
}
