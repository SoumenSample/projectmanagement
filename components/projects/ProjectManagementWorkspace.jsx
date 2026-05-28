"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";

import ProjectCreatePanel from "@/components/projects/ProjectCreatePanel";
import ProjectTimelineBoard from "@/components/projects/ProjectTimelineBoard";

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────

const STATUS_META = {
  completed:    {
    label: "Completed",
    bar:   "from-emerald-500 to-emerald-400",
    solid: "#10b981",
    pill:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700/40",
  },
  "in-progress": {
    label: "In Progress",
    bar:   "from-sky-500 to-sky-400",
    solid: "#0ea5e9",
    pill:  "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-700/40",
  },
  "at-risk": {
    label: "At Risk",
    bar:   "from-rose-500 to-amber-400",
    solid: "#f43f5e",
    pill:  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-700/40",
  },
  planning: {
    label: "Planning",
    bar:   "from-violet-500 to-indigo-400",
    solid: "#8b5cf6",
    pill:  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:border-violet-700/40",
  },
  paused: {
    label: "Paused",
    bar:   "from-gray-400 to-gray-300",
    solid: "#9ca3af",
    pill:  "bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10",
  },
};

function getMeta(status) {
  return STATUS_META[status] || STATUS_META.planning;
}

function toDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function fmtShort(date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function fmtMonth(date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase();
}

function fmtDay(date) {
  return date.getDate();
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function buildTimeline(projects = []) {
  const today = new Date();

  const parsed = projects.map((project, i) => {
    const startDate    = toDate(project?.startDate || project?.createdAt) || addDays(today, i * 3);
    const deadlineDate = toDate(project?.deadline) || addDays(startDate, 10);
    return { project, startDate, deadlineDate };
  });

  if (!parsed.length) {
    const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 4));
    return { start: days[0], days, rows: [], todayIndex: 4 };
  }

  const earliest = parsed.reduce((a, b) => (b.startDate    < a ? b.startDate    : a), parsed[0].startDate);
  const latest   = parsed.reduce((a, b) => (b.deadlineDate > a ? b.deadlineDate : a), parsed[0].deadlineDate);
  const start    = addDays(earliest, -3);
  const end      = addDays(latest, 4);
  const span     = Math.max(21, Math.ceil((end - start) / 864e5) + 1);
  const days     = Array.from({ length: span }, (_, i) => addDays(start, i));
  const todayIdx = days.findIndex((d) => isSameDay(d, today));

  return {
    start,
    days,
    todayIndex: todayIdx,
    rows: parsed.map(({ project, startDate, deadlineDate }) => {
      const startOffset = clamp(Math.round((startDate    - start) / 864e5), 0, days.length - 1);
      const endOffset   = clamp(Math.round((deadlineDate - start) / 864e5), startOffset, days.length - 1);
      const duration    = endOffset - startOffset + 1;
      return { project, startDate, deadlineDate, startOffset, endOffset, duration };
    }),
  };
}

function buildMonthGroups(days) {
  const groups = [];
  days.forEach((day) => {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({ key, label: fmtMonth(day), count: 1 });
    } else {
      groups[groups.length - 1].count++;
    }
  });
  return groups;
}

// ─────────────────────────────────────────────
// Portalled tooltip — escapes all overflow/sticky clipping
// ─────────────────────────────────────────────

