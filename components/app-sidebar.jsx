"use client"

import * as React from "react"
import Link from "next/link"

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
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, FolderIcon, KanbanSquare, MessageSquareIcon, TicketIcon, UsersIcon, FileTextIcon, ReceiptIcon, WalletCards, Handshake, UserCogIcon, CalendarIcon, BookA, CalendarClock } from "lucide-react"

export function AppSidebar({
  role,
  user,
  business = {},
  ...props
}) {
  const { state } = useSidebar()
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "client"
  const businessName = business?.businessName || "Project Management"
  const businessLogoUrl = business?.logoUrl || ""
  const showBusinessName = state !== "collapsed"

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

  const attendancePath =
    normalizedRole === "admin"
      ? "/dashboard/admin/attendance"
      : normalizedRole === "employee"
        ? "/dashboard/employee/attendance"
        : null

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
    ...(attendancePath
      ? [
          {
            title: normalizedRole === "admin" ? "Attendance Report" : "Attendance",
            url: attendancePath,
            icon: <CalendarClock />,
          },
        ]
      : []),
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
  } else if (normalizedRole === "client") {
    navMain.push(
      {
        title: "Billing",
        url: "/dashboard/client/billing",
        icon: <ReceiptIcon />,
      },
      {
        title: "Quotations",
        url: "/dashboard/client/quotations",
        icon: <BookA />,
      },
      {
        title: "Payments",
        url: "/dashboard/client/payment",
        icon: <WalletCards />,
      }
    )
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-3 group-data-[collapsible=icon]:px-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href={roleHomePath}
              className="flex items-center gap-4 rounded-lg p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
            >
              {businessLogoUrl ? (
                <img
                  src={businessLogoUrl}
                  alt={businessName}
                  className="h-12 w-12 shrink-0 rounded-xl object-contain ring-1 ring-border/60"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Logo
                </span>
              )}
              {showBusinessName ? (
                <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-base font-semibold leading-tight">
                    {businessName}
                  </span>
                </span>
              ) : null}
            </Link>
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
            role: normalizedRole,
          }}
        />
        <div className="px-2 pb-2 group-data-[collapsible=icon]:px-0">
          <LogoutButton className="w-full justify-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
