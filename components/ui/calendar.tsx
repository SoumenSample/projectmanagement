"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type EventDate = Date | { date: Date | string; count?: number; color?: string }

interface CalendarProps {
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  buttonVariant?: string
  locale?: any
  formatters?: any
  components?: any
  eventDates?: EventDate[]
  [key: string]: any
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function resolveEventDate(item: EventDate): Date | null {
  if (item instanceof Date) return item
  const d = item?.date
  if (!d) return null
  return d instanceof Date ? d : new Date(d)
}

// ─── Calendar ────────────────────────────────────────────────────────────────

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  eventDates = [],
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <>
      {/* Embedded styles — scoped to the calendar */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .cal-root {
          font-family: 'DM Sans', sans-serif;
          --cal-accent: 220 90% 56%;
          --cal-accent-fg: 0 0% 100%;
          --cal-muted: 220 14% 96%;
          --cal-muted-fg: 220 10% 46%;
          --cal-border: 220 13% 91%;
          --cal-ring: 220 90% 56%;
          --cal-today-bg: 220 90% 56%;
          --cal-today-ring: 220 90% 70%;
          --cal-event-dot: 350 85% 60%;
        }

        .cal-root .rdp-day_button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          width: 100%;
          aspect-ratio: 1;
          min-width: 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 400;
          color: hsl(220 20% 20%);
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .dark .cal-root .rdp-day_button {
          color: hsl(220 20% 88%);
        }

        .cal-root .rdp-day_button:hover:not(:disabled) {
          background: hsl(var(--cal-accent) / 0.08);
          color: hsl(var(--cal-accent));
          transform: scale(1.06);
          box-shadow: 0 2px 8px hsl(var(--cal-accent) / 0.12);
        }

        .cal-root .rdp-day_button:focus-visible {
          outline: 2px solid hsl(var(--cal-ring) / 0.6);
          outline-offset: 2px;
        }

        /* Today */
        .cal-root .rdp-today .rdp-day_button {
          background: hsl(var(--cal-today-bg));
          color: hsl(0 0% 100%);
          font-weight: 600;
          box-shadow: 0 2px 12px hsl(var(--cal-today-bg) / 0.35);
        }
        .cal-root .rdp-today .rdp-day_button:hover:not(:disabled) {
          background: hsl(var(--cal-today-bg));
          color: hsl(0 0% 100%);
          transform: scale(1.06);
        }

        /* Selected single */
        .cal-root .rdp-selected:not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) .rdp-day_button {
          background: hsl(var(--cal-accent));
          color: hsl(0 0% 100%);
          font-weight: 600;
          box-shadow: 0 4px 16px hsl(var(--cal-accent) / 0.4);
          transform: scale(1.08);
        }

        /* Range */
        .cal-root .rdp-range_start .rdp-day_button,
        .cal-root .rdp-range_end .rdp-day_button {
          background: hsl(var(--cal-accent));
          color: hsl(0 0% 100%);
          font-weight: 600;
          box-shadow: 0 3px 12px hsl(var(--cal-accent) / 0.35);
          border-radius: 10px !important;
        }
        .cal-root .rdp-range_middle {
          background: hsl(var(--cal-accent) / 0.1);
          border-radius: 0;
        }
        .cal-root .rdp-range_middle .rdp-day_button {
          background: transparent;
          color: hsl(var(--cal-accent));
          border-radius: 0;
        }
        .cal-root .rdp-range_middle .rdp-day_button:hover {
          background: hsl(var(--cal-accent) / 0.15);
          transform: none;
        }

        /* Outside days */
        .cal-root .rdp-outside .rdp-day_button {
          color: hsl(var(--cal-muted-fg));
          opacity: 0.45;
        }

