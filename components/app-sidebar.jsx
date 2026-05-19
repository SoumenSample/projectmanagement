"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import LogoutButton from "@/components/dashboard/LogoutButton"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, FolderIcon, KanbanSquare, MessageSquareIcon, TicketIcon, UsersIcon, FileTextIcon, ReceiptIcon, WalletCards, Handshake, UserCogIcon, CalendarIcon, BookA } from "lucide-react"

export function AppSidebar({
  role,
  user,
  ...props
}) {
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "client"

  const roleHomePath =
    normalizedRole === "admin"
      ? "/dashboard/admin"
      : normalizedRole === "employee"
        ? "/dashboard/employee"
        : "/dashboard/client"

  const projectsPath =
    normalizedRole === "admin"
      ? "/dashboard/admin/projects"
      : normalizedRole === "employee"
        ? "/dashboard/employee/projects"
        : "/dashboard/client/projects"

  const navMain = [
    {
      title: "Dashboard",
      url: roleHomePath,
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Projects",
      url: projectsPath,
      icon: <FolderIcon />,
    },
    {
      title: "Kanban",
      url: "/dashboard/kanban",
      icon: <KanbanSquare />,
    },
    {
      title: "Messages",
      url: "/dashboard/messages",
      icon: <MessageSquareIcon />,
    },
    {
      title: "Tickets",
      url: "/dashboard/tickets",
      icon: <TicketIcon />,
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: <CalendarIcon />,
    },
  ]

  if (normalizedRole === "admin") {
    navMain.push(
      {
        title: "Manage Users",
        url: "/dashboard/admin/users",
        icon: <UserCogIcon />,
      },
      {
        title: "Leads",
        url: "/dashboard/admin/leads",
        icon: <FileTextIcon />,
      },
      {
        title: "Clients",
        url: "/dashboard/admin/clients",
        icon: <UsersIcon />,
      },
      {
        title: "Billing",
        url: "/dashboard/admin/billing",
        icon: <ReceiptIcon />,
      },
      {
        title: "Quotation",
        url: "/dashboard/admin/quotation",
        icon: <BookA />,
      },
      {
        title: "Contracts",
        url: "/dashboard/admin/contracts",
        icon: <Handshake />,
      },
      {
        title: "Payment",
        url: "/dashboard/admin/payment",
        icon: <WalletCards />,
      }
    )
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-2! h-auto"
            >
              <a href="/login" className="flex items-center gap-3">
              
                <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
                  Project Management
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || "User",
            email: user?.email || "",
            avatar: user?.avatar || "/logo2.png",
          }}
        />
        <div className="px-2 pb-2 group-data-[collapsible=icon]:px-0">
          <LogoutButton className="w-full justify-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
