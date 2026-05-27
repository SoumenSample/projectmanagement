// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { io } from "socket.io-client";

// import ProjectCreatePanel from "@/components/projects/ProjectCreatePanel";
// import ProjectTimelineBoard from "@/components/projects/ProjectTimelineBoard";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// export default function ProjectManagementWorkspace({ role, sessionUserId, users = [], canEditTasks = false }) {
//   const [refreshSignal, setRefreshSignal] = useState(0);
//   const [projects, setProjects] = useState([]);
//   const [loadingProjects, setLoadingProjects] = useState(true);
//   const [projectError, setProjectError] = useState("");
//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [editingProject, setEditingProject] = useState(null);
//   const [selectedProjectId, setSelectedProjectId] = useState("");

//   async function loadProjects() {
//     try {
//       setLoadingProjects(true);
//       setProjectError("");

//       const response = await fetch("/api/projects", { cache: "no-store" });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to load projects");
//       }

//       const nextProjects = data.projects || [];
//       setProjects(nextProjects);

//       setSelectedProjectId((current) => {
//         if (current && nextProjects.some((project) => project._id === current)) {
//           return current;
//         }

//         return nextProjects[0]?._id || "";
//       });
//     } catch (error) {
//       setProjectError(error.message || "Failed to load projects");
//     } finally {
//       setLoadingProjects(false);
//     }
//   }

//   useEffect(() => {
//     loadProjects();
//   }, [refreshSignal]);

//   useEffect(() => {
//     if (!sessionUserId) return undefined;

//     const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
//     const socket = io(socketUrl, { transports: ["websocket", "polling"] });
//     socket.emit("join", sessionUserId);

//     socket.on("project-updated", () => {
//       loadProjects();
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, [sessionUserId]);

//   const selectedProject = useMemo(
//     () => projects.find((project) => project._id === selectedProjectId) || null,
//     [projects, selectedProjectId]
//   );

//   const projectCounts = useMemo(() => {
//     const total = projects.length;
//     const active = projects.filter((project) => project.status !== "completed").length;
//     const completed = projects.filter((project) => project.status === "completed").length;
//     const assignedToMe = projects.filter((project) =>
//       (project.assignedEmployees || []).some((employee) => String(employee?._id || employee?.id || employee) === sessionUserId)
//     ).length;

//     return { total, active, completed, assignedToMe };
//   }, [projects, sessionUserId]);

//   function handleProjectSaved(project) {
//     setProjects((currentProjects) => {
//       const index = currentProjects.findIndex((item) => item._id === project._id);

//       if (index === -1) {
//         return [project, ...currentProjects];
//       }

//       const nextProjects = [...currentProjects];
//       nextProjects[index] = project;
//       return nextProjects;
//     });

//     setSelectedProjectId(project._id);
//     setIsCreateOpen(false);
//     setIsEditOpen(false);
//     setEditingProject(null);
//     setRefreshSignal((value) => value + 1);
//   }

//   function handleEditProject(project) {
//     setEditingProject(project);
//     setIsEditOpen(true);
//     setIsCreateOpen(false);
//   }

//   function handleProjectUpdated(project) {
//     setProjects((currentProjects) =>
//       currentProjects.map((item) => (item._id === project._id ? project : item))
//     );
//   }

//   return (
//     //  <div className="">
           
//     <div className="space-y-6 bg-background text-foreground">
//       {role !== "client" ? (
//         <Card className="border-cyan-400/20 bg-background text-foreground dark:bg-black dark:text-white">
//           <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//             <div>
//               <CardTitle className="text-2xl">Manage Projects</CardTitle>
//               <CardDescription>
//                 Select a project to inspect its timeline, task progress, and employee updates.
//               </CardDescription>
//             </div>

//             {role === "admin" ? (
//               <Button type="button" onClick={() => setIsCreateOpen(true)}>
//                 Create Project
//               </Button>
//             ) : null}
//           </CardHeader>

//           <CardContent className="grid gap-4 md:grid-cols-4">
//             <SummaryTile label="Total Projects" value={projectCounts.total} />
//             <SummaryTile label="Active" value={projectCounts.active} />
//             <SummaryTile label="Completed" value={projectCounts.completed} />
//             <SummaryTile label={role === "employee" ? "Assigned to You" : "Assigned to You"} value={projectCounts.assignedToMe} />
//           </CardContent>
//         </Card>
//       ) : null}

