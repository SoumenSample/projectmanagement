"use client"

import React from "react"
import { Plus, CalendarDays } from "lucide-react"
import { DatePicker } from "./date-picker"
import { Calendars } from "./calendars"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface CalendarSidebarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onNewCalendar?: () => void
  onNewEvent?: () => void
  events?: Array<{ date: Date; count: number }>
  className?: string
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildEventDates(events: Array<{ date: Date }>) {
  const counts = new Map<string, number>()
  events.forEach(event => {
    const key = formatLocalDateKey(new Date(event.date))
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([date, count]) => {
    const [year, month, day] = date.split("-").map(Number)
    return { date: new Date(year, month - 1, day), count }
  })
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  onNewCalendar,
  onNewEvent,
  events = [],
  className,
}: CalendarSidebarProps) {
  const [eventsData, setEventsData] = React.useState<{ date: Date; title: string; time?: string }[]>([])

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events")
        const data = await res.json()
        const eventArray = Array.isArray(data) ? data : data.events || data.data || []
        setEventsData(
          eventArray.map((e: any) => ({
            date: new Date(e.date),
            title: e.title,
            time: e.time,
          }))
        )
      } catch (err) {
        console.error("Error fetching events:", err)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = eventsData.filter(event =>
    selectedDate &&
    new Date(event.date).toDateString() === new Date(selectedDate).toDateString()
  )

  const eventDates = buildEventDates(eventsData)

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Add New Event */}
      <div className="p-4 pb-3">
        <Button
          onClick={onNewEvent}
          className="w-full gap-2 rounded-xl bg-foreground text-background shadow-sm hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Mini calendar */}
      <DatePicker
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        events={eventDates.length > 0 ? eventDates : events}
      />

      <Separator className="my-2 opacity-50" />

      {/* Events for selected day */}
      <div className="px-4 py-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {selectedDate
            ? selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : "Today"}
        </p>
        <div className="space-y-1.5">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 py-5 text-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/50">No events</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  {event.time && (
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Separator className="my-2 opacity-50" />

      {/* Calendar list */}
      <div className="flex-1 overflow-y-auto">
        <Calendars onNewCalendar={onNewCalendar} />
      </div>
    </div>
  )
}