import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen w-full px-4 py-6 md:px-6">
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
  )
}