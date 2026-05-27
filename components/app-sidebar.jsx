"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
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
import { LayoutDashboardIcon, FolderIcon, KanbanSquare, MessageSquareIcon, TicketIcon, UsersIcon, FileTextIcon, ReceiptIcon, WalletCards, Handshake, UserCogIcon, CalendarIcon, BookA, CalendarClock, Table2 } from "lucide-react"

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
  const isVendor = normalizedRole === "vendor"
  const roleBasePath =
    normalizedRole === "admin"
      ? "/dashboard/admin"
      : normalizedRole === "employee"
        ? "/dashboard/employee"
        : isVendor
          ? "/dashboard/vendor"
          : "/dashboard/client"

  const scopedPath = (slug) => `${roleBasePath}/${slug}`

  const roleHomePath = roleBasePath
  const projectsPath = scopedPath("projects")

  const attendancePath =
    normalizedRole === "admin"
      ? scopedPath("attendance")
      : normalizedRole === "employee"
        ? scopedPath("attendance")
        : null

  const messagesPath = isVendor ? "/dashboard/vendor/messages" : "/dashboard/messages"
  const schedulePath = isVendor ? "/dashboard/vendor/schedule" : "/schedule"
  const ticketsPath = isVendor ? "/dashboard/vendor/tickets" : "/dashboard/tickets"
  const kanbanPath = isVendor ? "/dashboard/vendor/kanban" : "/dashboard/kanban"
  const quotationPath = normalizedRole === "client" ? scopedPath("quotations") : scopedPath("quotation")

  const dashboardItem = {
    title: "Dashboard",
    url: roleHomePath,
    icon: <LayoutDashboardIcon />,
  }

  const sidebarSections = (() => {
    if (normalizedRole === "admin") {
      return [
        {
          label: "Project",
          items: [
            { title: "Projects", url: projectsPath, icon: <FolderIcon /> },
            { title: "Kanban", url: kanbanPath, icon: <KanbanSquare /> },
            { title: "Tickets", url: ticketsPath, icon: <TicketIcon /> },
          ],
        },
        {
          label: "Connect",
          items: [
            { title: "Messages", url: messagesPath, icon: <MessageSquareIcon /> },
            { title: "Schedule", url: schedulePath, icon: <CalendarIcon /> },
          ],
        },
        {
          label: "Users",
          items: [
            { title: "Manage Users", url: scopedPath("users"), icon: <UserCogIcon /> },
            { title: "Leads", url: scopedPath("leads"), icon: <FileTextIcon /> },
            { title: "Clients", url: scopedPath("clients"), icon: <UsersIcon /> },
            { title: "Attendance", url: attendancePath, icon: <CalendarClock /> },
          ],
        },
        {
          label: "Business",
          items: [
            { title: "Billing", url: scopedPath("billing"), icon: <ReceiptIcon /> },
            { title: "Payment", url: scopedPath("payment"), icon: <WalletCards /> },
            { title: "Quotation", url: quotationPath, icon: <BookA /> },
            { title: "Contract", url: scopedPath("contracts"), icon: <Handshake /> },
          ],
        },
        {
          label: "Documents",
          items: [
            { title: "Documents", url: scopedPath("documents"), icon: <FileTextIcon /> },
            { title: "Sheets", url: scopedPath("sheets"), icon: <Table2 /> },
          ],
        },
      ]
    }

    if (isVendor) {
      return [
        {
          label: "Project",
          items: [
            { title: "Projects", url: projectsPath, icon: <FolderIcon /> },
            { title: "Kanban", url: kanbanPath, icon: <KanbanSquare /> },
            { title: "Tickets", url: ticketsPath, icon: <TicketIcon /> },
          ],
        },
        {
          label: "Connect",
          items: [
            { title: "Messages", url: messagesPath, icon: <MessageSquareIcon /> },
            { title: "Schedule", url: schedulePath, icon: <CalendarIcon /> },
          ],
        },
        {
          label: "Business",
          items: [
            { title: "Contracts", url: scopedPath("contracts"), icon: <Handshake /> },
            { title: "Payment", url: scopedPath("payment"), icon: <WalletCards /> },
          ],
        },
      ]
    }

    if (normalizedRole === "employee") {
      return [
        {
          label: "Project",
          items: [{ title: "Projects", url: projectsPath, icon: <FolderIcon /> }],
        },
        {
          label: "Users",
          items: attendancePath
            ? [{ title: "Attendance", url: attendancePath, icon: <CalendarClock /> }]
            : [],
        },
        {
          label: "Business",
          items: [{ title: "Payment", url: scopedPath("payment"), icon: <WalletCards /> }],
        },
      ]
    }

    return [
      {
        label: "Project",
        items: [{ title: "Projects", url: projectsPath, icon: <FolderIcon /> }],
      },
      {
        label: "Business",
        items: [
          { title: "Billing", url: scopedPath("billing"), icon: <ReceiptIcon /> },
          { title: "Quotation", url: quotationPath, icon: <BookA /> },
          { title: "Payments", url: scopedPath("payment"), icon: <WalletCards /> },
        ],
      },
    ]
  })()
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
        <NavMain dashboard={dashboardItem} sections={sidebarSections} />
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