//       {role === "admin" && isCreateOpen ? (
//         <ProjectModal onClose={() => setIsCreateOpen(false)}>
//           <ProjectCreatePanel
//             users={users}
//             onSaved={handleProjectSaved}
//             onCancel={() => setIsCreateOpen(false)}
//           />
//         </ProjectModal>
//       ) : null}

//       {role === "admin" && isEditOpen && editingProject ? (
//         <ProjectModal
//           onClose={() => {
//             setIsEditOpen(false);
//             setEditingProject(null);
//           }}
//         >
//           <ProjectCreatePanel
//             users={users}
//             initialProject={editingProject}
//             mode="edit"
//             showTaskOutline={false}
//             onSaved={handleProjectSaved}
//             onCancel={() => {
//               setIsEditOpen(false);
//               setEditingProject(null);
//             }}
//           />
//         </ProjectModal>
//       ) : null}

//       <Card className="border-gray-400/20 bg-background text-foreground dark:bg-black dark:text-white">
//         <CardHeader>
//           <CardTitle className="text-xl">Projects</CardTitle>
//           <CardDescription>Click a project to open its progress timeline.</CardDescription>
//         </CardHeader>

//         <CardContent>
//           {projectError ? <p className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{projectError}</p> : null}

//           {loadingProjects ? (
//             <p className="text-sm text-cyan-100/70">Loading projects...</p>
//           ) : projects.length ? (
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
//               {projects.map((project) => {
//                 const isSelected = project._id === selectedProjectId;
//                 const assignedEmployees = project.assignedEmployees || [];

//                 return (
//                   <button
//                     key={project._id}
//                     type="button"
//                     onClick={() => setSelectedProjectId(project._id)}
//                     className={`rounded-2xl border p-4 text-left transition-all duration-200 bg-background text-foreground dark:bg-black dark:text-white${
//                       isSelected
//                         ? " border-cyan-400/70 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
//                         : " border-cyan-500/15 hover:border-cyan-400/35 hover:bg-black/45 dark:hover:bg-gray-900"
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">Project</p>
//                         <h3 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h3>
//                       </div>

//                       <span className="rounded-full border border-gray-400/20  px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/80">
//                         {project.progress}%
//                       </span>
//                     </div>

//                     <p className="mt-2 line-clamp-2 text-sm text-foreground/60">
//                       {project.description || "No description provided."}
//                     </p>

//                     <div className="mt-4 flex items-center justify-between text-xs text-foreground/55">
//                       <span>{assignedEmployees.length} assigned</span>
//                       <span>{project.status}</span>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           ) : (
//             <p className="text-sm text-cyan-100/70">No projects yet.</p>
//           )}
//         </CardContent>
//       </Card>

//       <ProjectTimelineBoard
//         role={role}
//         sessionUserId={sessionUserId}
//         canEditTasks={canEditTasks}
//         project={selectedProject}
//         onProjectUpdated={handleProjectUpdated}
//         onRefresh={loadProjects}
//         onEditProject={handleEditProject}
//       />
//     </div>
//   );
// }

// function ProjectModal({ children, onClose }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 backdrop-blur-sm">
//       <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
//       <div className="relative z-10 w-full max-w-5xl">
//         {children}
//       </div>
//     </div>
//   );
// }

// function SummaryTile({ label, value }) {
//   return (
//     <div className="rounded-2xl border border-gray-500/15 bg-background text-foreground dark:bg-black dark:text-white p-4">
//       <p className="text-xs uppercase tracking-[0.2em] text-foreground/80">{label}</p>
//       <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
//     </div>
//   );
// }




"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";

import ProjectCreatePanel from "@/components/projects/ProjectCreatePanel";
import ProjectTimelineBoard from "@/components/projects/ProjectTimelineBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusColors = {
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "in-progress":"bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  "at-risk":   "bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400",
  planning:    "bg-gray-100   text-gray-600   dark:bg-white/10      dark:text-gray-400",
  paused:      "bg-gray-100   text-gray-500   dark:bg-white/10      dark:text-gray-500",
};

