"use client"

import { useEffect, useState } from "react"
import {
  CalendarIcon, Clock, MapPin, Users, Trash2, X, Plus, Bell, AlarmClock, Link2,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useNotification } from "@/hooks/useNotification"
import { type CalendarEvent } from "../types"

interface EventFormProps {
  event?: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: Partial<CalendarEvent>) => void
  onDelete?: (eventId: number) => void
  currentUserEmail?: string
  currentUserId?: string
}

type UserSuggestion = {
  _id: string
  name: string
  email: string
  role?: string
}

const eventTypes = [
  { value: "meeting",  label: "Meeting",  hex: "#3b82f6", bg: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" },
  { value: "event",    label: "Event",    hex: "#10b981", bg: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  { value: "personal", label: "Personal", hex: "#ec4899", bg: "bg-pink-500",    pill: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800" },
  { value: "task",     label: "Task",     hex: "#f97316", bg: "bg-orange-500",  pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800" },
  { value: "reminder", label: "Reminder", hex: "#8b5cf6", bg: "bg-violet-500",  pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800" },
]

const timeSlots = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
]
const durationOptions = ["15 min","30 min","45 min","1 hour","1.5 hours","2 hours","3 hours","All day"]

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700","bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700","bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700","bg-cyan-100 text-cyan-700",
]

function FieldRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-28 shrink-0 items-center gap-2 pt-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase()
}

function splitEmails(value: string) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map(normalizeEmail)
        .filter(Boolean)
    )
  )
}

function mergeEmails(currentValue: string, emailsToAdd: string[]) {
  return Array.from(new Set([...splitEmails(currentValue), ...emailsToAdd.map(normalizeEmail).filter(Boolean)])).join(", ")
}

