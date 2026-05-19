"use client"

import { useState } from "react"
import { Check, ChevronRight, Plus, Eye, EyeOff, MoreHorizontal } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CalendarItem {
  id: string
  name: string
  color: string
  hex: string
  visible: boolean
  type: "personal" | "work" | "shared"
}

interface CalendarGroup {
  name: string
  items: CalendarItem[]
}

interface CalendarsProps {
  onCalendarToggle?: (calendarId: string, visible: boolean) => void
  onCalendarEdit?: (calendarId: string) => void
  onCalendarDelete?: (calendarId: string) => void
  onNewCalendar?: () => void
}

const enhancedCalendars: CalendarGroup[] = [
  {
    name: "My Calendars",
    items: [
      { id: "personal", name: "Personal", color: "bg-blue-500", hex: "#3b82f6", visible: true, type: "personal" },
      { id: "work", name: "Work", color: "bg-emerald-500", hex: "#10b981", visible: true, type: "work" },
      { id: "family", name: "Family", color: "bg-pink-500", hex: "#ec4899", visible: true, type: "personal" },
    ],
  },
  {
    name: "Favorites",
    items: [
      { id: "holidays", name: "Holidays", color: "bg-red-500", hex: "#ef4444", visible: true, type: "shared" },
      { id: "birthdays", name: "Birthdays", color: "bg-violet-500", hex: "#8b5cf6", visible: true, type: "personal" },
    ],
  },
  {
    name: "Other",
    items: [
      { id: "travel", name: "Travel", color: "bg-orange-500", hex: "#f97316", visible: false, type: "personal" },
      { id: "reminders", name: "Reminders", color: "bg-yellow-500", hex: "#eab308", visible: true, type: "personal" },
      { id: "deadlines", name: "Deadlines", color: "bg-rose-600", hex: "#e11d48", visible: true, type: "work" },
    ],
  },
]

export function Calendars({ onCalendarToggle, onCalendarEdit, onCalendarDelete, onNewCalendar }: CalendarsProps) {
  const [calendarData, setCalendarData] = useState(enhancedCalendars)

  const handleToggleVisibility = (calendarId: string) => {
    setCalendarData(prev =>
      prev.map(group => ({
        ...group,
        items: group.items.map(item =>
          item.id === calendarId ? { ...item, visible: !item.visible } : item
        ),
      }))
    )
    const calendar = calendarData.flatMap(g => g.items).find(c => c.id === calendarId)
    if (calendar) onCalendarToggle?.(calendarId, !calendar.visible)
  }

  const handleNewCalendarClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    onNewCalendar?.()
  }

  return (
      <div></div>
    // <div className="space-y-1 px-2 py-1">
    //   {calendarData.map((group, index) => (
    //     <Collapsible key={group.name} defaultOpen={index === 0} className="group/col">
    //       <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
    //         <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
    //           {group.name}
    //         </span>
    //         <div className="flex items-center gap-1">
    //           {index === 0 && (
    //             <span
    //               role="button"
    //               tabIndex={0}
    //               aria-label="Add calendar"
    //               className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover/col:opacity-100"
    //               onClick={handleNewCalendarClick}
    //               onKeyDown={(event) => {
    //                 if (event.key === "Enter" || event.key === " ") {
    //                   event.preventDefault()
    //                   handleNewCalendarClick(event as unknown as React.MouseEvent<HTMLSpanElement>)
    //                 }
    //               }}
    //             >
    //               <Plus className="h-3 w-3" />
    //             </span>
    //           )}
    //           <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/col:rotate-90" />
    //         </div>
    //       </CollapsibleTrigger>

    //       <CollapsibleContent>
    //         <div className="mt-0.5 space-y-0.5">
    //           {group.items.map(item => (
    //             <div
    //               key={item.id}
    //               className="group/item flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
    //             >
    //               {/* Color checkbox */}
    //               <button
    //                 onClick={() => handleToggleVisibility(item.id)}
    //                 className={cn(
    //                   "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-2 transition-all",
    //                   item.visible ? "border-transparent" : "border-muted-foreground/30 bg-transparent"
    //                 )}
    //                 style={item.visible ? { backgroundColor: item.hex } : {}}
    //               >
    //                 {item.visible && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
    //               </button>

    //               {/* Name */}
    //               <span
    //                 onClick={() => handleToggleVisibility(item.id)}
    //                 className={cn(
    //                   "flex-1 cursor-pointer truncate text-sm",
    //                   item.visible ? "text-foreground" : "text-muted-foreground/50"
    //                 )}
    //               >
    //                 {item.name}
    //               </span>

    //               {/* Hover actions */}
    //               <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
    //                 <button
    //                   onClick={() => handleToggleVisibility(item.id)}
    //                   className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
    //                 >
    //                   {item.visible
    //                     ? <Eye className="h-3 w-3" />
    //                     : <EyeOff className="h-3 w-3" />}
    //                 </button>

    //                 <DropdownMenu>
    //                   <DropdownMenuTrigger asChild>
    //                     <button
    //                       onClick={e => e.stopPropagation()}
    //                       className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
    //                     >
    //                       <MoreHorizontal className="h-3 w-3" />
    //                     </button>
    //                   </DropdownMenuTrigger>
    //                   <DropdownMenuContent align="end" side="right" className="text-sm">
    //                     <DropdownMenuItem onClick={() => onCalendarEdit?.(item.id)} className="cursor-pointer">
    //                       Edit calendar
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem onClick={() => handleToggleVisibility(item.id)} className="cursor-pointer">
    //                       {item.visible ? "Hide" : "Show"} calendar
    //                     </DropdownMenuItem>
    //                     <DropdownMenuSeparator />
    //                     <DropdownMenuItem
    //                       onClick={() => onCalendarDelete?.(item.id)}
    //                       className="cursor-pointer text-destructive focus:text-destructive"
    //                     >
    //                       Delete calendar
    //                     </DropdownMenuItem>
    //                   </DropdownMenuContent>
    //                 </DropdownMenu>
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       </CollapsibleContent>
    //     </Collapsible>
    //   ))}
    // </div>
  )
}