"use client"

import { useState } from "react"
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, Users, MoreHorizontal, Search,
  Grid3X3, List, ChevronDown, Menu,
} from "lucide-react"
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { type CalendarEvent } from "../types"

import eventsData from "../data/events.json"

interface CalendarMainProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

const EVENT_COLORS: Record<string, string> = {
  "bg-blue-500": "#3b82f6","bg-emerald-500": "#10b981","bg-green-500": "#22c55e",
  "bg-pink-500": "#ec4899","bg-orange-500": "#f97316","bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7","bg-red-500": "#ef4444","bg-red-600": "#dc2626",
  "bg-yellow-500": "#eab308","bg-cyan-500": "#06b6d4",
}
function rc(c: string) { return EVENT_COLORS[c] || c }

export function CalendarMain({ selectedDate, onDateSelect, onMenuClick, events, onEventClick }: CalendarMainProps) {
  const sampleEvents: CalendarEvent[] = events || eventsData.map(event => ({
    ...event,
    date: new Date(event.date),
    type: event.type as CalendarEvent["type"],
    assignedRoles: event.assignedRoles as CalendarEvent["assignedRoles"],
  }))

  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewMode, setViewMode] = useState<"month" | "list">("month")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = new Date(monthStart); calStart.setDate(calStart.getDate() - monthStart.getDay())
  const calEnd = new Date(monthEnd); calEnd.setDate(calEnd.getDate() + (6 - monthEnd.getDay()))
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const getEventsForDay = (date: Date) => sampleEvents.filter(e => isSameDay(e.date, date))
  const navigateMonth = (dir: "prev" | "next") =>
    setCurrentDate(dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) { onEventClick(event) } else { setSelectedEvent(event); setShowEventDialog(true) }
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const renderGrid = () => (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border/50">
        {weekDays.map(d => (
          <div key={d} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 border-r border-border/40 last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map(day => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "min-h-[110px] cursor-pointer border-r border-b border-border/40 p-2 transition-colors last:border-r-0",
                isCurrentMonth ? "bg-background hover:bg-muted/30" : "bg-muted/10",
                isDayToday && "bg-blue-50/60 dark:bg-blue-950/20",
                isSelected && !isDayToday && "bg-muted/40"
              )}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                  isDayToday && "bg-primary text-primary-foreground text-xs font-bold",
                  !isCurrentMonth && "text-muted-foreground/30"
                )}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event, idx) => (
                  <button
                    key={event.id ?? idx}
                    onClick={e => { e.stopPropagation(); handleEventClick(event) }}
                    className="flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-xs font-medium text-white hover:opacity-85"
                    style={{ backgroundColor: rc(event.color) }}
                  >
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{event.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderList = () => {
    const upcoming = sampleEvents.filter(e => e.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime())
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2.5">
          {upcoming.map(event => (
            <button
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="flex w-full items-start gap-4 rounded-xl border border-border/50 bg-background p-4 text-left transition-all hover:border-border hover:shadow-sm"
            >
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: rc(event.color) }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{event.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(event.date, "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>
                  {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {event.attendees.slice(0, 3).map((a, i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-[9px]">{a}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8" onClick={onMenuClick}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-base font-semibold">{format(currentDate, "MMMM yyyy")}</h1>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-7 rounded-lg px-3 text-xs">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input placeholder="Search events…" className="h-8 w-52 rounded-lg pl-8 text-sm" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                {viewMode === "month" ? <Grid3X3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                {viewMode === "month" ? "Month" : "List"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("month")} className="cursor-pointer text-sm">
                <Grid3X3 className="h-3.5 w-3.5 mr-2" /> Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("list")} className="cursor-pointer text-sm">
                <List className="h-3.5 w-3.5 mr-2" /> List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {viewMode === "month" ? renderGrid() : renderList()}

      {/* Event dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 p-0 shadow-2xl overflow-hidden">
          {selectedEvent && (
            <div className="h-1 w-full" style={{ backgroundColor: rc(selectedEvent.color) }} />
          )}
          <div className="px-6 pt-5 pb-2">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedEvent?.title || "Event Details"}</DialogTitle>
              <DialogDescription className="sr-only">Event details</DialogDescription>
            </DialogHeader>
          </div>
          {selectedEvent && (
            <div className="space-y-3 px-6 pb-6">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5">
                <p className="text-sm font-medium">{format(selectedEvent.date, "EEEE, MMMM d, yyyy")}</p>
                <Badge className="rounded-full text-[10px] text-white" style={{ backgroundColor: rc(selectedEvent.color) }}>
                  {selectedEvent.type}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{selectedEvent.time} · {selectedEvent.duration}</div>
                {selectedEvent.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{selectedEvent.location}</div>}
                {selectedEvent.attendees.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.attendees.map((a, i) => (
                        <Badge key={i} variant="secondary" className="rounded-full font-normal">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowEventDialog(false)}>Edit</Button>
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => setShowEventDialog(false)}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}