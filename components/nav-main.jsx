// "use client"

// import { Button } from "@/components/ui/button"
// import {
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"
// import { CirclePlusIcon, MailIcon } from "lucide-react"
// import { usePathname } from "next/navigation"
// import { cn } from "@/lib/utils"
// import { useSidebar } from "@/components/ui/sidebar"

// export function NavMain({
//   items
// }) {
//   const pathname = usePathname();
//   const { state } = useSidebar();
//   return (
//     <SidebarGroup>
//       <SidebarGroupContent className="flex flex-col gap-2">
//         <SidebarMenu>
//           <SidebarMenuItem className="flex items-center gap-2">
//             <SidebarMenuButton
//               tooltip="Quick Create"
//               className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
//               <CirclePlusIcon />
//               {state !== "collapsed" && <span>Quick Create</span>}
//             </SidebarMenuButton>
//             <Button
//               size="icon"
//               className="size-8 group-data-[collapsible=icon]:opacity-0"
//               variant="outline">
//               <MailIcon />
//               <span className="sr-only">Inbox</span>
//             </Button>
//           </SidebarMenuItem>
//         </SidebarMenu>
//         <SidebarMenu>
//           {items.map((item) => (
//             <SidebarMenuItem key={item.title}>
//               <SidebarMenuButton asChild tooltip={item.title} className={cn(
//                 pathname === item.url
//                   ? "bg-black text-white dark:bg-white dark:text-black"
//                   : "hover:bg-gray-500"
//               )}>
//                 <a href={item.url} >
//                   {item.icon}
//                   {state !== "collapsed" && <span>{item.title}</span>}
//                 </a>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           ))}
//         </SidebarMenu>
//       </SidebarGroupContent>
//     </SidebarGroup>
//   );
// }



"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

function NavItems({ items, compact = false }) {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            className={cn(
              "hover:ring-1 hover:ring-border/70 hover:ring-inset",
              pathname === item.url
                ? "bg-slate-200 text-slate-900 hover:bg-slate-200 dark:bg-white dark:border-zinc-200 dark:text-black dark:hover:bg-white-700"
                : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-300 dark:hover:text-black"
            )}
          >
            <a href={item.url}>
              {item.icon}
              <span className="group-data-[collapsible=icon]:hidden">
                {compact || state === "collapsed" ? item.shortTitle || item.title : item.title}
              </span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export function NavMain({ dashboard, sections = [] }) {
  return (
    <div className="flex flex-col gap-2">
      {dashboard ? (
        <SidebarGroup>
          <SidebarGroupContent>
            <NavItems items={[dashboard]} compact />
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {sections
          .filter((section) => Array.isArray(section.items) && section.items.length > 0)
          .map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavItems items={section.items} />
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
    </div>
  )
}