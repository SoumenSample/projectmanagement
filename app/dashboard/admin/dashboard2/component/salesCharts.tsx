"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

interface Lead {
  createdAt: string
  convertedToClient?: boolean
  convertedToClientDate?: string
}

interface ChartDataPoint {
  date: string
  leads: number
  conversions: number
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const date = new Date(label)
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-xl p-3 min-w-[160px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-2 tracking-wide uppercase">
        {formattedDate}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[12px] text-muted-foreground capitalize">{entry.dataKey}</span>
          </div>
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Stat card sub-component
const StatBadge = ({
  label,
  value,
  color,
  icon: Icon,
  trend,
}: {
  label: string
  value: number
  color: string
  icon: React.ElementType
  trend?: "up" | "down" | null
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-sm">
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}18` }}
    >
      <Icon size={16} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-tight" style={{ color }}>
        {value}
        {trend && (
          <span className="ml-1 inline-block">
            {trend === "up" ? (
              <ArrowUpRight size={14} className="inline text-emerald-500" />
            ) : (
              <ArrowDownRight size={14} className="inline text-rose-500" />
            )}
          </span>
        )}
      </p>
    </div>
  </div>
)

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [leadsData, setLeadsData] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/leads")
        const data = await res.json()
        if (res.ok && data.leads) {
          setLeadsData(data.leads)
        } else {
          setError(data.error || "Failed to fetch leads")
        }
      } catch {
        setError("Failed to fetch leads")
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [])

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  // Build chart data
  const today = new Date()
  const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - daysToSubtract + 1)

  const dateMap: Record<string, ChartDataPoint> = {}
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const key = formatDate(new Date(d))
    dateMap[key] = { date: key, leads: 0, conversions: 0 }
  }

  leadsData.forEach((lead) => {
    const created = formatDate(new Date(lead.createdAt))
    if (dateMap[created]) dateMap[created].leads += 1
    if (lead.convertedToClient && lead.convertedToClientDate) {
      const converted = formatDate(new Date(lead.convertedToClientDate))
      if (dateMap[converted]) dateMap[converted].conversions += 1
    }
  })

  const chartData: ChartDataPoint[] = Object.values(dateMap)

  const totalLeads = chartData.reduce((s, d) => s + d.leads, 0)
  const totalConversions = chartData.reduce((s, d) => s + d.conversions, 0)
  const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : "0.0"

  const rangeLabel =
    timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Last 3 months"

  return (
    <Card className="@container/card overflow-hidden border-border/60 shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-col gap-4 border-b border-border/40 bg-muted/20 px-6 py-5">
        <div className="flex flex-col gap-1 @[540px]/card:flex-row @[540px]/card:items-start @[540px]/card:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <TrendingUp size={16} className="text-primary" />
              Leads & Conversions
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-muted-foreground">
              {rangeLabel} · {totalLeads} leads · {conversionRate}% conversion rate
            </CardDescription>
          </div>

          <CardAction className="self-start">
            {/* Toggle for wider cards */}
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(v) => v && setTimeRange(v)}
              variant="outline"
              className="hidden h-8 gap-0 rounded-lg border border-border/60 bg-muted/30 p-0.5 *:data-[slot=toggle-group-item]:h-7 *:data-[slot=toggle-group-item]:rounded-md *:data-[slot=toggle-group-item]:px-3 *:data-[slot=toggle-group-item]:text-xs @[540px]/card:flex"
            >
              <ToggleGroupItem value="90d">3M</ToggleGroupItem>
              <ToggleGroupItem value="30d">30D</ToggleGroupItem>
              <ToggleGroupItem value="7d">7D</ToggleGroupItem>
            </ToggleGroup>

            {/* Select for narrow cards */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="h-8 w-36 text-xs @[540px]/card:hidden"
                size="sm"
                aria-label="Select time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg text-xs">Last 3 months</SelectItem>
                <SelectItem value="30d" className="rounded-lg text-xs">Last 30 days</SelectItem>
                <SelectItem value="7d" className="rounded-lg text-xs">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-2 gap-3 @[540px]/card:grid-cols-3">
          <StatBadge
            label="Total Leads"
            value={totalLeads}
            color="#0ebac7"
            icon={Users}
            trend={totalLeads > 0 ? "up" : null}
          />
          <StatBadge
            label="Conversions"
            value={totalConversions}
            color="#22c55e"
            icon={TrendingUp}
            trend={totalConversions > 0 ? "up" : null}
          />
          <div className="col-span-2 flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 @[540px]/card:col-span-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <ArrowUpRight size={16} className="text-violet-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Conv. Rate
              </p>
              <p className="text-xl font-bold tabular-nums leading-tight text-violet-500">
                {conversionRate}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-[280px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-xs text-muted-foreground">Loading data…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="px-2 pb-4 pt-6 sm:px-4 sm:pb-6">
            {/* Legend */}
            <div className="mb-4 flex items-center gap-5 px-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0ebac7]" />
                <span className="text-xs text-muted-foreground">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-muted-foreground">Conversions</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ebac7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0ebac7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={timeRange === "7d" ? 20 : timeRange === "30d" ? 40 : 60}
                  tick={{ fontSize: 11, fill: "currentColor", className: "text-muted-foreground" }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "currentColor", className: "text-muted-foreground" }}
                  allowDecimals={false}
                  width={28}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "currentColor", strokeWidth: 1, className: "text-border/60", strokeDasharray: "4 4" }} />

                {/* Leads area */}
                <Area
                  dataKey="leads"
                  type="monotoneX"
                  fill="url(#gradLeads)"
                  stroke="#0ebac7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0ebac7",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />

                {/* Conversions area */}
                <Area
                  dataKey="conversions"
                  type="monotoneX"
                  fill="url(#gradConversions)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#22c55e",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const SalesChart = ChartAreaInteractive