"use client"

import { useState, useCallback } from "react"
import { type CalendarEvent } from "./types"
import { useNotification } from "@/hooks/useNotification"

export interface UseCalendarState {
  selectedDate: Date
  showEventForm: boolean
  editingEvent: CalendarEvent | null
  showCalendarSheet: boolean
  events: CalendarEvent[]
}

export interface UseCalendarActions {
  setSelectedDate: (date: Date) => void
  setShowEventForm: (show: boolean) => void
  setEditingEvent: (event: CalendarEvent | null) => void
  setShowCalendarSheet: (show: boolean) => void
  handleDateSelect: (date: Date) => void
  handleNewEvent: () => void
  handleNewCalendar: () => void
  handleSaveEvent: (eventData: Partial<CalendarEvent>) => void
  handleDeleteEvent: (eventId: number) => void
  handleEditEvent: (event: CalendarEvent) => void
}

export interface UseCalendarReturn extends UseCalendarState, UseCalendarActions {}

export function useCalendar(initialEvents: CalendarEvent[] = [], currentUserEmail?: string, currentUserId?: string): UseCalendarReturn {
  const notify = useNotification()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)
  const [events] = useState<CalendarEvent[]>(initialEvents)

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    // Auto-close mobile sheet when date is selected
    setShowCalendarSheet(false)
  }, [])

  const handleNewEvent = useCallback(() => {
    setEditingEvent(null)
    setShowEventForm(true)
  }, [])

  const handleNewCalendar = useCallback(() => {
    // In a real app, this would open a new calendar form
  }, [])

  const handleSaveEvent = useCallback((eventData: Partial<CalendarEvent>) => {
    setShowEventForm(false)
    setEditingEvent(null)
    // Trigger page refresh to fetch updated events from server
    window.location.reload()
  }, [])

  const handleDeleteEvent = useCallback((eventId: number) => {
    fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eventId, actorUserId: currentUserId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || "Failed to delete event")
        }
        notify.success("Event deleted", "The event was removed from the calendar.")
        window.location.reload()
      })
      .catch((error) => {
        console.error("Delete failed:", error)
        notify.error("Delete failed", error.message || "Failed to delete event")
      })
    setShowEventForm(false)
    setEditingEvent(null)
  }, [notify, currentUserId])

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }, [])

  return {
    // State
    selectedDate,
    showEventForm,
    editingEvent,
    showCalendarSheet,
    events,
    // Actions
    setSelectedDate,
    setShowEventForm,
    setEditingEvent,
    setShowCalendarSheet,
    handleDateSelect,
    handleNewEvent,
    handleNewCalendar,
    handleSaveEvent,
    handleDeleteEvent,
    handleEditEvent,
  }
}