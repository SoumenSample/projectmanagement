"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const priorityStyles = {
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200",
  high: "border-rose-400/30 bg-rose-400/10 text-rose-700 dark:text-rose-200",
};

const statusStyles = {
  planning: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
  "in-progress": "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-100",
  "at-risk": "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-100",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100",
  paused: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-100",
};

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getProgressSummary(project) {
  const tasks = project.tasks || [];
  let completed = 0;
  let total = 0;

  for (const task of tasks) {
    total += 1;
    if (task.isDone) completed += 1;
    for (const subtask of task.subtasks || []) {
      total += 1;
      if (subtask.isDone) completed += 1;
    }
  }

  return { completed, total };
}

function buildTimelineRange(project) {
  if (!project) {
    const today = new Date();
    return {
      start: today,
      days: Array.from({ length: 14 }, (_, index) => addDays(today, index)),
    };
  }

  const startDate = toDate(project.startDate || project.createdAt) || new Date();
  const deadline = toDate(project.deadline) || addDays(startDate, 7);

  // Extend timeline to include any work done after the deadline so those days appear
  // in the timeline (e.g., tasks completed after the deadline).
  let endDate = deadline;
  try {
    for (const task of project.tasks || []) {
      if (task?.doneAt) {
        const d = toDate(task.doneAt);
        if (d && d > endDate) endDate = d;
      }
      for (const sub of task.subtasks || []) {
        if (sub?.doneAt) {
          const sd = toDate(sub.doneAt);
          if (sd && sd > endDate) endDate = sd;
        }
      }
    }
  } catch (e) {
    // ignore malformed tasks
  }

  const span = Math.max(
    7,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  return {
    start: startDate,
    days: Array.from({ length: span }, (_, index) => addDays(startDate, index)),
  };
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Only include done items whose doneAt is on or before the deadline
function buildDailyDoneMap(project, timelineDays, deadlineDate) {
  const doneMap = new Map();
  const validKeys = new Set((timelineDays || []).map((day) => formatDayKey(day)));

  for (const task of project?.tasks || []) {
    if (task?.isDone && task?.doneAt) {
      const doneDate = toDate(task.doneAt);
      if (doneDate) {
        const key = formatDayKey(doneDate);
        if (validKeys.has(key)) {
          const existing = doneMap.get(key) || [];
          existing.push({ type: "task", title: task.title });
          doneMap.set(key, existing);
        }
      }
    }

    for (const subtask of task?.subtasks || []) {
      if (!subtask?.isDone || !subtask?.doneAt) continue;
      const doneDate = toDate(subtask.doneAt);
      if (!doneDate) continue;
      const key = formatDayKey(doneDate);
      if (!validKeys.has(key)) continue;
      const existing = doneMap.get(key) || [];
      existing.push({ type: "subtask", title: subtask.title, parent: task.title });
      doneMap.set(key, existing);
    }
  }

  return doneMap;
}

// Deep clone project tasks for optimistic updates
function cloneProjectTasks(project) {
  return {
    ...project,
    tasks: (project.tasks || []).map((task) => ({
      ...task,
      subtasks: (task.subtasks || []).map((st) => ({ ...st })),
    })),
  };
}

export default function ProjectTimelineBoard({
  role,
  sessionUserId,
  canEditTasks = false,
  project,
  onProjectUpdated,
  onRefresh,
  onEditProject,
}) {
  const [activeTaskError, setActiveTaskError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  // Optimistic local project state — makes checkboxes feel instant
  const [localProject, setLocalProject] = useState(null);
  const dayWidth = 144;

  // Use optimistic state when available, otherwise fall back to server prop
  const displayProject = localProject ?? project;

  // Holds the server-confirmed project we're waiting for parent to reflect
  const pendingServerProject = useRef(null);

  useEffect(() => {
    if (!project) return;

    // Different project navigated to — wipe optimistic state
    if (localProject !== null) {
      const localId = String(localProject._id || localProject.id || "");
      const incomingId = String(project._id || project.id || "");
      if (localId !== incomingId) {
        pendingServerProject.current = null;
        setLocalProject(null);
        return;
      }
    }

    // We have confirmed server data — check if parent prop has now caught up
    if (pendingServerProject.current !== null) {
      const serverTasks = pendingServerProject.current.tasks || [];
      const incomingTasks = project.tasks || [];
      const synced = serverTasks.every((st) => {
        const match = incomingTasks.find(
          (t) => String(t._id || t.id) === String(st._id || st.id)
        );
        return match && Boolean(match.isDone) === Boolean(st.isDone);
      });
      if (synced) {
        pendingServerProject.current = null;
        setLocalProject(null);
      }
    }
  }, [project, localProject]);

  const timeline = useMemo(() => buildTimelineRange(displayProject), [displayProject]);
  const startDate = useMemo(
    () => (displayProject ? toDate(displayProject.startDate || displayProject.createdAt) || new Date() : null),
    [displayProject]
  );
  const deadlineDate = useMemo(
    () => (displayProject ? toDate(displayProject.deadline) || new Date() : null),
    [displayProject]
  );
  const progressSummary = useMemo(() => getProgressSummary(displayProject || {}), [displayProject]);

  const startOffset = useMemo(() => {
    if (!displayProject || !startDate) return 0;
    return clamp(
      Math.round((startDate.getTime() - timeline.start.getTime()) / (1000 * 60 * 60 * 24)),
      0,
      Math.max(timeline.days.length - 1, 0)
    );
  }, [displayProject, startDate, timeline.start, timeline.days.length]);

  // Bar ends exactly at the deadline column (+1 for inclusive span)
  const duration = useMemo(() => {
    if (!displayProject || !startDate || !deadlineDate) return timeline.days.length;
    return clamp(
      Math.round((deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      1,
      Math.max(timeline.days.length - startOffset, 1)
    );
  }, [displayProject, startDate, deadlineDate, timeline.days.length, startOffset]);

  const todayIndex = useMemo(() => {
    const today = new Date();
    return timeline.days.findIndex((day) => isSameDay(day, today));
  }, [timeline.days]);

  const dailyDoneMap = useMemo(
    () => buildDailyDoneMap(displayProject, timeline.days, deadlineDate),
    [displayProject, timeline.days, deadlineDate]
  );

  const toggleItem = useCallback(
    async (projectId, taskId, subtaskId, isDone) => {
      if (!taskId) {
        setActiveTaskError("Task id is missing");
        return;
      }

      // ── Instant optimistic update ──
      const base = localProject ?? project;
      if (base) {
        const optimistic = cloneProjectTasks(base);
        let completedCount = 0;
        let totalCount = 0;

        for (const task of optimistic.tasks) {
          totalCount += 1;
          if (String(task._id || task.id) === String(taskId) && !subtaskId) {
            task.isDone = isDone;
            if (isDone) task.doneAt = new Date().toISOString();
            else task.doneAt = null;
          }
          if (task.isDone) completedCount += 1;

          for (const subtask of task.subtasks || []) {
            totalCount += 1;
            if (
              String(task._id || task.id) === String(taskId) &&
              subtaskId &&
              String(subtask._id || subtask.id) === String(subtaskId)
            ) {
              subtask.isDone = isDone;
              if (isDone) subtask.doneAt = new Date().toISOString();
              else subtask.doneAt = null;
            }
            if (subtask.isDone) completedCount += 1;
          }
        }

        optimistic.progress =
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : optimistic.progress;

        if (optimistic.progress >= 100) {
          optimistic.status = "completed";
        } else if (optimistic.status === "completed") {
          optimistic.status = optimistic.progress > 0 ? "in-progress" : "planning";
        } else if (!optimistic.status || optimistic.status === "planning") {
          optimistic.status = optimistic.progress > 0 ? "in-progress" : "planning";
        }

        setLocalProject(optimistic);
      }

      // ── Background API call ──
      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: String(taskId),
            ...(subtaskId ? { subtaskId: String(subtaskId) } : {}),
            isDone: Boolean(isDone),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update task");
        }

        // Server confirmed — store it and let the useEffect above clear localProject
        // once the parent prop catches up. Do NOT call onRefresh (causes stale re-fetch race).
        pendingServerProject.current = data.project;
        onProjectUpdated?.(data.project);
      } catch (toggleError) {
        // Revert optimistic update on error
        pendingServerProject.current = null;
        setLocalProject(null);
        setActiveTaskError(toggleError.message || "Failed to update task");
      }
    },
    [localProject, project, onProjectUpdated, onRefresh]
  );

  const handleDeleteProject = useCallback(async () => {
    if (!displayProject?._id || role !== "admin") return;

    const confirmed = window.confirm(
      `Delete project "${displayProject.title}"? This will remove the project and its activity history.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setActiveTaskError("");

    try {
      const response = await fetch(`/api/projects/${displayProject._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      pendingServerProject.current = null;
      setLocalProject(null);
      onRefresh?.();
    } catch (deleteError) {
      setActiveTaskError(deleteError.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  }, [displayProject, onRefresh, role]);

  return (
    <div className="space-y-6">
      {activeTaskError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">
          {activeTaskError}
        </p>
      ) : null}

      {!displayProject ? (
        <Card className="bg-white text-gray-900 dark:bg-zinc-900/50 dark:text-white border border-gray-200 dark:border-white/10">
          <CardContent className="py-16 text-center text-gray-500 dark:text-white/50">
            Select a project from the list to view its timeline.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white text-gray-900 dark:bg-zinc-900/50 dark:text-white border border-gray-200 dark:border-white/10">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">{displayProject.title}</CardTitle>
              <CardDescription className="max-w-2xl text-sm text-gray-500 dark:text-white/60">
                {displayProject.description || "No description provided."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-600 dark:text-white/70">
              <span className={`rounded-full border px-3 py-1 ${priorityStyles[displayProject.priority] || priorityStyles.medium}`}>
                {displayProject.priority}
              </span>
              <span className={`rounded-full px-3 py-1 ${statusStyles[displayProject.status] || statusStyles.planning}`}>
                {displayProject.status}
              </span>
              <span className="rounded-full border border-gray-300 bg-gray-100 text-gray-700 dark:border-white/20 dark:bg-zinc-900/50 dark:text-white px-3 py-1">
                {displayProject.assignedEmployees?.length || 0} assigned
              </span>
              {role === "admin" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditProject?.(displayProject)}
                    className="rounded-full border border-gray-300 dark:border-white/20 px-3 py-1 text-gray-700 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-zinc-900/50"
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    aria-label="Delete project"
                    title="Delete project"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/70 bg-rose-500/10 text-rose-700 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300"
                  >
                    {isDeleting ? (
                      <span className="text-[10px] font-medium leading-none">...</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Progress" value={`${displayProject.progress}%`} />
              <Metric label="Tasks done" value={`${progressSummary.completed}/${progressSummary.total || 0}`} />
              <Metric label="Deadline" value={formatLongDate(toDate(displayProject.deadline) || new Date())} />
            </div>
            {displayProject?.completedAt ? (
              <div className="mt-3">
                <Metric label="Completed" value={formatLongDate(toDate(displayProject.completedAt) || new Date())} />
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

              {/* ── Gantt timeline bar ── */}
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[1200px] space-y-3">
                  <div
                    className="grid gap-2 border-b border-gray-200 dark:border-white/10 pb-3"
                    style={{ gridTemplateColumns: `repeat(${timeline.days.length}, minmax(${dayWidth}px, ${dayWidth}px))` }}
                  >
                    {timeline.days.map((day) => (
                      <div key={day.toISOString()} className="px-2 text-[10px] uppercase tracking-[0.22em] text-gray-600 dark:text-white/55">
                        <span className="block text-[9px] text-gray-400 dark:text-white/30">
                          {day.toLocaleDateString("en", { weekday: "short" }).toUpperCase()}
                        </span>
                        {formatDay(day)}
                      </div>
                    ))}
                  </div>

                  <div
                    className="relative grid items-start gap-2"
                    style={{ gridTemplateColumns: `repeat(${timeline.days.length}, minmax(${dayWidth}px, ${dayWidth}px))` }}
                  >
                    {/* Today marker */}
                    {todayIndex >= 0 ? (
                      <div
                        className="pointer-events-none absolute top-0 z-20 h-full w-px bg-rose-500 shadow-[0_0_18px_rgba(239,68,68,0.5)]"
                        style={{ left: `calc(${todayIndex} * ${dayWidth}px + ${dayWidth / 2}px)` }}
                      />
                    ) : null}

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[26px] border border-gray-200 dark:border-white/5 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:144px_100%,100%_82px]"
                    />

                    {/* Project bar — spans exactly from start to deadline */}
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32 }}
                      className="relative z-10 overflow-hidden rounded-[24px] border border-gray-300 dark:border-white/15 bg-gray-100 dark:bg-zinc-900/50 shadow-md dark:shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur"
                      style={{
                        gridColumnStart: startOffset + 1,
                        gridColumnEnd: `span ${duration}`,
                        marginTop: "36px",
                        marginBottom: "36px",
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.04),transparent_35%)] dark:bg-transparent" />
                      <div className="relative p-4">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-8 w-1 rounded-full bg-gray-400 dark:bg-gray-500/80" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 dark:text-white">
                              {displayProject.title}
                            </h3>
                            <p className="text-[11px] leading-snug text-gray-600 dark:text-white/60">
                              {formatLongDate(startDate || new Date())} to {formatLongDate(deadlineDate || new Date())}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] uppercase tracking-[0.18em]">
                              <span className={`rounded-full border px-2.5 py-1 ${priorityStyles[displayProject.priority] || priorityStyles.medium}`}>
                                {displayProject.priority}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 ${statusStyles[displayProject.status] || statusStyles.planning}`}>
                                {displayProject.status}
                              </span>
                              <span className="rounded-full border border-gray-300 dark:border-white/20 bg-gray-200 dark:bg-zinc-900/50 text-gray-700 dark:text-white px-2.5 py-1">
                                Task done {progressSummary.completed}/{progressSummary.total || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ── Sidebar: progress + tasks ── */}
              <aside className="space-y-4 rounded-[24px] border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-gray-900 dark:text-white p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">
                    <span>Progress</span>
                    <span>{displayProject.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-900/50">
                    <div
                      className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-300"
                      style={{ width: `${displayProject.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/55">
                    {role === "client"
                      ? "Project Progress till now."
                      : "Task updates from employees and admins appear here as they check off work."}
                  </p>
                </div>

                {role !== "client" ? (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">Tasks</div>
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {(displayProject.tasks || []).map((task) => (
                        <div
                          key={task._id || task.id || task.title}
                          className="space-y-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50 p-3"
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(task.isDone)}
                              disabled={!canEditTasks}
                              onChange={(event) =>
                                toggleItem(displayProject._id, task._id || task.id, null, event.target.checked)
                              }
                              className="mt-1 h-4 w-4 rounded border-gray-400 dark:border-white/30 bg-white dark:bg-zinc-900/50 accent-gray-900 dark:accent-white cursor-pointer"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </span>
                              {task.description ? (
                                <span className="block text-[11px] leading-snug text-gray-500 dark:text-white/55">
                                  {task.description}
                                </span>
                              ) : null}
                            </span>
                          </label>

                          {!!task.subtasks?.length && (
                            <div className="space-y-2 pl-7">
                              {task.subtasks.map((subtask, subtaskIndex) => (
                                <label
                                  key={subtask._id || subtask.id || `${task._id || task.id}-subtask-${subtaskIndex}`}
                                  className="flex items-center gap-3 text-xs text-gray-600 dark:text-white/75 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(subtask.isDone)}
                                    disabled={!canEditTasks}
                                    onChange={(event) =>
                                      toggleItem(
                                        displayProject._id,
                                        task._id || task.id,
                                        subtask._id || subtask.id,
                                        event.target.checked
                                      )
                                    }
                                    className="h-4 w-4 rounded border-gray-400 dark:border-white/30 bg-white dark:bg-zinc-900/50 accent-gray-900 dark:accent-white cursor-pointer"
                                  />
                                  <span className="min-w-0 truncate">{subtask.title}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>

              {/* ── Bottom done row ──
                  ALL day cards are shown.
                  Days AFTER the deadline are dimmed/faded — no done items shown there.
                  Done items are only populated up to and including the deadline day.
              ── */}
              <div className="xl:col-span-2 overflow-x-auto pb-2">
                <div className="min-w-[1200px] space-y-3">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${timeline.days.length}, minmax(${dayWidth}px, ${dayWidth}px))` }}
                  >
                    {timeline.days.map((day) => {
                      const dayKey = formatDayKey(day);
                      const isAfterDeadline =
                        deadlineDate && day > deadlineDate && !isSameDay(day, deadlineDate);
                      const doneItems = dailyDoneMap.get(dayKey) || [];

                      return (
                        <div
                          key={`done-${day.toISOString()}`}
                          className={`min-h-[88px] rounded-xl border p-2 transition-opacity ${
                            isAfterDeadline
                              ? "border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-zinc-900/20 opacity-35 pointer-events-none"
                              : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-white"
                          }`}
                        >
                              <p
                                className={`text-[10px] uppercase tracking-[0.18em] ${
                                  isAfterDeadline
                                    ? "text-gray-300 dark:text-white/20"
                                    : "text-gray-500 dark:text-white/45"
                                }`}
                              >
                                Done {formatDay(day)}{isAfterDeadline ? " (after deadline)" : ""}
                              </p>

                              {doneItems.length ? (
                                <div className="mt-2 space-y-1.5">
                                  {doneItems.map((item, index) => (
                                    <div
                                      key={`${dayKey}-${item.type}-${index}`}
                                      className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-900/50 px-2 py-1 text-[11px] text-gray-700 dark:text-white/80"
                                    >
                                      {item.type === "subtask" ? `${item.parent}: ${item.title}` : item.title}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-[11px] text-gray-400 dark:text-white/35">No task done</p>
                              )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}