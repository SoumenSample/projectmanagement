import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
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