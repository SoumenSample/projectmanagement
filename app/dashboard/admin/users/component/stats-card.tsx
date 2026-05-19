// // import { Card, CardContent } from "@/components/ui/card"
// // import {Users, CreditCard, UserCheck, Clock5, TrendingUp, TrendingDown, ArrowUpRight} from "lucide-react"
// // import { Badge } from "@/components/ui/badge"
// // import { cn } from '@/lib/utils'


// // const performanceMetrics = [
// //   {
// //     title: 'Total Users',
// //     current: '₹2.4M',
// //     previous: '₹1.8M',
// //     growth: 33.3,
// //     icon: Users,
// //   },
// //   {
// //     title: 'Paid Users',
// //     current: '12.5K',
// //     previous: '9.2K',
// //     growth: 35.9,
// //     icon: CreditCard,
// //   },
// //   {
// //     title: 'Active Users',
// //     current: '8.9k',
// //     previous: '6.7k',
// //     growth: 32.8,
// //     icon: UserCheck,
// //   },
// //   {
// //     title: 'Pending Users',
// //     current: '17%',
// //     previous: '24%',
// //     growth: -8.0,
// //     icon: Clock5,
// //   },
// // ]

// // export function StatCards() {
// //   return (
// //     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
// //       {performanceMetrics.map((metric, index) => (
// //         <Card key={index} className='border'>
// //           <CardContent className='space-y-4'>
// //             <div className='flex items-center justify-between'>
// //               <metric.icon className='text-muted-foreground size-6' />
// //               <Badge
// //                 variant='outline'
// //                 className={cn(
// //                   metric.growth >= 0
// //                     ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400'
// //                     : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400',
// //                 )}
// //               >
// //                 {metric.growth >= 0 ? (
// //                   <>
// //                     <TrendingUp className='me-1 size-3' />
// //                     {metric.growth >= 0 ? '+' : ''}
// //                     {metric.growth}%
// //                   </>
// //                 ) : (
// //                   <>
// //                     <TrendingDown className='me-1 size-3' />
// //                     {metric.growth}%
// //                   </>
// //                 )}
// //               </Badge>
// //             </div>

// //             <div className='space-y-2'>
// //               <p className='text-muted-foreground text-sm font-medium'>{metric.title}</p>
// //               <div className='text-2xl font-bold'>{metric.current}</div>
// //               <div className='text-muted-foreground flex items-center gap-2 text-sm'>
// //                 <span>from {metric.previous}</span>
// //                 <ArrowUpRight className='size-3' />
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       ))}
// //     </div>
// //   )
// // }


// "use client"

// import { useEffect, useState } from "react"
// import { Card, CardContent } from "@/components/ui/card"
// import {
//   Users,
//   CreditCard,
//   UserCheck,
//   Clock5,
//   TrendingUp,
//   TrendingDown,
//   ArrowUpRight,
// } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { cn } from "@/lib/utils"

// export function StatCards() {
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     converted: 0,
//     pending: 0,
//   })

//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const loadUsers = async () => {
//       try {
//         const res = await fetch("/api/users", { cache: "no-store" })
//         const data = await res.json()

//         const users = data.users || []

//         const total = users.length
//         const active = users.filter((u: any) => u.isActive).length
//         const converted = users.filter(
//           (u: any) => String(u.source || "").toLowerCase() === "lead-conversion"
//         ).length
//         const pending = users.filter((u: any) => !u.isActive).length

//         setStats({ total, active, converted, pending })
//       } catch (err) {
//         console.error("Error fetching users:", err)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadUsers()
//   }, [])

//   if (loading) {
//     return <div className="p-4">Loading stats...</div>
//   }

//   const performanceMetrics = [
//     {
//       title: "Total Users",
//       current: stats.total,
//       previous: "-",
//       growth: 0,
//       icon: Users,
//     },
//     {
//       title: "Converted Users",
//       current: stats.converted,
//       previous: "-",
//       growth: 0,
//       icon: CreditCard,
//     },
//     {
//       title: "Active Users",
//       current: stats.active,
//       previous: "-",
//       growth: 0,
//       icon: UserCheck,
//     },
//     {
//       title: "Pending Users",
//       current: stats.pending,
//       previous: "-",
//       growth: 0,
//       icon: Clock5,
//     },
//   ]

//   return (
//     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//       {performanceMetrics.map((metric, index) => (
//         <Card key={index} className="border">
//           <CardContent className="space-y-4">
//             <div className="flex items-center justify-between">
//               <metric.icon className="text-muted-foreground size-6" />

//               <Badge
//                 variant="outline"
//                 className={cn(
//                   metric.growth >= 0
//                     ? "border-green-200 bg-green-50 text-green-700"
//                     : "border-red-200 bg-red-50 text-red-700"
//                 )}
//               >
//                 {metric.growth >= 0 ? (
//                   <>
//                     <TrendingUp className="me-1 size-3" />+
//                     {metric.growth}%
//                   </>
//                 ) : (
//                   <>
//                     <TrendingDown className="me-1 size-3" />
//                     {metric.growth}%
//                   </>
//                 )}
//               </Badge>
//             </div>

//             <div className="space-y-2">
//               <p className="text-muted-foreground text-sm font-medium">
//                 {metric.title}
//               </p>
//               <div className="text-2xl font-bold">
//                 {metric.current}
//               </div>
//               <div className="text-muted-foreground flex items-center gap-2 text-sm">
//                 <span>from {metric.previous}</span>
//                 <ArrowUpRight className="size-3" />
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

// ✅ recharts
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

export function StatCards() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    converted: 0,
    pending: 0,
  })

  const [sourceData, setSourceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" })
      const data = await res.json()

      console.log("API RESPONSE:", data) // 🔥 DEBUG

      const users = Array.isArray(data?.users) ? data.users : []

      // ✅ stats
      const total = users.length
      const active = users.filter((u: any) => u.isActive).length
      const converted = users.filter(
        (u: any) =>
          String(u.source || "").toLowerCase() === "lead-conversion"
      ).length
      const pending = users.filter((u: any) => !u.isActive).length

      setStats({ total, active, converted, pending })

      // ✅ PIE CHART DATA
      const sourceMap: Record<string, number> = {}

      users.forEach((u: any) => {
        const source = u?.source || "unknown"

        sourceMap[source] = (sourceMap[source] || 0) + 1
      })

      const chartData = Object.entries(sourceMap).map(([key, value]) => ({
        name: key,
        value,
      }))

      setSourceData(chartData)

    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  loadUsers()
}, [])

  if (loading) {
    return <div className="p-4">Loading stats...</div>
  }

  const performanceMetrics = [
    {
      title: "Total Users",
      current: stats.total,
      previous: "-",
      growth: 0,
      icon: Users,
    },
    {
      title: "Converted Users",
      current: stats.converted,
      previous: "-",
      growth: 0,
      icon: CreditCard,
    },
    {
      title: "Active Users",
      current: stats.active,
      previous: "-",
      growth: 0,
      icon: UserCheck,
    },
    {
      title: "Inactive Users",
      current: stats.pending,
      previous: "-",
      growth: 0,
      icon: Clock5,
    },
  ]

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6">

      {/* ✅ STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="space-y-4">
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

      {/* ✅ PIE CHART */}
     

    </div>
  )
}