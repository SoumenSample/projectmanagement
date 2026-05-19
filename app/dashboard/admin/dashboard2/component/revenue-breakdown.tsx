"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ClientSourceBreakdown = {
  key: string
  label: string
  amount: number
  count: number
  fill: string
  share: number
}

const palette = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#22c55e"]

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatSourceLabel(source: string) {
  const normalized = source.trim().replace(/[-_]+/g, " ")
  if (!normalized) return "Unknown"

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function normalizeSourceKey(source: string) {
  const normalized = source.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return normalized || "unknown"
}

function parseBudget(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== "string") {
    return 0
  }

  const cleaned = value.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildChartConfig(data: ClientSourceBreakdown[]): ChartConfig {
  return data.reduce<ChartConfig>(
    (config, item) => {
      config[item.key] = {
        label: item.label,
        color: item.fill,
      }
      return config
    },
    {
      revenue: {
        label: "Revenue",
      },
    }
  )
}

export function RevenueBreakdown() {
  const id = "revenue-breakdown"
  const [sourceRows, setSourceRows] = React.useState<ClientSourceBreakdown[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [activeSource, setActiveSource] = React.useState("")

  React.useEffect(() => {
    let isMounted = true

    async function fetchClientRevenue() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/clients", { cache: "no-store" })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to load client revenue")
        }

        const grouped = new Map<string, { label: string; amount: number; count: number }>()

        for (const client of data.clients || []) {
          const sourceName = String(client.source || "unknown").trim() || "unknown"
          const key = normalizeSourceKey(sourceName)
          const label = formatSourceLabel(sourceName)
          const amount = parseBudget(client.finalBudget)

          const current = grouped.get(key)
          if (current) {
            current.amount += amount
            current.count += 1
          } else {
            grouped.set(key, { label, amount, count: 1 })
          }
        }

        const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.amount, 0)
        const nextRows = Array.from(grouped.entries())
          .map(([key, item], index) => ({
            key,
            label: item.label,
            amount: item.amount,
            count: item.count,
            fill: palette[index % palette.length],
            share: total > 0 ? (item.amount / total) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount)

        if (!isMounted) return

        setSourceRows(nextRows)
        setActiveSource((current) => current || nextRows[0]?.key || "")
      } catch (fetchError: any) {
        if (!isMounted) return
        setError(fetchError?.message || "Failed to load client revenue")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchClientRevenue()

    return () => {
      isMounted = false
    }
  }, [])

  const chartConfig = React.useMemo(() => buildChartConfig(sourceRows), [sourceRows])

  const activeIndex = React.useMemo(() => {
    const index = sourceRows.findIndex((item) => item.key === activeSource)
    return index === -1 ? 0 : index
  }, [activeSource, sourceRows])

  const totalRevenue = React.useMemo(
    () => sourceRows.reduce((sum, item) => sum + item.amount, 0),
    [sourceRows]
  )

  return (
    <Card data-chart={id} className="flex flex-col cursor-pointer">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
        <div>
          <CardTitle className="">Revenue Breakdown</CardTitle>
          <CardDescription className="">Total client budget by source</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={activeSource} onValueChange={setActiveSource}>
            <SelectTrigger
              className="rounded-lg cursor-pointer"
              style={{ width: 175 }}
              aria-label="Select a category"
            >
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-lg">
              {sourceRows.map((item) => (
                <SelectItem
                  key={item.key}
                  value={item.key}
                  className="rounded-md [&_span]:flex cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-3 w-3 shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        {loading ? (
          <div className="flex w-full items-center justify-center text-muted-foreground" style={{ minHeight: 300 }}>
            Loading client revenue...
          </div>
        ) : error ? (
          <div className="flex w-full items-center justify-center text-sm text-red-400" style={{ minHeight: 300 }}>
            {error}
          </div>
        ) : sourceRows.length === 0 ? (
          <div className="flex w-full items-center justify-center text-muted-foreground" style={{ minHeight: 300 }}>
            No client revenue sources found yet.
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex justify-center">
              <ChartContainer
                id={id}
                config={chartConfig}
                className="mx-auto aspect-square w-full"
                style={{ maxWidth: 300 }}
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={sourceRows}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={60}
                    strokeWidth={5}
                    activeShape={({
                      outerRadius = 0,
                      ...props
                    }: PieSectorDataItem) => (
                      <g>
                        <Sector {...props} outerRadius={outerRadius + 10} />
                        <Sector
                          {...props}
                          outerRadius={outerRadius + 25}
                          innerRadius={outerRadius + 12}
                        />
                      </g>
                    )}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                ₹{formatMoney(sourceRows[activeIndex]?.amount || 0)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                {sourceRows[activeIndex]?.label || "Revenue"}
                              </tspan>
                            </text>
                          )
                        }

                        return null
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              {sourceRows.map((item, index) => {
                const isActive = index === activeIndex

                return (
                  <div
                    key={item.key}
                    className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveSource(item.key)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{formatMoney(item.amount)}</div>
                      <div className="text-sm text-muted-foreground">{item.share.toFixed(0)}% of total</div>
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 text-sm text-muted-foreground">
                Total revenue across all sources: ₹{formatMoney(totalRevenue)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}