export function EventForm({ event, open, onOpenChange, onSave, onDelete, currentUserEmail, currentUserId }: EventFormProps) {
  const notify = useNotification()
  const [formData, setFormData] = useState({
    title: event?.title || "",
    date: event?.date || new Date(),
    time: event?.time || "9:00 AM",
    duration: event?.duration || "1 hour",
    type: event?.type || "meeting",
    location: event?.location || "",
    meetingLink: (event as any)?.meetingLink || "",
    description: event?.description || "",
    attendees: event?.attendees || [] as string[],
    assignedEmails: event?.assignedToEmails?.join(", ") || (currentUserEmail ?? ""),
    allDay: false,
    reminder: true,
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [newAttendee, setNewAttendee] = useState("")
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [saveError, setSaveError] = useState("")

  const selectedType = eventTypes.find(t => t.value === formData.type) ?? eventTypes[0]

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadUsers = async () => {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch("/api/users/list")
        const data = await response.json()
        if (!cancelled) setUserSuggestions(Array.isArray(data.users) ? data.users : [])
      } catch {
        if (!cancelled) setUserSuggestions([])
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false)
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [open])

  const attendeeSuggestions = userSuggestions.filter(user => {
    const query = newAttendee.trim().toLowerCase()
    if (!query) return false

    const attendeeNames = formData.attendees.map(name => name.trim().toLowerCase())
    return !attendeeNames.includes(user.name.trim().toLowerCase()) && (
      user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    )
  }).slice(0, 6)

  const addAttendeeFromUser = (user: UserSuggestion) => {
    setFormData(p => ({
      ...p,
      attendees: Array.from(new Set([...p.attendees, user.name])),
      assignedEmails: mergeEmails(p.assignedEmails, [user.email]),
    }))
    setNewAttendee("")
  }

  const handleSave = async () => {
    if (!formData.title.trim()) { setSaveError("Event title is required"); notify.error("Event not saved", "Title is required"); return }
    setIsSaving(true); setSaveError("")
    try {
      let emails = splitEmails(formData.assignedEmails)
      if (currentUserEmail && !emails.includes(currentUserEmail.toLowerCase()))
        emails = [currentUserEmail.toLowerCase(), ...emails]

      const eventData: any = {
        title: formData.title,
        date: formData.date instanceof Date ? formData.date.toISOString() : new Date(formData.date).toISOString(),
        time: formData.time, duration: formData.duration, type: formData.type,
        location: formData.location, meetingLink: formData.meetingLink, description: formData.description,
        attendees: formData.attendees, allDay: formData.allDay, reminder: formData.reminder,
        color: selectedType.bg, assignedToEmails: emails, actorUserId: currentUserId,
      }
      if (event?.id) eventData.id = event.id

      const response = await fetch("/api/events", {
        method: event ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error || "Failed to save event")
      notify.success(
        event ? "Event updated" : "Event created",
        `${formData.title} was saved.`,
        { sourceTab: "schedule", route: "/schedule", autoClose: false }
      )
      setShowSuccessModal(true)
    } catch (err: any) {
      setSaveError(err.message || "Failed to save event")
      notify.error("Event not saved", err.message || "Failed to save event")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => { if (event?.id && onDelete) { onDelete(event.id); onOpenChange(false) } }
  const addAttendee = () => {
    const t = newAttendee.trim()
    if (!t) return

    const matchedUser = userSuggestions.find(user => user.name.trim().toLowerCase() === t.toLowerCase())
    if (matchedUser) {
      addAttendeeFromUser(matchedUser)
      return
    }

    if (!formData.attendees.includes(t)) {
      setFormData(p => ({ ...p, attendees: [...p.attendees, t] }))
    }
    setNewAttendee("")
  }
  const removeAttendee = (name: string) => setFormData(p => ({ ...p, attendees: p.attendees.filter(a => a !== name) }))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[min(95vw,760px)] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border-0 bg-background p-0 shadow-2xl"
        >
          {/* Accent bar */}
          <div className="h-1 w-full shrink-0 rounded-t-2xl transition-colors duration-300" style={{ backgroundColor: selectedType.hex }} />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/50 px-6 py-5 shrink-0">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: selectedType.hex }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Calendar</span>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {event ? "Edit Event" : "New Event"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-muted-foreground/60">
                {event ? "Update details and notify attendees." : "Add this event to your calendar."}
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">

              {/* Title */}
              <Input
                placeholder="Event title…"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="h-11 rounded-none border-0 border-b border-border/40 bg-transparent px-0 text-lg font-medium shadow-none placeholder:text-muted-foreground/30 focus-visible:border-b-foreground/40 focus-visible:ring-0"
              />

              {/* Type pills */}
              {/* <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Type</p>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, type: type.value as CalendarEvent["type"] }))}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        formData.type === type.value
                          ? cn(type.pill, "shadow-sm")
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: type.hex }} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* Schedule */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Schedule</p>
                <div className="space-y-3">
                  <FieldRow icon={CalendarIcon} label="Date">
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 w-full justify-start rounded-lg text-left text-sm font-normal">
                          {format(formData.date, "EEE, MMM d, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={date => { if (date) { setFormData(p => ({ ...p, date })); setShowCalendar(false) } }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FieldRow>

                  <FieldRow icon={Clock} label="Time">
                    <div className="flex gap-2">
                      <Select value={formData.time} onValueChange={v => setFormData(p => ({ ...p, time: v }))}>
                        <SelectTrigger className="h-9 flex-1 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={formData.duration} onValueChange={v => setFormData(p => ({ ...p, duration: v }))}>
                        <SelectTrigger className="h-9 flex-1 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{durationOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </FieldRow>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-5 rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <Switch checked={formData.allDay} onCheckedChange={c => setFormData(p => ({ ...p, allDay: c }))} />
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <AlarmClock className="h-3.5 w-3.5" /> All day
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <Switch checked={formData.reminder} onCheckedChange={c => setFormData(p => ({ ...p, reminder: c }))} />
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Bell className="h-3.5 w-3.5" /> Reminder
                  </span>
                </label>
              </div>

              {/* Location */}
              <FieldRow icon={MapPin} label="Location">
                <Input
                  placeholder="Add location…"
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  className="h-9 rounded-lg text-sm"
                />
              </FieldRow>

              <FieldRow icon={Link2} label="Meeting link">
                <Input
                  placeholder="Paste meeting URL…"
                  value={formData.meetingLink}
                  onChange={e => setFormData(p => ({ ...p, meetingLink: e.target.value }))}
                  className="h-9 rounded-lg text-sm"
                />
              </FieldRow>

              {/* Attendees */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Attendees</p>
                <p className="mb-2.5 text-xs text-muted-foreground/60">Search a name to add the attendee and its email to Share with.</p>

                {formData.attendees.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {formData.attendees.map((name, i) => (
                      <span key={`${name}-${i}`} className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-2 py-0.5 text-xs shadow-sm">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className={cn("text-[9px] font-bold", AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                            {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {name}
                        <button type="button" onClick={() => removeAttendee(name)} className="text-muted-foreground/40 hover:text-foreground">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Attendee name…"
                      value={newAttendee}
                      onChange={e => setNewAttendee(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addAttendee()}
                      className="h-9 rounded-lg text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addAttendee} className="h-9 gap-1 rounded-lg px-3 text-xs">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>

                  {newAttendee.trim() && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-xl">
                      {isLoadingSuggestions ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground/60">Loading people…</div>
                      ) : attendeeSuggestions.length > 0 ? (
                        attendeeSuggestions.map(user => (
                          <button
                            key={user._id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => addAttendeeFromUser(user)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                          >
                            <span className="min-w-0 truncate font-medium">{user.name}</span>
                            <span className="min-w-0 truncate text-xs text-muted-foreground/60">{user.email}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground/60">No matching people found.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Share with */}
              <FieldRow icon={Users} label="Share with">
                <div>
                  <Input
                    placeholder="email@example.com, another@email.com…"
                    value={formData.assignedEmails}
                    onChange={e => setFormData(p => ({ ...p, assignedEmails: e.target.value }))}
                    className="h-9 rounded-lg text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground/50">Comma-separated emails. You are auto-included.</p>
                </div>
              </FieldRow>

              {/* Description */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Notes</p>
                <Textarea
                  placeholder="Add agenda or notes…"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="resize-none rounded-xl text-sm"
                />
              </div>

              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-6 py-4 shrink-0">
            <div>
              {event && onDelete && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 rounded-lg px-4 text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                size="sm"
                disabled={isSaving || !formData.title.trim()}
                className="h-8 min-w-[110px] rounded-lg px-4 text-xs font-semibold"
                style={{ backgroundColor: selectedType.hex, color: "#fff" }}
              >
                {isSaving ? "Saving…" : event ? "Save changes" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success modal */}
      <Dialog open={showSuccessModal} onOpenChange={o => { setShowSuccessModal(o); if (!o) window.location.reload() }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Event {event ? "updated" : "created"}</DialogTitle>
            <DialogDescription>Your event has been saved successfully.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-3">
            <Button onClick={() => { setShowSuccessModal(false); window.location.reload() }} className="rounded-xl">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}