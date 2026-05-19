"use client"

import { useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Menu,
  Plus,
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  addDays,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useNotification } from "@/hooks/useNotification"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { type CalendarEvent } from "../types"
import { CalendarSidebar } from "./calender-sidebar"

interface CalendarMainProps {
  events?: CalendarEvent[]
  eventDates?: Array<{ date: Date; count: number }>
  onDeleteEvent?: (eventId: number) => void
  currentUserEmail?: string
}

function getEventStartDate(event: CalendarEvent) {
  const eventStart = new Date(event.date)
  const timeMatch = String(event.time || "").trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
  if (timeMatch) {
    let hours = Number(timeMatch[1]) % 12
    if (timeMatch[3].toUpperCase() === "PM") hours += 12
    if (timeMatch[3].toUpperCase() === "AM" && Number(timeMatch[1]) === 12) hours = 0
    eventStart.setHours(hours, Number(timeMatch[2]), 0, 0)
  }
  return eventStart
}

function getEventReminderKey(event: CalendarEvent) {
  return `${event.title}|${event.date instanceof Date ? event.date.toISOString() : String(event.date)}|${event.time}`
}

// Maps a Tailwind color class (or raw hex) → a CSS-friendly value for inline styles
const EVENT_COLORS: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-emerald-500": "#10b981",
  "bg-green-500": "#22c55e",
  "bg-pink-500": "#ec4899",
  "bg-orange-500": "#f97316",
  "bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7",
  "bg-red-500": "#ef4444",
  "bg-red-600": "#dc2626",
  "bg-yellow-500": "#eab308",
  "bg-cyan-500": "#06b6d4",
}

function resolveColor(colorClass: string) {
  return EVENT_COLORS[colorClass] || colorClass
}

