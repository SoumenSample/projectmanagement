"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users, MapPin, TrendingUp, Target, ArrowUpIcon, UserIcon, Loader2 } from "lucide-react"

const chartConfig = {
  clients: {
    label: "Clients",
    color: "#3b82f6",
  },
  leads: {
    label: "Leads",
    color: "#10b981",
  },
}

export function CustomerInsights() {
  const [activeTab, setActiveTab] = useState("growth")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customerGrowthData, setCustomerGrowthData] = useState([])
  const [demographicsData, setDemographicsData] = useState([])
  const [regionsData, setRegionsData] = useState([])
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    growthPercentage: "+0%",
    conversionRate: "0%",
  })

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/insights")
        
        if (!response.ok) {
          throw new Error("Failed to fetch insights data")
        }

        const data = await response.json()
        
        setCustomerGrowthData(data.growth.data)
        setDemographicsData(data.demographics)
        setRegionsData(data.regions)
        setMetrics({
          totalClients: data.growth.totalClients,
          growthPercentage: data.growth.growthPercentage,
          conversionRate: data.growth.conversionRate,
        })
        setError(null)
      } catch (err) {
        console.error("Error fetching insights:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  return (
    <Card className="h-fit">
      <CardHeader className="">
        <CardTitle className="">Customer Insights</CardTitle>
        <CardDescription className="">Growth trends and demographics</CardDescription>
      </CardHeader>
      <CardContent className="">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full items-center gap-1 bg-muted/50 p-1 rounded-lg h-12">
            <TabsTrigger
              value="growth"
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Demographics</span>
            </TabsTrigger>
            <TabsTrigger
              value="regions"
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Regions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="mt-8 space-y-6">
            <div className="grid gap-6">
              {/* Chart and Key Metrics Side by Side */}
              <div className="grid grid-cols-10 gap-6">
                {/* Chart Area - 70% */}
                <div className="col-span-10 xl:col-span-7">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Clients vs Leads</h3>
                  <ChartContainer id="" config={chartConfig} className="h-[375px] w-full">
                    <BarChart data={customerGrowthData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        domain={[0, 'dataMax']}
                      />
                      <ChartTooltip content={<ChartTooltipContent className="" />} />
                      <Bar dataKey="clients" fill="var(--color-clients, #3b82f6)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="leads" fill="var(--color-leads, #10b981)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Key Metrics - 30% */}
                <div className="col-span-10 xl:col-span-3 space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Clients</span>
                      </div>
                      <div className="text-2xl font-bold">{metrics.totalClients?.toLocaleString?.() ?? metrics.totalClients}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        {metrics.growthPercentage}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Lead → Client Conversion</span>
                      </div>
                      <div className="text-2xl font-bold">{metrics.conversionRate}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        {/* show growthPercentage or static note if desired */}
                        {""}
                      </div>
                    </div>

                    {/* <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Avg. LTV</span>
                      </div>
                      <div className="text-2xl font-bold">₹2,847</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +8.3% growth
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table className="">
                <TableHeader className="">
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Age Group</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Customers</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Percentage</TableHead>
                    {/* <TableHead className="text-right py-5 px-6 font-semibold">Growth</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody className="">
                  {demographicsData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium py-5 px-6">{row.ageGroup}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.customers.toLocaleString()}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.percentage}</TableCell>
                      {/* <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>{row.growth}</span>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                0 of {demographicsData.length} row(s) selected.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" className="" disabled>
                  Previous
                </Button>
                <Button variant="outline" className="" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="regions" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table className="">
                <TableHeader className="">
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Region</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Customers</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Revenue</TableHead>
                    {/* <TableHead className="text-right py-5 px-6 font-semibold">Growth</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody className="">
                  {regionsData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium py-5 px-6">{row.region}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.customers.toLocaleString()}</TableCell>
                      <TableCell className="text-right py-5 px-6">{row.revenue}</TableCell>
                      {/* <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>{row.growth}</span>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                0 of {regionsData.length} row(s) selected.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled className="">
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled className="">
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}