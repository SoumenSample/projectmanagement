"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  events?: Array<{ date: Date; count: number }>
}

export function DatePicker({ selectedDate, onDateSelect, events = [] }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date())

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      setDate(selected)
      onDateSelect?.(selected)
    }
  }

  return (
    <div className="overflow-hidden px-2 py-1">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        eventDates={events}
        className="w-full max-w-full [&_button]:cursor-pointer"
      />
    </div>
  )
}