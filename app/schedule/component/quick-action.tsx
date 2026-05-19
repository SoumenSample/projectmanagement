"use client"

import { Clock, Users, Plus, Settings, Download, Share, Bell, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface QuickActionsProps {
  onNewEvent?: () => void
  onNewMeeting?: () => void
  onNewReminder?: () => void
  onSettings?: () => void
}

const quickStats = [
  { label: "Today", value: "3", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { label: "This week", value: "12", color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { label: "Pending", value: "2", color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/40" },
]

const upcomingItems = [
  { title: "Team Standup", time: "9:00 AM", location: "Conference Room A", color: "#3b82f6" },
  { title: "Design Review", time: "2:00 PM", location: "Virtual", color: "#8b5cf6" },
]

export function QuickActions({ onNewEvent, onNewMeeting, onNewReminder, onSettings }: QuickActionsProps) {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div>
        <p className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Overview
        </p>
        <div className="grid grid-cols-3 gap-2">
          {quickStats.map(stat => (
            <div
              key={stat.label}
              className={cn("flex flex-col items-center gap-0.5 rounded-xl py-3 text-center", stat.bg)}
            >
              <span className="text-xl font-bold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Actions */}
      <div>
        <p className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Quick Actions
        </p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-normal hover:bg-muted/70"
            onClick={onNewEvent}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950">
              <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            New Event
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-normal hover:bg-muted/70"
            onClick={onNewMeeting}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950">
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            Schedule Meeting
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-normal hover:bg-muted/70"
            onClick={onNewReminder}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950">
              <Bell className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            Set Reminder
          </Button>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Utility */}
      <div className="space-y-0.5">
        {[
          { icon: Share, label: "Share Calendar" },
          { icon: Download, label: "Export" },
          { icon: Settings, label: "Settings", action: onSettings },
        ].map(({ icon: Icon, label, action }) => (
          <Button
            key={label}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl px-3 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            onClick={action}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>

      <Separator className="opacity-50" />

      {/* Upcoming */}
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          Next Up
        </p>
        <div className="space-y-2">
          {upcomingItems.map(item => (
            <div
              key={item.title}
              className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 transition-colors hover:border-border/60 hover:bg-muted/40"
            >
              <div
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.time} · {item.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}