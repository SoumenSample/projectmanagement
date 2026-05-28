"use client"

import { Eye, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import React from "react"
import ProjectGanttOverview from "@/components/projects/ProjectGanttOverview"

const transactions = []

export function RecentTransactions() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<any>(null);
  const statusStyles = {
    active: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    inactive: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
  };

  React.useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.ok && data.projects) {
          setProjects(data.projects);
        } else {
          setError(data.error || "Failed to fetch projects");
        }
      } catch {
        setError("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="">Projects (Gantt)</CardTitle>
          <CardDescription className="">Project timeline overview</CardDescription>
        </div>
        {/* <Button variant="outline" size="sm" className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button> */}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading projects...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-gray-400">No projects found.</div>
        ) : (
          <ProjectGanttOverview projects={projects} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
        )}
      </CardContent>
    </Card>
  );
}