function GanttTooltip({ project, startDate, deadlineDate, meta, progress, pointerX, pointerY }) {
  const TOOLTIP_W = 210;
  const TOOLTIP_H = 100; // approx
  const GAP       = 10;

  if (typeof document === "undefined" || pointerX == null || pointerY == null) return null;

  // Place near the pointer; if not enough space below viewport, flip above
  const spaceBelow = window.innerHeight - pointerY;
  const showBelow  = spaceBelow >= TOOLTIP_H + GAP;

  const top  = showBelow
    ? pointerY + GAP
    : pointerY - TOOLTIP_H - GAP;

  // Follow the pointer, keep inside viewport
  const rawLeft = pointerX - TOOLTIP_W / 2;
  const left    = clamp(rawLeft, 8, window.innerWidth - TOOLTIP_W - 8);

  // Arrow points toward the pointer position
  const arrowLeft = clamp(pointerX - left - 6, 10, TOOLTIP_W - 22);

  return createPortal(
    <div
      className="fixed pointer-events-none"
      style={{ top, left, width: TOOLTIP_W, zIndex: 99999 }}
    >
      <div
        className="relative rounded-xl shadow-2xl px-4 py-3"
        style={{
          background: "#0f1117",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Arrow — pointing UP toward bar (when tooltip is below) */}
        {showBelow && (
          <div
            className="absolute -top-1.5 w-3 h-3 rotate-45"
            style={{
              left: arrowLeft,
              background: "#0f1117",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              borderLeft: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        )}
        {/* Arrow — pointing DOWN toward bar (when tooltip is above) */}
        {!showBelow && (
          <div
            className="absolute -bottom-1.5 w-3 h-3 rotate-45"
            style={{
              left: arrowLeft,
              background: "#0f1117",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
              borderRight:  "1px solid rgba(255,255,255,0.12)",
            }}
          />
        )}

        {/* Title */}
        <p className="text-[13px] font-bold text-white leading-tight mb-2 truncate">
          {project.title}
        </p>

        {/* Date range */}
        <div className="flex items-center gap-1.5 mb-3">
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="text-[11px] text-gray-400">
            {fmtShort(startDate)} ~ {fmtShort(deadlineDate)}
          </span>
        </div>

        {/* Progress bar + % */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 6, background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className={`h-full rounded-full bg-linear-to-r ${meta.bar}`}
              style={{ width: `${progress}%`, transition: "width 0.4s" }}
            />
          </div>
          <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: meta.solid }}>
            {progress}%
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─────────────────────────────────────────────
// Gantt chart
// ─────────────────────────────────────────────

const COL_LABEL_W = 220;
const DAY_W       = 34;

function ProjectGanttOverview({ projects, selectedProjectId, onSelectProject }) {
  const [tooltip, setTooltip] = useState(null); // { id, pointerX, pointerY }

  const timeline    = useMemo(() => buildTimeline(projects), [projects]);
  const monthGroups = useMemo(() => buildMonthGroups(timeline.days), [timeline.days]);
  const gridWidth   = COL_LABEL_W + timeline.days.length * DAY_W;

  if (!projects.length) return null;

  function handleBarMouseMove(e, id) {
    setTooltip({ id, pointerX: e.clientX, pointerY: e.clientY });
  }

  function handleBarMouseLeave() {
    setTooltip(null);
  }

  return (
    // NOTE: no overflow-hidden on the outer wrapper — tooltip portals to body anyway,
    // but keeping the chart visually clean with rounded corners via a clip wrapper.
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10 rounded-t-2xl overflow-hidden">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Gantt Timeline
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Project durations from start date to deadline
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {[
            { label: "On track",  cls: "bg-sky-500" },
            { label: "At risk",   cls: "bg-rose-500" },
            { label: "Completed", cls: "bg-emerald-500" },
            { label: "Today",     cls: "bg-amber-400" },
          ].map(({ label, cls }) => (
            <span key={label} className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span className={`h-2 w-2 rounded-full ${cls}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Scrollable chart ── */}
      <div className="overflow-x-auto overflow-y-visible rounded-b-2xl">
        <div style={{ minWidth: gridWidth }} className="relative">

          {/* Month header */}
          <div
            className="flex sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10"
            style={{ minWidth: gridWidth }}
          >
            <div
              className="sticky left-0 z-40 shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-white/10"
              style={{ width: COL_LABEL_W }}
            />
            {monthGroups.map((g) => (
              <div
                key={g.key}
                className="flex items-center px-2 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-white/10 last:border-r-0"
                style={{ width: g.count * DAY_W }}
              >
                {g.label}
              </div>
            ))}
          </div>

          {/* Day header */}
          <div
            className="flex sticky top-7.25 z-30 bg-gray-50 dark:bg-zinc-950/70 border-b border-gray-100 dark:border-white/10"
            style={{ minWidth: gridWidth }}
          >
            <div
              className="sticky left-0 z-40 shrink-0 bg-gray-50 dark:bg-zinc-950/70 border-r border-gray-100 dark:border-white/10"
              style={{ width: COL_LABEL_W }}
            />
            {timeline.days.map((day, i) => {
              const isToday  = i === timeline.todayIndex;
              const isSunday = day.getDay() === 0;
              return (
                <div
                  key={day.toISOString()}
                  style={{ width: DAY_W }}
                  className={`shrink-0 flex flex-col items-center justify-center py-1.5 text-center border-r border-gray-100 dark:border-white/10 last:border-r-0
                    ${isToday ? "bg-amber-50 dark:bg-amber-400/10" : ""}
                  `}
                >
                  <span className={`text-[8px] font-semibold uppercase tracking-wide
                    ${isToday ? "text-amber-600 dark:text-amber-400" : "text-gray-300 dark:text-gray-700"}`}
                  >
                    {new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(day)}
                  </span>
                  <span className={`text-[11px] font-bold mt-0.5
                    ${isToday  ? "text-amber-600 dark:text-amber-400" :
                      isSunday ? "text-gray-400 dark:text-gray-500"  :
                                 "text-gray-400 dark:text-gray-600"}`}
                  >
                    {fmtDay(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {timeline.rows.map(({ project, startDate, deadlineDate, startOffset, duration }) => {
              const id         = String(project._id || project.id);
              const isSelected = id === String(selectedProjectId);
              const meta       = getMeta(project.status);
              const progress   = clamp(project.progress || 0, 0, 100);
              const isHovered  = tooltip?.id === id;

              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProject?.(id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelectProject?.(id)}
                  className={`relative flex items-center cursor-pointer transition-colors duration-150
                    ${isSelected ? "bg-gray-50 dark:bg-white/6"    :
                      isHovered  ? "bg-gray-50/70 dark:bg-white/3" :
                                   "bg-white dark:bg-zinc-900"}
                  `}
                  style={{ minWidth: gridWidth }}
                >
                  {/* Selected accent bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white rounded-r-full" />
                  )}

                  {/* Sticky label column */}
                  <div
                    className={`sticky left-0 z-20 shrink-0 flex items-center gap-3 px-4 py-3 border-r border-gray-100 dark:border-white/10
                      ${isSelected ? "bg-gray-50 dark:bg-white/6"    :
                        isHovered  ? "bg-gray-50/70 dark:bg-white/3" :
                                     "bg-white dark:bg-zinc-900"}
                    `}
                    style={{ width: COL_LABEL_W }}
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: meta.solid }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                        {project.title}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {fmtShort(startDate)} → {fmtShort(deadlineDate)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.pill}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Day cells */}
                  <div className="relative flex items-center" style={{ height: 56 }}>
                    {/* Stripe background */}
                    {timeline.days.map((day, i) => {
                      const isToday  = i === timeline.todayIndex;
                      const isSunday = day.getDay() === 0;
                      return (
                        <div
                          key={day.toISOString()}
                          style={{ width: DAY_W, height: 56 }}
                          className={`shrink-0 border-r border-gray-50 dark:border-white/3 last:border-r-0
                            ${isToday                   ? "bg-amber-50/60 dark:bg-amber-400/5"    : ""}
                            ${isSunday && !isToday      ? "bg-gray-50/60 dark:bg-white/1.5"   : ""}
                          `}
                        />
                      );
                    })}

                    {/* Today line */}
                    {timeline.todayIndex >= 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-px pointer-events-none z-10"
                        style={{
                          left: timeline.todayIndex * DAY_W + DAY_W / 2,
                          background: "rgba(251,191,36,0.6)",
                        }}
                      />
                    )}

                    {/* Gantt bar — the mouse target for the tooltip */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 z-10"
                      style={{
                        left:  startOffset * DAY_W + 4,
                        width: Math.max(duration * DAY_W - 8, 8),
                      }}
                      onMouseMove={(e) => handleBarMouseMove(e, id)}
                      onMouseLeave={handleBarMouseLeave}
                    >
                      {/* Track */}
                      <div className="relative h-6 w-full rounded-sm overflow-hidden bg-gray-100 dark:bg-white/12 shadow-inner">
                        {/* Progress fill */}
                        <div
                          className={`absolute left-0 top-0 h-full rounded-sm bg-linear-to-r ${meta.bar} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                        {/* Hover brightening */}
                        {isHovered && (
                          <div className="absolute inset-0 bg-white/10 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today column full-height tint */}
          {timeline.todayIndex >= 0 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-0"
              style={{
                left:  COL_LABEL_W + timeline.todayIndex * DAY_W,
                width: DAY_W,
                background: "rgba(251,191,36,0.035)",
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between rounded-b-2xl">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium">
          {projects.length} project{projects.length !== 1 ? "s" : ""} · hover bars to see progress
        </p>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] text-gray-400 dark:text-gray-600">Today</span>
        </div>
      </div>

      {/* Portalled tooltip — rendered outside all overflow containers */}
      {tooltip && (() => {
        const row = timeline.rows.find((r) => String(r.project._id || r.project.id) === tooltip.id);
        if (!row) return null;
        const meta     = getMeta(row.project.status);
        const progress = clamp(row.project.progress || 0, 0, 100);
        return (
          <GanttTooltip
            project={row.project}
            startDate={row.startDate}
            deadlineDate={row.deadlineDate}
            meta={meta}
            progress={progress}
            pointerX={tooltip.pointerX}
            pointerY={tooltip.pointerY}
          />
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main workspace
// ─────────────────────────────────────────────

export default function ProjectManagementWorkspace({ role, sessionUserId, users = [], canEditTasks = false }) {
  const [refreshSignal, setRefreshSignal]         = useState(0);
  const [projects, setProjects]                   = useState([]);
  const [loadingProjects, setLoadingProjects]     = useState(true);
  const [projectError, setProjectError]           = useState("");
  const [isCreateOpen, setIsCreateOpen]           = useState(false);
  const [isEditOpen, setIsEditOpen]               = useState(false);
  const [editingProject, setEditingProject]       = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  async function parseResponseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return { error: text }; }
  }

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setProjectError("");
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data?.error || "Failed to load projects");
      const next = data.projects || [];
      setProjects(next);
      setSelectedProjectId((cur) => {
        if (cur && next.some((p) => p._id === cur)) return cur;
        return next[0]?._id || "";
      });
    } catch (err) {
      setProjectError(err.message || "Failed to load projects");
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
      auth: { userId: sessionUserId },
    });
    socket.emit("join", { userId: sessionUserId });
    socket.on("project-updated", loadProjects);
    return () => socket.disconnect();
  }, [sessionUserId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const projectCounts = useMemo(() => ({
    total:        projects.length,
    active:       projects.filter((p) => p.status !== "completed").length,
    completed:    projects.filter((p) => p.status === "completed").length,
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

      {/* ── Summary card ── */}
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Projects",  value: projectCounts.total,        accent: "text-gray-900 dark:text-white" },
              { label: "Active",          value: projectCounts.active,       accent: "text-sky-600 dark:text-sky-400" },
              { label: "Completed",       value: projectCounts.completed,    accent: "text-emerald-600 dark:text-emerald-400" },
              { label: "Assigned to You", value: projectCounts.assignedToMe, accent: "text-violet-600 dark:text-violet-400" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
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
            showTaskOutline
            onSaved={handleProjectSaved}
            onCancel={() => { setIsEditOpen(false); setEditingProject(null); }}
          />
        </ProjectModal>
      )}

      {/* ── Gantt ── */}
      <ProjectGanttOverview
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      {/* ── Projects grid ── */}
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

        {projectError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {projectError}
          </div>
        )}

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
              const meta       = getMeta(project.status);
              const progress   = clamp(project.progress || 0, 0, 100);
              const assigned   = project.assignedEmployees || [];

              return (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => setSelectedProjectId(project._id)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200
                    ${isSelected
                      ? "border-gray-400 dark:border-white/30 bg-gray-50 dark:bg-white/10 shadow-md"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Project</p>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug truncate">{project.title}</h3>
                    </div>
                    <span className={`flex-none rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${meta.pill}`}>
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {project.description || "No description provided."}
                  </p>

                  <div className="mb-3">
                    <div className="flex justify-between mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-linear-to-r ${meta.bar} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {assigned.length} assigned
                    </span>
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
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

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

function ProjectModal({ children, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto px-4 py-8"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", zIndex: 11000 }}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl">{children}</div>
    </div>,
    document.body,
  );
}