export function CalendarMain({ events, eventDates = [], onDeleteEvent, currentUserEmail }: CalendarMainProps) {
  const notify = useNotification()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)
  const [eventsData, setEventsData] = useState<CalendarEvent[]>([])
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [attendeesText, setAttendeesText] = useState("")
  const [assignedEmails, setAssignedEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")

  useEffect(() => {
    if (!editEvent) {
      setAttendeesText("")
      setAssignedEmails([])
      setEmailInput("")
      return
    }
    setAttendeesText(editEvent.attendees?.join(", ") || "")
    setAssignedEmails(editEvent.assignedToEmails || [])
  }, [editEvent])

  const formatDateInput = (date: Date | string) => {
    const parsedDate = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return ""
    return format(parsedDate, "yyyy-MM-dd")
  }

  const parseEventDate = (value: any) => {
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parseCommaSeparated = (value: string) =>
    value.split(",").map(item => item.trim().toLowerCase()).filter(Boolean)

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const addAssignedEmail = (value: string) => {
    const email = value.trim().replace(/,+$/, "")
    if (!email || !isValidEmail(email)) return
    const normalized = email.toLowerCase()
    const updated = Array.from(new Set([...assignedEmails, normalized]))
    setAssignedEmails(updated)
    setEditEvent(prev => prev ? { ...prev, assignedToEmails: updated } : prev)
    setEmailInput("")
  }

  const commitEmailInput = () => { if (emailInput) addAssignedEmail(emailInput) }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events")
        const data = await res.json()
        const eventArray = Array.isArray(data) ? data : data.events || data.data || []
        setEventsData(
          eventArray
            .map((e: any) => ({
              ...e,
              id: e._id ?? e.id,
              date: parseEventDate(e.date),
              attendees: Array.isArray(e.attendees) ? e.attendees : [],
              assignedToEmails: Array.isArray(e.assignedToEmails) ? e.assignedToEmails : [],
            }))
            .filter((event: any) => event.date !== null)
        )
      } catch (err) {
        console.error("Fetch error:", err)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = eventsData.filter(event => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      String(event.title || "").toLowerCase().includes(query) ||
      String(event.location || "").toLowerCase().includes(query) ||
      String(event.description || "").toLowerCase().includes(query) ||
      (Array.isArray(event.attendees) &&
        event.attendees.some(a => String(a || "").toLowerCase().includes(query)))
    )
  })

  useEffect(() => {
    if (!currentUserEmail || filteredEvents.length === 0 || typeof window === "undefined") return
    const storageKey = `schedule-reminders:${currentUserEmail.toLowerCase()}`
    const readKeys = () => {
      try { return new Set<string>(JSON.parse(window.localStorage.getItem(storageKey) || "[]")) }
      catch { return new Set<string>() }
    }
    const writeKeys = (keys: Set<string>) =>
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(keys)))
    const check = () => {
      const now = new Date()
      const keys = readKeys()
      let changed = false
      filteredEvents.forEach(event => {
        const diff = Math.floor((getEventStartDate(event).getTime() - now.getTime()) / 60000)
        const key = getEventReminderKey(event)
        if (diff >= 0 && diff <= 10 && !keys.has(key)) {
          notify.warning("Event starting soon", `${event.title} starts in ${diff} minute${diff === 1 ? "" : "s"}.`, false)
          keys.add(key)
          changed = true
        }
      })
      if (changed) writeKeys(keys)
    }
    check()
    const id = window.setInterval(check, 60000)
    return () => window.clearInterval(id)
  }, [currentUserEmail, filteredEvents, notify])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (date: Date) => filteredEvents.filter(e => isSameDay(e.date, date))
  const getWeekDays = () => {
    const ws = startOfWeek(selectedDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  }
  const getDayEvents = () => filteredEvents.filter(e => isSameDay(e.date, selectedDate))
  const getUpcomingEvents = () =>
    filteredEvents.filter(e => e.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime())

  const navigateMonth = (dir: "prev" | "next") =>
    setCurrentDate(dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())
  const handleEventClick = (event: CalendarEvent) => { setSelectedEvent(event); setShowEventDialog(true) }
  const handleDateSelect = (date: Date) => setSelectedDate(date)

  // ─── Views ─────────────────────────────────────────────────────────────────

  const renderMonthView = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return (
      <div className="flex-1 overflow-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/50">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 border-r border-border/40 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isSelected = isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateSelect(day)}
                className={cn(
                  "group relative min-h-[110px] cursor-pointer border-r border-b border-border/40 p-2 transition-colors last:border-r-0",
                  isCurrentMonth ? "bg-background hover:bg-muted/30" : "bg-muted/10 text-muted-foreground",
                  isDayToday && "bg-blue-50/50 dark:bg-blue-950/20",
                  isSelected && !isDayToday && "bg-muted/40"
                )}
              >
                {/* Day number */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isDayToday && "bg-primary text-primary-foreground text-xs font-bold",
                      isSelected && !isDayToday && "bg-muted font-semibold",
                      !isCurrentMonth && "text-muted-foreground/40"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>
                  )}
                </div>

                {/* Event pills */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <button
                      key={event.id ?? `${day.toISOString()}-${idx}`}
                      onClick={e => { e.stopPropagation(); handleEventClick(event) }}
                      className="flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-xs font-medium text-white transition-opacity hover:opacity-85"
                      style={{ backgroundColor: resolveColor(event.color) }}
                    >
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
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays()
    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b border-border/50">
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                "py-3 text-center border-r border-border/40 last:border-r-0",
                isToday(day) && "bg-blue-50/60 dark:bg-blue-950/20"
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{format(day, "EEE")}</p>
              <p className={cn(
                "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day)
            return (
              <div key={day.toISOString()} className="min-h-[200px] border-r border-b border-border/40 p-2 last:border-r-0">
                <div className="space-y-1">
                  {dayEvents.length === 0
                    ? <p className="text-xs text-muted-foreground/40 text-center pt-4">—</p>
                    : dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="block w-full rounded-md px-2 py-1 text-left text-xs font-medium text-white truncate transition-opacity hover:opacity-85"
                        style={{ backgroundColor: resolveColor(event.color) }}
                      >
                        {event.time} {event.title}
                      </button>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getDayEvents()
    return (
      <div className="flex-1 p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Selected day</p>
          <h3 className="text-xl font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
        </div>
        <div className="space-y-2.5">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-16 text-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/50">No events for this day</p>
            </div>
          ) : (
            dayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="block w-full rounded-xl p-4 text-left text-white transition-all hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: resolveColor(event.color) }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs opacity-80 mt-0.5">{event.time} · {event.duration}</p>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {event.type}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const upcoming = getUpcomingEvents()
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2.5">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-16 text-center">
              <List className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/50">No upcoming events</p>
            </div>
          ) : (
            upcoming.map(event => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="flex w-full items-start gap-4 rounded-xl border border-border/50 bg-background p-4 text-left transition-all hover:border-border hover:shadow-sm"
              >
                <div
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: resolveColor(event.color) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(event.date, "MMM d, yyyy")} · {event.time}
                  </p>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                      <MapPin className="h-3 w-3" />{event.location}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: resolveColor(event.color) }}
                >
                  {event.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    if (viewMode === "week") return renderWeekView()
    if (viewMode === "day") return renderDayView()
    if (viewMode === "list") return renderListView()
    return renderMonthView()
  }

  const viewLabels = { month: "Month", week: "Week", day: "Day", list: "List" }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden h-8 w-8 shrink-0"
            onClick={() => setShowCalendarSheet(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-base font-semibold tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-7 rounded-lg px-3 text-xs"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events…"
              className="h-8 w-52 rounded-lg pl-8 text-sm"
            />
          </div>

          {/* View toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                <Grid3X3 className="h-3.5 w-3.5" />
                {viewLabels[viewMode]}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              {(["month", "week", "day", "list"] as const).map(v => (
                <DropdownMenuItem key={v} onClick={() => setViewMode(v)} className="cursor-pointer">
                  {viewLabels[v]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Calendar Content ── */}
      {renderCurrentView()}

      {/* ── Mobile Sheet ── */}
      <Sheet open={showCalendarSheet} onOpenChange={setShowCalendarSheet}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle>Calendar</SheetTitle>
            <SheetDescription>Browse dates and manage events</SheetDescription>
          </SheetHeader>
          <CalendarSidebar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            events={eventDates}
          />
        </SheetContent>
      </Sheet>

      {/* ── Event Details Dialog ── */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 p-0 shadow-2xl overflow-hidden">
          {/* Color bar */}
          {selectedEvent && (
            <div
              className="h-1 w-full"
              style={{ backgroundColor: resolveColor(selectedEvent.color) }}
            />
          )}
          <div className="px-6 pt-5 pb-2">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedEvent?.title}</DialogTitle>
              <DialogDescription className="sr-only">Event details</DialogDescription>
            </DialogHeader>
          </div>

          {selectedEvent && (
            <div className="space-y-3 px-6 pb-6">
              {/* Date / type row */}
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5">
                <p className="text-sm font-medium">{format(selectedEvent.date, "EEE, MMM d, yyyy")}</p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: resolveColor(selectedEvent.color) }}
                >
                  {selectedEvent.type}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {selectedEvent.time} · {selectedEvent.duration}
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {selectedEvent.location}
                  </div>
                )}
                {selectedEvent.attendees?.length > 0 && (
                  <div className="flex items-start gap-2.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.attendees.map((a, i) => (
                        <Badge key={i} variant="secondary" className="rounded-full text-xs font-normal">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEvent.description && (
                  <p className="text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                )}
              </div>

              {/* Shared with */}
              {(selectedEvent.assignedToEmails?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Shared with</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.assignedToEmails?.map(email => (
                      <Badge key={email} variant="outline" className="rounded-full text-xs">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-sm"
                  onClick={() => { setEditEvent(selectedEvent); setShowEditDialog(true) }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl text-sm"
                  onClick={async () => {
                    if (!selectedEvent?.id) return
                    try {
                      await fetch("/api/events", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selectedEvent.id }),
                      })
                      setEventsData(prev => prev.filter(e => e.id !== selectedEvent.id))
                      setShowEventDialog(false)
                    } catch (err) {
                      console.error("Delete failed:", err)
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription className="sr-only">Edit event details</DialogDescription>
          </DialogHeader>
          {editEvent && (
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Title</label>
                <Input value={editEvent.title} onChange={e => setEditEvent({ ...editEvent, title: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Date</label>
                  <Input type="date" value={formatDateInput(editEvent.date)} onChange={e => setEditEvent({ ...editEvent, date: new Date(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Time</label>
                  <Input value={editEvent.time} onChange={e => setEditEvent({ ...editEvent, time: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Type</label>
                  <select
                    value={editEvent.type}
                    onChange={e => setEditEvent({ ...editEvent, type: e.target.value as CalendarEvent["type"] })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {["meeting", "event", "personal", "task", "reminder"].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Duration</label>
                  <select
                    value={editEvent.duration}
                    onChange={e => setEditEvent({ ...editEvent, duration: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours", "3 hours", "All day"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Location</label>
                <Input value={editEvent.location} onChange={e => setEditEvent({ ...editEvent, location: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Attendees</label>
                <Input
                  value={attendeesText}
                  onChange={e => { setAttendeesText(e.target.value); setEditEvent({ ...editEvent, attendees: parseCommaSeparated(e.target.value) }) }}
                  placeholder="Comma-separated names"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Assigned emails</label>
                <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
                  {assignedEmails.map((email, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {email}
                      <button type="button" onClick={() => {
                        const updated = assignedEmails.filter((_, idx) => idx !== i)
                        setAssignedEmails(updated)
                        setEditEvent(prev => prev ? { ...prev, assignedToEmails: updated } : prev)
                      }} className="ml-0.5 text-muted-foreground hover:text-foreground">×</button>
                    </span>
                  ))}
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onBlur={commitEmailInput}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addAssignedEmail(emailInput) } }}
                    placeholder="Type email and press Enter"
                    className="min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Description</label>
                <Textarea
                  value={editEvent.description || ""}
                  onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                  className="min-h-[100px] resize-none"
                  placeholder="Add notes…"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={async () => {
                    try {
                      const pendingEmail = emailInput.trim()
                      const finalEmails = pendingEmail && isValidEmail(pendingEmail)
                        ? Array.from(new Set([...assignedEmails, pendingEmail.toLowerCase()]))
                        : assignedEmails
                      const payload = { ...editEvent, assignedToEmails: finalEmails }
                      const res = await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                      const data = await res.json()
                      setEventsData(prev => prev.map(e => e.id === editEvent.id ? data.event : e))
                      setShowEditDialog(false)
                      setShowEventDialog(false)
                    } catch (err) { console.error("Update failed:", err) }
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                if (selectedEvent?.id != null && onDeleteEvent) {
                  onDeleteEvent(selectedEvent.id)
                  setShowDeleteDialog(false)
                  setShowEventDialog(false)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}