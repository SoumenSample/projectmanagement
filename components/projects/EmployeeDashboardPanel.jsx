"use client";

import { useMemo, useState } from "react";
import ProjectTimelineBoard from "@/components/projects/ProjectTimelineBoard";

export default function EmployeeDashboardPanel({ projects = [], sessionUserId }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const employeeProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      const assigned = p.assignedEmployees || [];
      return assigned.some((a) => {
        if (!a) return false;
        if (typeof a === "string") return String(a) === String(sessionUserId);
        return String(a._id || a.id || a) === String(sessionUserId);
      });
    });
  }, [projects, sessionUserId]);

  const inProgress = useMemo(() => employeeProjects.find((p) => p.status === "in-progress") || employeeProjects[0] || null, [employeeProjects]);

  useMemo(() => {
    if (inProgress) setSelectedProjectId(inProgress._id || inProgress.id || "");
  }, [inProgress]);

  return (
    <div className="space-y-6">
      <div>
        <ProjectTimelineBoard
          role="employee"
          sessionUserId={sessionUserId}
          canEditTasks={true}
          project={employeeProjects.find((p) => (p._id || p.id) === selectedProjectId) || inProgress}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-background  p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-3">Projects Assigned</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-foreground uppercase">
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeProjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-foreground">No projects assigned.</td>
                </tr>
              ) : (
                employeeProjects.map((p) => (
                  <tr key={p._id || p.id} className="border-t">
                    <td className="px-3 py-2 font-medium text-foreground">{p.title}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-100 h-2 rounded overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-foreground">{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-foreground">{p.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
