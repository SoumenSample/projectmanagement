// import { Card, CardContent } from "@/components/ui/card"
// import {Users, CreditCard, UserCheck, Clock5, TrendingUp, TrendingDown, ArrowUpRight} from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { cn } from '@/lib/utils'


// const performanceMetrics = [
//   {
//     title: 'Total Users',
//     current: '₹2.4M',
//     previous: '₹1.8M',
//     growth: 33.3,
//     icon: Users,
//   },
//   {
//     title: 'Paid Users',
//     current: '12.5K',
//     previous: '9.2K',
//     growth: 35.9,
//     icon: CreditCard,
//   },
//   {
//     title: 'Active Users',
//     current: '8.9k',
//     previous: '6.7k',
//     growth: 32.8,
//     icon: UserCheck,
//   },
//   {
//     title: 'Pending Users',
//     current: '17%',
//     previous: '24%',
//     growth: -8.0,
//     icon: Clock5,
//   },
// ]

// export function StatCards() {
//   return (
//     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//       {performanceMetrics.map((metric, index) => (
//         <Card key={index} className='border'>
//           <CardContent className='space-y-4'>
//             <div className='flex items-center justify-between'>
//               <metric.icon className='text-muted-foreground size-6' />
//               <Badge
//                 variant='outline'
//                 className={cn(
//                   metric.growth >= 0
//                     ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400'
//                     : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400',
//                 )}
//               >
//                 {metric.growth >= 0 ? (
//                   <>
//                     <TrendingUp className='me-1 size-3' />
//                     {metric.growth >= 0 ? '+' : ''}
//                     {metric.growth}%
//                   </>
//                 ) : (
//                   <>
//                     <TrendingDown className='me-1 size-3' />
//                     {metric.growth}%
//                   </>
//                 )}
//               </Badge>
//             </div>

//             <div className='space-y-2'>
//               <p className='text-muted-foreground text-sm font-medium'>{metric.title}</p>
//               <div className='text-2xl font-bold'>{metric.current}</div>
//               <div className='text-muted-foreground flex items-center gap-2 text-sm'>
//                 <span>from {metric.previous}</span>
//                 <ArrowUpRight className='size-3' />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   )
// }


"use client"

import { useEffect, useState } from "react"
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
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

export function StatCards() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    converted: 0,
    pending: 0,
  })

  const [sourceData, setSourceData] = useState([])
  const [serviceData, setServiceData] = useState([])

  const COLORS = [
    "#3b82f6", "#22c55e", "#f59e0b",
    "#ef4444", "#8b5cf6", "#06b6d4",
  ]

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("/api/clients", { cache: "no-store" })
        const data = await res.json()

        const clientsData = Array.isArray(data.clients)
          ? data.clients
          : []

        setClients(clientsData)

        // ✅ STATS
        const total = clientsData.length
        const active = clientsData.filter((c) => c.status === "active").length
        const converted = clientsData.filter(
          (c) =>
            String(c.source || "").toLowerCase() === "lead-conversion"
        ).length
        const pending = clientsData.filter((c) => c.status !== "active").length

        setStats({ total, active, converted, pending })

        // ✅ SOURCE CHART
        const sourceMap = {}
        clientsData.forEach((c) => {
          const key = c.source || "unknown"
          sourceMap[key] = (sourceMap[key] || 0) + 1
        })

        setSourceData(
          Object.keys(sourceMap).map((key) => ({
            name: key,
            value: sourceMap[key],
          }))
        )

        // ✅ SERVICE CHART
        const serviceMap = {}

        clientsData.forEach((c) => {
          const services = c.services || []

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

        setServiceData(
          Object.keys(serviceMap).map((key) => ({
            name: key,
            value: serviceMap[key],
          }))
        )

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  const performanceMetrics = [
    {
      title: "Total Users",
      current: stats.total,
      icon: Users,
    },
    {
      title: "Converted Users",
      current: stats.converted,
      icon: CreditCard,
    },
    
  ]

  return (
    <div className="space-y-6">

      {/* ✅ CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-10">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="h-35">
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <metric.icon className="size-5 text-muted-foreground" />
                <Badge className="">0%</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  {metric.title}
                </p>
                <h2 className="text-2xl font-bold">
                  {metric.current}
                </h2>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
         <Card className="">
          <CardContent className="flex flex-col items-center">
            <h3 className="font-semibold mb-2">
              Clients by Source
            </h3>

            <PieChart width={300} height={250}>
              <Pie data={sourceData} dataKey="value" label>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

        {/* SERVICE CHART */}
        <Card className="">
          <CardContent className="flex flex-col items-center">
            <h3 className="font-semibold mb-2">
              Clients by Services
            </h3>

            <PieChart width={300} height={250}>
              <Pie data={serviceData} dataKey="value" label>
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </CardContent>
        </Card>

      </div>

      {/* ✅ CHARTS */}
      
    </div>
  )
}