        /* Disabled */
        .cal-root .rdp-disabled .rdp-day_button {
          color: hsl(var(--cal-muted-fg));
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Weekday labels */
        .cal-weekday-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--cal-muted-fg));
          text-align: center;
          padding: 6px 0;
          flex: 1;
        }

        /* Nav buttons */
        .cal-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 9px;
          border: 1.5px solid hsl(var(--cal-border));
          background: hsl(0 0% 100%);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s, box-shadow 0.15s;
          color: hsl(220 20% 35%);
        }
        .dark .cal-nav-btn {
          background: hsl(220 20% 14%);
          border-color: hsl(220 15% 22%);
          color: hsl(220 20% 75%);
        }
        .cal-nav-btn:hover {
          border-color: hsl(var(--cal-accent) / 0.5);
          background: hsl(var(--cal-accent) / 0.06);
          color: hsl(var(--cal-accent));
          transform: scale(1.05);
          box-shadow: 0 2px 8px hsl(var(--cal-accent) / 0.12);
        }
        .cal-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Month caption */
        .cal-caption {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: hsl(220 20% 15%);
        }
        .dark .cal-caption {
          color: hsl(220 20% 90%);
        }

        /* Event dot pulse animation */
        @keyframes calDotPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.4); opacity: 0.7; }
        }
        .cal-event-dot {
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(var(--cal-event-dot));
          box-shadow: 0 0 0 2px hsl(var(--cal-event-dot) / 0.2);
          pointer-events: none;
        }
        .cal-event-dot.today-dot {
          background: hsl(0 0% 100%);
          box-shadow: 0 0 0 2px hsl(0 0% 100% / 0.3);
        }
        .cal-event-dot.selected-dot {
          background: hsl(0 0% 100%);
          box-shadow: 0 0 0 2px hsl(0 0% 100% / 0.25);
        }

        /* Dropdown */
        .cal-root .rdp-dropdown_root {
          position: relative;
        }
        .cal-root .rdp-dropdown {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .cal-root .rdp-caption_label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .cal-root .rdp-caption_label:hover {
          background: hsl(var(--cal-accent) / 0.08);
        }
      `}</style>

      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("cal-root", className)}
        captionLayout={captionLayout}
        locale={locale}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString(locale?.code, { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn(
            "w-full max-w-full rounded-2xl border border-[hsl(220_13%_91%)] dark:border-[hsl(220_15%_20%)] bg-white dark:bg-[hsl(220_20%_10%)] p-2 shadow-[0_2px_20px_hsl(220_20%_10%/0.07)] dark:shadow-[0_2px_20px_hsl(0_0%_0%/0.3)]",
            defaultClassNames.root
          ),
          months: cn("relative flex flex-col gap-3 md:flex-row", defaultClassNames.months),
          month: cn("flex w-full flex-col gap-2.5", defaultClassNames.month),
          nav: cn(
            "absolute inset-x-0 top-0 flex w-full items-center justify-between",
            defaultClassNames.nav
          ),
          button_previous: cn("cal-nav-btn", defaultClassNames.button_previous),
          button_next: cn("cal-nav-btn", defaultClassNames.button_next),
          month_caption: cn(
            "flex h-7 w-full items-center justify-center px-8",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "flex h-7 w-full items-center justify-center gap-1",
            defaultClassNames.dropdowns
          ),
          dropdown_root: defaultClassNames.dropdown_root,
          dropdown: defaultClassNames.dropdown,
          caption_label: cn("cal-caption", defaultClassNames.caption_label),
          table: "w-full border-collapse",
          weekdays: cn("flex mb-0.5", defaultClassNames.weekdays),
          weekday: "cal-weekday-label",
          week: cn("flex w-full mt-0.5 gap-0.5", defaultClassNames.week),
          week_number_header: cn("w-9 select-none", defaultClassNames.week_number_header),
          week_number: cn(
            "text-[0.7rem] font-mono text-[hsl(220_10%_60%)] select-none flex items-center justify-center",
            defaultClassNames.week_number
          ),
          day: cn(
            "group/day relative flex flex-1 items-stretch p-0.25",
            defaultClassNames.day
          ),
          range_start: cn("rdp-range_start", defaultClassNames.range_start),
          range_middle: cn("rdp-range_middle", defaultClassNames.range_middle),
          range_end: cn("rdp-range_end", defaultClassNames.range_end),
          today: cn("rdp-today", defaultClassNames.today),
          outside: cn("rdp-outside", defaultClassNames.outside),
          disabled: cn("rdp-disabled", defaultClassNames.disabled),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className: cls, rootRef, ...p }) => (
            <div data-slot="calendar" ref={rootRef} className={cn(cls)} {...p} />
          ),
          Chevron: ({ className: cls, orientation, ...p }) => {
            if (orientation === "left")
              return <ChevronLeftIcon className={cn("size-3.5", cls)} {...p} />
            if (orientation === "right")
              return <ChevronRightIcon className={cn("size-3.5", cls)} {...p} />
            return <ChevronDownIcon className={cn("size-3.5", cls)} {...p} />
          },
          DayButton: (p) => (
            <CalendarDayButton locale={locale} eventDates={eventDates} {...p} />
          ),
          WeekNumber: ({ children, ...p }) => (
            <td {...p}>
              <div className="flex size-9 items-center justify-center">{children}</div>
            </td>
          ),
          ...components,
        }}
        {...props}
      />
    </>
  )
}

// ─── DayButton ───────────────────────────────────────────────────────────────

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  eventDates = [],
  ...props
}: any) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // Find matching event (support plain Date and { date, count, color })
  const matchedEvent = React.useMemo(() => {
    if (!eventDates?.length) return null
    const dayDate: Date = day.date
    for (const item of eventDates) {
      const d = resolveEventDate(item)
      if (d && isSameDay(d, dayDate)) return item
    }
    return null
  }, [day.date, eventDates])

  const hasEvent = matchedEvent !== null

  // Determine dot color — custom, or fallback to CSS var
  const dotColor =
    hasEvent && !(matchedEvent instanceof Date) && (matchedEvent as any)?.color
      ? (matchedEvent as any).color
      : undefined

  // Determine dot style class
  const isSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle
  const isRangeEdge = modifiers.range_start || modifiers.range_end
  const isToday = modifiers.today
  const shouldInvertDot = isSelected || isRangeEdge || isToday

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      disabled={modifiers.disabled}
      className={cn("rdp-day_button", className)}
      {...props}
    >
      {/* Date number */}
      <span className="relative z-10">{day.date.getDate()}</span>

      {/* Event dot */}
      {hasEvent && (
        <span
          aria-hidden="true"
          className={cn(
            "cal-event-dot",
            shouldInvertDot ? "today-dot" : ""
          )}
          style={dotColor && !shouldInvertDot ? { background: dotColor } : undefined}
        />
      )}
    </button>
  )
}

export { Calendar, CalendarDayButton }