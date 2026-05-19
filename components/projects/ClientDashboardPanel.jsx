"use client";

import { useMemo, useState } from "react";
import ProjectTimelineBoard from "@/components/projects/ProjectTimelineBoard";

export default function ClientDashboardPanel({ projects = [], sessionUserId }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Prefer the client's in-progress project if present
  const clientProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      try {
        const clientId = p.client?._id || p.client?.id || p.client;
        return String(clientId) === String(sessionUserId);
      } catch {
        return false;
      }
    });
  }, [projects, sessionUserId]);

  const inProgressProject = useMemo(() => {
    return clientProjects.find((p) => p.status === "in-progress") || clientProjects[0] || null;
  }, [clientProjects]);

  // Ensure selected project follows the preferred project
  useMemo(() => {
    if (inProgressProject) setSelectedProjectId(inProgressProject._id || inProgressProject.id || "");
  }, [inProgressProject]);

  return (
    <div className="space-y-6">
      {/* Timeline + progress for the primary project */}
      <div>
        <ProjectTimelineBoard
          role="client"
          sessionUserId={sessionUserId}
          canEditTasks={false}
          project={clientProjects.find((p) => (p._id || p.id) === selectedProjectId) || inProgressProject}
        />
      </div>

      {/* Small table of projects and their status/progress */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Projects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {clientProjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-gray-500 dark:text-gray-400">No projects found.</td>
                </tr>
              ) : (
                clientProjects.map((p) => (
                  <tr key={p._id || p.id} className="border-t dark:border-zinc-700">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{p.title}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded overflow-hidden">
                          <div className="h-full bg-zinc-400 dark:bg-zinc-500" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-600 dark:text-gray-300">{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{p.status}</td>
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
