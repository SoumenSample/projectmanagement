"use client"

import { CalendarSidebar } from "./calender-sidebar"
import { CalendarMain } from "./calender-unified"
import { EventForm } from "./vent-form"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { type CalendarEvent } from "../types"
import { useCalendar } from "../use-calendar"

interface CalendarProps {
  events: CalendarEvent[]
  eventDates: Array<{ date: Date; count: number }>
  currentUserEmail?: string
  currentUserId?: string
}

export function Calendar({ events, eventDates, currentUserEmail, currentUserId }: CalendarProps) {
  const calendar = useCalendar(events, currentUserEmail, currentUserId)

  return (
    <>
      <div className="relative bg-background" >
        <div className="flex gap-4" style={{ minHeight: "820px" }}>

          {/* Desktop Sidebar */}
          <div
            className="hidden xl:flex xl:flex-col w-72 shrink-0 rounded-2xl rounded-tl-none border border-border/60 dark:border-white/10 bg-background shadow-sm overflow-hidden"
          >
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewCalendar={calendar.handleNewCalendar}
              onNewEvent={calendar.handleNewEvent}
              events={eventDates}
              className="h-full"
            />
          </div>

          {/* Main panel */}
          <div className="flex-1 min-w-0 rounded-2xl rounded-tr-none border border-border/60 dark:border-white/10 bg-background shadow-sm overflow-hidden">
            <CalendarMain
              events={events}
              eventDates={eventDates}
              onDeleteEvent={calendar.handleDeleteEvent}
              currentUserEmail={currentUserEmail}
            />
          </div>
        </div>

        {/* Mobile sidebar sheet */}
        <Sheet open={calendar.showCalendarSheet} onOpenChange={calendar.setShowCalendarSheet}>
          <SheetContent side="left" className="w-72 p-0" style={{ position: "absolute" }}>
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-base">Calendar</SheetTitle>
              <SheetDescription className="text-sm">Browse dates and manage events</SheetDescription>
            </SheetHeader>
            <CalendarSidebar
              selectedDate={calendar.selectedDate}
              onDateSelect={calendar.handleDateSelect}
              onNewCalendar={calendar.handleNewCalendar}
              onNewEvent={calendar.handleNewEvent}
              events={eventDates}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Event form */}
      <EventForm
        event={calendar.editingEvent}
        open={calendar.showEventForm}
        onOpenChange={calendar.setShowEventForm}
        onSave={calendar.handleSaveEvent}
        onDelete={calendar.handleDeleteEvent}
        currentUserEmail={currentUserEmail}
        currentUserId={currentUserId}
      />
    </>
  )
}