import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import ThemeToggle from "@/components/ThemeToggle"
import NotificationCenter from "@/components/NotificationCenter"
import { cn } from "@/lib/utils"

export function SiteHeader({ title = "Dashboard", subtitle = "", className, contentClassName }) {
  const displayTitle = subtitle ? `${title} (${subtitle})` : title

  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-t-xl px-4 lg:gap-2 lg:px-6 bg-white dark:bg-black",
          contentClassName
        )}
      >
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-10" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-medium text-foreground">{displayTitle}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
