"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const COL_LABEL_W = 220;
const DAY_W = 34;

const STATUS_META = {
  completed: {
    label: "Completed",
    bar: "from-emerald-500 to-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40",
    solid: "#10b981",
  },
  "in-progress": {
    label: "In Progress",
    bar: "from-sky-500 to-sky-400",
    pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/40",
    solid: "#0ea5e9",
  },
  "at-risk": {
    label: "At Risk",
    bar: "from-rose-500 to-amber-400",
    pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700/40",
    solid: "#f43f5e",
  },
  planning: {
    label: "Planning",
    bar: "from-violet-500 to-indigo-400",
    pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/40",
    solid: "#8b5cf6",
  },
  paused: {
    label: "Paused",
    bar: "from-gray-400 to-gray-300",
    pill: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10",
    solid: "#9ca3af",
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildTimeline(projects = []) {
  const today = new Date();
  const parsed = projects.map((project, index) => {
    const startDate = toDate(project?.startDate || project?.createdAt) || addDays(today, index * 3);
    const deadlineDate = toDate(project?.deadline) || addDays(startDate, 10);
    return { project, startDate, deadlineDate };
  });

  if (!parsed.length) {
    const days = Array.from({ length: 28 }, (_, index) => addDays(today, index - 4));
    return { start: days[0], days, rows: [], todayIndex: 4 };
  }

  const earliest = parsed.reduce((current, item) => (item.startDate < current ? item.startDate : current), parsed[0].startDate);
  const latest = parsed.reduce((current, item) => (item.deadlineDate > current ? item.deadlineDate : current), parsed[0].deadlineDate);
  const start = addDays(earliest, -3);
  const end = addDays(latest, 4);
  const span = Math.max(21, Math.ceil((end.getTime() - start.getTime()) / 864e5) + 1);
  const days = Array.from({ length: span }, (_, index) => addDays(start, index));
  const todayIndex = days.findIndex((day) => isSameDay(day, today));

  return {
    start,
    days,
    todayIndex,
    rows: parsed.map(({ project, startDate, deadlineDate }) => {
      const startOffset = clamp(Math.round((startDate.getTime() - start.getTime()) / 864e5), 0, days.length - 1);
      const endOffset = clamp(Math.round((deadlineDate.getTime() - start.getTime()) / 864e5), startOffset, days.length - 1);
      const duration = endOffset - startOffset + 1;
      return { project, startDate, deadlineDate, startOffset, endOffset, duration };
    }),
  };
}

function buildMonthGroups(days) {
  const groups = [];
  days.forEach((day, index) => {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({ key, label: fmtMonth(day), count: 1, startIdx: index });
    } else {
      groups[groups.length - 1].count++;
    }
  });
  return groups;
}

function GanttTooltip({ project, startDate, deadlineDate, meta, progress, pointerX, pointerY }) {
  const TOOLTIP_W = 220;
  const TOOLTIP_H = 102;
  const GAP = 12;

  if (typeof document === "undefined" || pointerX == null || pointerY == null) return null;

  const showBelow = pointerY < TOOLTIP_H + GAP + 16;
  const top = showBelow ? pointerY + GAP : pointerY - TOOLTIP_H - GAP;
  const left = clamp(pointerX - TOOLTIP_W / 2, 8, window.innerWidth - TOOLTIP_W - 8);
  const arrowLeft = clamp(pointerX - left - 6, 12, TOOLTIP_W - 24);

  return createPortal(
    <div className="fixed pointer-events-none" style={{ top, left, width: TOOLTIP_W, zIndex: 100000 }}>
      <div className="relative rounded-xl shadow-2xl px-4 py-3 bg-zinc-950 border border-white/10 backdrop-blur-md">
        {showBelow ? (
          <div className="absolute -top-1.5 w-3 h-3 rotate-45 bg-zinc-950 border-t border-l border-white/10" style={{ left: arrowLeft }} />
        ) : (
          <div className="absolute -bottom-1.5 w-3 h-3 rotate-45 bg-zinc-950 border-b border-r border-white/10" style={{ left: arrowLeft }} />
        )}

        <p className="text-[13px] font-bold text-white leading-tight mb-2 truncate">{project.title}</p>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[11px] text-gray-400">{fmtShort(startDate)} - {fmtShort(deadlineDate)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full overflow-hidden h-1.5 bg-white/10">
            <div className={`h-full rounded-full bg-linear-to-r ${meta.bar}`} style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: meta.solid }}>{progress}%</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ProjectGanttOverview({ projects = [], selectedProjectId, onSelectProject }) {
  const [hoverInfo, setHoverInfo] = useState({ id: null, pointerX: null, pointerY: null });

  const timeline = useMemo(() => buildTimeline(projects), [projects]);
  const monthGroups = useMemo(() => buildMonthGroups(timeline.days), [timeline.days]);
  const gridWidth = COL_LABEL_W + timeline.days.length * DAY_W;

  if (!projects.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Gantt Timeline</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Project durations from start date to deadline</p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <div className="relative" style={{ minWidth: gridWidth }}>
          <div className="flex sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/10" style={{ minWidth: gridWidth }}>
            <div className="sticky left-0 z-30 shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-white/10" style={{ width: COL_LABEL_W }} />
            {monthGroups.map((group) => (
              <div key={group.key} className="flex items-center px-2 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-white/10 last:border-r-0" style={{ width: group.count * DAY_W }}>
                {group.label}
              </div>
            ))}
          </div>

          <div className="flex sticky top-7.25 z-20 bg-gray-50 dark:bg-zinc-950/60 border-b border-gray-100 dark:border-white/10" style={{ minWidth: gridWidth }}>
            <div className="sticky left-0 z-30 shrink-0 bg-gray-50 dark:bg-zinc-950/60 border-r border-gray-100 dark:border-white/10" style={{ width: COL_LABEL_W }} />
            {timeline.days.map((day) => (
              <div key={day.toISOString()} style={{ width: DAY_W }} className="shrink-0 flex flex-col items-center justify-center py-1.5 text-center border-r border-gray-100 dark:border-white/10 last:border-r-0">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-gray-300 dark:text-gray-700">{new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(day)}</span>
                <span className="text-[11px] font-bold mt-0.5 text-gray-400 dark:text-gray-600">{fmtDay(day)}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {timeline.rows.map(({ project, startDate, deadlineDate, startOffset, duration }) => {
              const id = String(project._id || project.id);
              const isSelected = id === String(selectedProjectId);
              const isHovered = hoverInfo.id === id;
              const meta = getMeta(project.status);
              const progress = clamp(project.progress || 0, 0, 100);
              const barWidth = Math.max(duration * DAY_W - 8, 8);

                return (
                  <div key={id} role="button" tabIndex={0} onClick={() => onSelectProject?.(id)} onKeyDown={(e) => e.key === "Enter" && onSelectProject?.(id)} className={`relative flex items-center cursor-pointer transition-colors duration-150 ${isSelected ? "bg-gray-50 dark:bg-white/6" : isHovered ? "bg-gray-50/70 dark:bg-white/3" : "bg-white dark:bg-zinc-900"}`} style={{ minWidth: gridWidth }}>
                  <div className={`sticky left-0 z-20 shrink-0 flex items-center gap-3 px-4 py-3 border-r border-gray-100 dark:border-white/10 ${isSelected ? "bg-gray-50 dark:bg-white/6" : isHovered ? "bg-gray-50/70 dark:bg-white/3" : "bg-white dark:bg-zinc-900"}`} style={{ width: COL_LABEL_W }}>
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.solid }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">{project.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{fmtShort(startDate)} → {fmtShort(deadlineDate)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.pill}`}>{meta.label}</span>
                  </div>

                  <div className="relative flex items-center" style={{ height: 56 }}>
                    {timeline.days.map((day) => (
                      <div key={day.toISOString()} style={{ width: DAY_W, height: 56 }} className="shrink-0 border-r border-gray-50 dark:border-white/3 last:border-r-0" />
                    ))}

                    {timeline.todayIndex >= 0 && (
                      <div className="absolute top-0 bottom-0 w-px bg-amber-400/70 dark:bg-amber-400/50 pointer-events-none z-10" style={{ left: timeline.todayIndex * DAY_W + DAY_W / 2 }} />
                    )}

                    <div className="absolute top-1/2 -translate-y-1/2 z-10 pointer-events-auto" style={{ left: startOffset * DAY_W + 4, width: barWidth }} onMouseEnter={(e) => {
                      setHoverInfo({ id, pointerX: e.clientX, pointerY: e.clientY });
                    }} onMouseMove={(e) => {
                      setHoverInfo({ id, pointerX: e.clientX, pointerY: e.clientY });
                    }} onMouseLeave={() => setHoverInfo((cur) => (cur.id === id ? { id: null, pointerX: null, pointerY: null } : cur))}>
                      <div className="relative h-6 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 shadow-inner">
                        <div className={`absolute left-0 top-0 h-full rounded-full bg-linear-to-r ${meta.bar} transition-all duration-500`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {timeline.todayIndex >= 0 && (
            <div className="absolute top-0 bottom-0 pointer-events-none z-0" style={{ left: COL_LABEL_W + timeline.todayIndex * DAY_W, width: DAY_W }}>
              <div className="w-full h-full bg-amber-400/4 dark:bg-amber-400/6" />
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium">{projects.length} project{projects.length !== 1 ? "s" : ""} · hover bars to see progress</p>
        <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="text-[10px] text-gray-400 dark:text-gray-600">Today</span></div>
      </div>

      {hoverInfo.id != null && hoverInfo.pointerX != null && hoverInfo.pointerY != null ? (() => {
        const row = timeline.rows.find((item) => String(item.project._id || item.project.id) === hoverInfo.id);
        if (!row) return null;
        const meta = getMeta(row.project.status);
        const progress = clamp(row.project.progress || 0, 0, 100);
        return (
          <GanttTooltip
            project={row.project}
            startDate={row.startDate}
            deadlineDate={row.deadlineDate}
            meta={meta}
            progress={progress}
            pointerX={hoverInfo.pointerX}
            pointerY={hoverInfo.pointerY}
          />
        );
      })() : null}
    </div>
  );
}

export default ProjectGanttOverview;

