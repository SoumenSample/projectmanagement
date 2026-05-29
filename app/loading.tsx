"use client"

import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

function DashboardLoadingShell() {
  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh w-full">
        <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col" aria-hidden>
          {/* Keep the existing sidebar visible during client navigation; do not render a demo AppSidebar here. */}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-12 shrink-0 items-center border-b border-border/60 bg-white px-4 lg:px-6 dark:bg-black">
            <div className="flex w-full items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="h-8 w-px bg-border/70" />
              <Skeleton className="h-5 w-56 max-w-[45vw] rounded-full" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 md:px-6">
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
        </main>
      </div>
    </div>
  )
}

function GenericLoadingShell() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56 rounded-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Skeleton className="h-105 rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  const pathname = usePathname()

  if (pathname?.startsWith("/dashboard")) {
    return <DashboardLoadingShell />
  }

  return <GenericLoadingShell />
}