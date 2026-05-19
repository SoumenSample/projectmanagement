"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  CreditCard,
  UserCheck,
  Clock5,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

export function StatCards() {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [stats, setStats] = useState({
    totalClients: 0,
    convertedFromLeads: 0,
    activeClients: 0,
  })
  const [serviceData, setServiceData] = useState([])

  const [sourceData, setSourceData] = useState([])

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true)

        const response = await fetch("/api/clients", {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to load clients")
        }

        const clientsData = Array.isArray(data.clients)
          ? data.clients
          : []

        setClients(clientsData)

        // ✅ STATS
        const total = clientsData.length
        const converted = clientsData.filter(
          (c) =>
            String(c.source || "").toLowerCase() === "lead-conversion"
        ).length
        const active = clientsData.filter(
          (c) => c.status === "active"
        ).length

        setStats({
          totalClients: total,
          convertedFromLeads: converted,
          activeClients: active,
        })

        // ✅ PIE CHART DATA
        const sourceMap = {}

        clientsData.forEach((c) => {
          const source = c.source || "unknown"
          sourceMap[source] = (sourceMap[source] || 0) + 1
        })

        const chartData = Object.keys(sourceMap).map((key) => ({
          name: key,
          value: sourceMap[key],
        }))

        setSourceData(chartData)
        const serviceMap = {}

clientsData.forEach((c) => {
  const services = c.services || []

  // handle both array & string
  if (Array.isArray(services)) {
    services.forEach((s) => {
      const key = s || "unknown"
      serviceMap[key] = (serviceMap[key] || 0) + 1
    })
  } else {
    const key = services || "unknown"
    serviceMap[key] = (serviceMap[key] || 0) + 1
  }
})

const serviceChart = Object.keys(serviceMap).map((key) => ({
  name: key,
  value: serviceMap[key],
}))

setServiceData(serviceChart)

      } catch (err) {
        toast.error(err.message || "Failed to load clients")
      } finally {
        setLoadingClients(false)
      }
    }

    loadClients()
  }, [])
  // ✅ SERVICE PIE CHART DATA


  if (loadingClients) {
    return <div className="p-4">Loading dashboard...</div>
  }

  const performanceMetrics = [
    {
      title: "Total Users",
      current: stats.totalClients,
      previous: "-",
      growth: 0,
      icon: Users,
    },
    {
      title: "Converted Users",
      current: stats.convertedFromLeads,
      previous: "-",
      growth: 0,
      icon: CreditCard,
    },
    // {
    //   title: "Active Users",
    //   current: stats.activeClients,
    //   previous: "-",
    //   growth: 0,
    //   icon: UserCheck,
    // },
    // {
    //   title: "Pending Users",
    //   current: clients.filter((c) => c.status !== "active").length,
    //   previous: "-",
    //   growth: 0,
    //   icon: Clock5,
    // },
  ]

  return (
    <div className="space-y-6">

      {/* ✅ STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-10">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <metric.icon className="text-muted-foreground size-6" />

                <Badge
                  variant="outline"
                  className={cn(
                    metric.growth >= 0
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  {metric.growth >= 0 ? (
                    <>
                      <TrendingUp className="me-1 size-3" />+
                      {metric.growth}%
                    </>
                  ) : (
                    <>
                      <TrendingDown className="me-1 size-3" />
                      {metric.growth}%
                    </>
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  {metric.title}
                </p>
                <div className="text-2xl font-bold">
                  {metric.current}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>from {metric.previous}</span>
                  <ArrowUpRight className="size-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          
        ))}
        </div>
        <Card className="">
        <CardContent className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">
            Clients by Source
          </h3>

          {sourceData.length > 0 ? (
            <PieChart width={350} height={300}>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label
              >
                {sourceData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <p className="text-muted-foreground">
              No data available
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="">
  <CardContent className="flex flex-col items-center">
    <h3 className="text-lg font-semibold mb-4">
      Clients by Services
    </h3>

    {serviceData.length > 0 ? (
      <PieChart width={350} height={300}>
        <Pie
          data={serviceData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label
        >
          {serviceData.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    ) : (
      <p className="text-muted-foreground">
        No service data available
      </p>
    )}
  </CardContent>
</Card>

      </div>

      {/* ✅ PIE CHART (ONLY ONCE) */}
      
    </div>
  )
}