export default function ProjectManagementWorkspace({ role, sessionUserId, users = [], canEditTasks = false }) {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  async function parseResponseBody(response) {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setProjectError("");
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.error || "Failed to load projects");
      const nextProjects = data.projects || [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => {
        if (current && nextProjects.some((p) => p._id === current)) return current;
        return nextProjects[0]?._id || "";
      });
    } catch (error) {
      setProjectError(error.message || "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => { loadProjects(); }, [refreshSignal]);

  useEffect(() => {
    if (!sessionUserId) return undefined;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        userId: sessionUserId,
      },
    });
    socket.emit("join", { userId: sessionUserId });
    socket.on("project-updated", () => { loadProjects(); });
    return () => { socket.disconnect(); };
  }, [sessionUserId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const projectCounts = useMemo(() => ({
    total:       projects.length,
    active:      projects.filter((p) => p.status !== "completed").length,
    completed:   projects.filter((p) => p.status === "completed").length,
    assignedToMe: projects.filter((p) =>
      (p.assignedEmployees || []).some((e) => String(e?._id || e?.id || e) === sessionUserId)
    ).length,
  }), [projects, sessionUserId]);

  function handleProjectSaved(project) {
    setProjects((cur) => {
      const idx = cur.findIndex((item) => item._id === project._id);
      if (idx === -1) return [project, ...cur];
      const next = [...cur];
      next[idx] = project;
      return next;
    });
    setSelectedProjectId(project._id);
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingProject(null);
    setRefreshSignal((v) => v + 1);
  }

  function handleEditProject(project) {
    setEditingProject(project);
    setIsEditOpen(true);
    setIsCreateOpen(false);
  }

  function handleProjectUpdated(project) {
    setProjects((cur) => cur.map((item) => (item._id === project._id ? project : item)));
  }

  return (
    <div className="space-y-6">

      {/* ── Summary card (admin / employee) ── */}
      {role !== "client" && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Projects</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a project to inspect its timeline, task progress, and employee updates.
              </p>
            </div>
            {(role === "admin" || role === "employee") && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold
                  bg-gray-900 text-white dark:bg-white dark:text-black
                  hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Project
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Projects",  value: projectCounts.total },
              { label: "Active",          value: projectCounts.active },
              { label: "Completed",       value: projectCounts.completed },
              { label: role === "employee" ? "Assigned to You" : "Assigned to You", value: projectCounts.assignedToMe },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      {(role === "admin" || role === "employee") && isCreateOpen && (
        <ProjectModal onClose={() => setIsCreateOpen(false)}>
          <ProjectCreatePanel
            users={users}
            role={role}
            sessionUserId={sessionUserId}
            onSaved={handleProjectSaved}
            onCancel={() => setIsCreateOpen(false)}
          />
        </ProjectModal>
      )}

      {/* ── Edit modal ── */}
      {(role === "admin" || role === "employee") && isEditOpen && editingProject && (
        <ProjectModal onClose={() => { setIsEditOpen(false); setEditingProject(null); }}>
          <ProjectCreatePanel
            users={users}
            role={role}
            sessionUserId={sessionUserId}
            initialProject={editingProject}
            mode="edit"
            showTaskOutline={true}
            onSaved={handleProjectSaved}
            onCancel={() => { setIsEditOpen(false); setEditingProject(null); }}
          />
        </ProjectModal>
      )}

      {/* ── Projects list card ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Click a project to open its progress timeline.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
            {projects.length} total
          </span>
        </div>

        {/* Error */}
        {projectError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {projectError}
          </div>
        )}

        {/* Loading */}
        {loadingProjects ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading projects…
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30 text-gray-400 dark:text-gray-600">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-600">No projects yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const isSelected = project._id === selectedProjectId;
              const assignedEmployees = project.assignedEmployees || [];
              const statusCls = statusColors[project.status] || statusColors.planning;
              const progress = project.progress || 0;

              return (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => setSelectedProjectId(project._id)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 group
                    ${isSelected
                      ? "border-gray-400 dark:border-white/30 bg-gray-50 dark:bg-white/10 shadow-md"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Project</p>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug truncate">{project.title}</h3>
                    </div>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusCls}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {project.description || "No description provided."}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {assignedEmployees.length} assigned
                    </span>
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(project.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Timeline board ── */}
      <ProjectTimelineBoard
        role={role}
        sessionUserId={sessionUserId}
        canEditTasks={canEditTasks}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
        onRefresh={loadProjects}
        onEditProject={handleEditProject}
      />
    </div>
  );
}

/* ── Modal overlay ── */
function ProjectModal({ children, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const modal = (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto px-4 py-8"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 11000 }}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl">
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}