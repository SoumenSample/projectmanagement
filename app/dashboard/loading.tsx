import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card/40 p-4 lg:block">
          <div className="space-y-4">
            <Skeleton className="h-10 w-40 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-5/6 rounded-lg" />
              <Skeleton className="h-9 w-4/5 rounded-lg" />
              <Skeleton className="h-9 w-11/12 rounded-lg" />
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-6">
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
        </main>
      </div>
    </div>
  )
}