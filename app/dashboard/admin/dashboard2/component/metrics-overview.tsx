"use client"

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  BarChart3 
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import React, { useCallback, useEffect, useState } from "react"

const metrics = [
  {
    title: "Total Revenue",
    value: "₹54,230",
    description: "Monthly revenue",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
    footer: "Trending up this month",
    subfooter: "Revenue for the last 6 months"
  },
  {
    title: "Active Customers",
    value: "2,350",
    description: "Total active users",
    change: "+5.2%", 
    trend: "up",
    icon: Users,
    footer: "Strong user retention",
    subfooter: "Engagement exceeds targets"
  },
  {
    title: "Active projects",
    value: "1,247",
    description: "Orders this month",
    change: "-2.1%",
    trend: "down", 
    icon: ShoppingCart,
    footer: "Down 2% this period",
    subfooter: "Order volume needs attention"
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    description: "Average conversion",
    change: "+8.3%",
    trend: "up",
    icon: BarChart3,
    footer: "Steady performance increase",
    subfooter: "Meets conversion projections"
  },
]

export function MetricsOverview() {
  const [convertedCount, setConvertedCount] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  
  // New state for real data
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, monthlyRevenue: 0, percentChange: "+0%" });
  const [activeUsersData, setActiveUsersData] = useState({ totalActiveClients: 0 });
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  React.useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (res.ok && data.leads) {
          const count = data.leads.filter((lead: any) => lead.convertedToClient).length;
          setConvertedCount(count);
        } else {
          setConvertedCount(null);
        }
      } catch {
        setConvertedCount(null);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  React.useEffect(() => {
    async function fetchRevenue() {
      setLoadingRevenue(true);
      try {
        const res = await fetch("/api/dashboard/revenue");
        const data = await res.json();
        console.log("Revenue response status:", res.ok, "data:", data);
        
        if (res.ok && data.success) {
          console.log("Revenue data:", data);
          setRevenueData({
            totalRevenue: data.totalRevenue || 0,
            monthlyRevenue: data.monthlyRevenue || 0,
            percentChange: data.percentChange || "+0%",
          });
        } else {
          console.error("Revenue API error:", res.status, data);
          setRevenueData({
            totalRevenue: 0,
            monthlyRevenue: 0,
            percentChange: "+0%",
          });
        }
      } catch (error) {
        console.error("Failed to fetch revenue:", error);
        setRevenueData({
          totalRevenue: 0,
          monthlyRevenue: 0,
          percentChange: "+0%",
        });
      } finally {
        setLoadingRevenue(false);
      }
    }
    fetchRevenue();
  }, []);

  React.useEffect(() => {
    async function fetchActiveUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/dashboard/active-users");
        const data = await res.json();
        console.log("Active users response status:", res.ok, "data:", data);
        
        if (res.ok && data.success) {
          console.log("Active clients data:", data);
          setActiveUsersData({
            totalActiveClients: data.totalActiveClients || 0,
          });
        } else {
          console.error("Active clients API error:", res.status, data);
          setActiveUsersData({
            totalActiveClients: 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch active users:", error);
        setActiveUsersData({
          totalActiveClients: 0,
        });
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchActiveUsers();
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      setProjectError("");

      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      setProjects(data.projects.length || []);
    } catch (error) {
      setProjectError(error.message || "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
    

  const metrics = [
    {
      title: "Total Revenue",
      value: loadingRevenue ? "..." : `₹${Math.round(revenueData.totalRevenue)?.toLocaleString() || "0"}`,
      description: "Total project cost revenue",
      change: revenueData.percentChange || "+0%",
      trend: revenueData.percentChange?.startsWith("+") ? "up" : revenueData.percentChange === "+0%" ? "flat" : "down",
      icon: DollarSign,
      footer: revenueData.percentChange?.startsWith("+") ? "Trending up this month" : "Trending down this month",
      subfooter: "Sum of all project costs"
    },
    {
      title: "Active Customers",
      value: loadingUsers ? "..." : (activeUsersData.totalActiveClients || "0"),
      description: "Total active users",
      change: "+5.2%", 
      trend: "up",
      icon: Users,
      footer: "Strong user retention",
      subfooter: "Engagement exceeds targets"
    },
    {
      title: "Total projects",
      value: projects || "0",
      description: "Orders this month",
      change: "0%",
      trend: "down", 
      icon: ShoppingCart,
      footer: "Down 2% this period",
      subfooter: "Order volume needs attention"
    },
    {
      title: "Conversion Rate",
      value: loading ? "..." : convertedCount !== null ? convertedCount.toString() : "-",
      description: "Leads converted to client",
      change: "+8.3%",
      trend: "up",
      icon: BarChart3,
      footer: "Steady performance increase",
      subfooter: "Meets conversion projections"
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        
        return (
          <Card key={metric.title} className=" cursor-pointer">
            <CardHeader className="">
              <CardDescription className="">{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction className="">
                <Badge
                  className={
                    metric.trend === "up"
                      ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : metric.trend === "down"
                      ? "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                      : "border-gray-200 bg-gray-500/10 text-gray-700 dark:border-gray-500/30 dark:bg-gray-500/15 dark:text-gray-300"
                  }
                  variant="outline"
                >
                  <TrendIcon
                    className={`h-4 w-4 ${
                      metric.trend === "up"
                        ? "text-emerald-600 dark:text-emerald-300"
                        : metric.trend === "down"
                        ? "text-red-600 dark:text-red-300"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}