"use client"

import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"

function getSidebarRole(pathname) {
  if (pathname?.includes("/admin/")) return "admin"
  if (pathname?.includes("/employee/")) return "employee"
  if (pathname?.includes("/vendor/")) return "vendor"
  return "client"
}

export default function DashboardLoading() {
  const pathname = usePathname()
  const role = getSidebarRole(pathname)

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar
        variant="inset"
        role={role}
        user={{
          name: "User",
          email: "",
          avatar: "",
        }}
        business={{
          businessName: "Project Management",
          logoUrl: "",
        }}
      />
      <SidebarInset>
        <SiteHeader title="Loading dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48 rounded-full" />
                  <Skeleton className="h-5 w-72 max-w-full rounded-full" />
                </div>
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>

              <Skeleton className="h-135 rounded-3xl" />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}