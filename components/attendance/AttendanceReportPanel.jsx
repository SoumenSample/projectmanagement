"use client";

import { useEffect, useState } from "react";

function defaultMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDateKey(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-4 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-950/40">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export default function AttendanceReportPanel({ employees = [] }) {
  const [filters, setFilters] = useState({
    month: defaultMonthKey(),
    employeeId: "",
    status: "",
    from: "",
    to: "",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    month: defaultMonthKey(),
    employeeId: "",
    status: "",
    from: "",
    to: "",
    search: "",
  });
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    workingDays: 0,
    checkIns: 0,
    checkOuts: 0,
    completedDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value) {
            params.set(key, value);
          }
        });

        const response = await fetch(`/api/attendance?${params.toString()}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load attendance report");
        }

        if (!active) return;

        setRecords(Array.isArray(data.history) ? data.history : Array.isArray(data.recentAttendance) ? data.recentAttendance : []);
        setSummary(data.monthlySummary || {
          totalRecords: 0,
          workingDays: 0,
          checkIns: 0,
          checkOuts: 0,
          completedDays: 0,
        });
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Unable to load attendance report");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      active = false;
    };
  }, [appliedFilters]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const nextFilters = {
      month: defaultMonthKey(),
      employeeId: "",
      status: "",
      from: "",
      to: "",
      search: "",
    };

    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/95 p-4 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-900/55">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Attendance Report</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Filter attendance history by employee, month, date range, and status.</p>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Showing history for the current filter set.</div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <SummaryCard label="Records" value={summary.totalRecords ?? 0} hint="Matching entries" />
          <SummaryCard label="Working Days" value={summary.workingDays ?? 0} hint="Unique check-in days" />
          <SummaryCard label="Check-ins" value={summary.checkIns ?? 0} hint="Punches in " />
          <SummaryCard label="Check-outs" value={summary.checkOuts ?? 0} hint="Punches out " />
          <SummaryCard label="Completed" value={summary.completedDays ?? 0} hint="Check-in plus check-out" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 lg:grid-cols-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            Month
            <input
              type="month"
              value={filters.month}
              onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            Employee
            <select
              value={filters.employeeId}
              onChange={(event) => setFilters((current) => ({ ...current, employeeId: event.target.value }))}
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name || employee.email}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            Status
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            >
              <option value="">All statuses</option>
              <option value="checked-in">Checked in</option>
              <option value="checked-out">Checked out</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            Search
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Employee name or email"
              className="rounded-md border border-zinc-300/80 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-cyan-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
            />
          </label>

          <div className="flex items-end gap-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-zinc-300/80 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/95 p-4 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-900/55">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">History</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Latest matching attendance records</p>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100/80 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/60 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Check In</th>
                <th className="px-3 py-2">Check Out</th>
                <th className="px-3 py-2">Office Distance</th>
                <th className="px-3 py-2">Office Match</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                    Loading attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-t border-zinc-200/70 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">{formatDateKey(record.attendanceDate)}</td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">
                      <div className="font-medium">{record.user?.name || "Unknown employee"}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{record.user?.email || "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">{record.status || "-"}</td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">{formatDateTime(record.checkInAt)}</td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">{formatDateTime(record.checkOutAt)}</td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">
                      {record.officeDistanceMeters === null || record.officeDistanceMeters === undefined
                        ? "-"
                        : `${record.officeDistanceMeters} m`}
                    </td>
                    <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">
                      {record.checkInWithinOfficeRadius === true || record.checkOutWithinOfficeRadius === true
                        ? "Within"
                        : record.checkInWithinOfficeRadius === false || record.checkOutWithinOfficeRadius === false
                          ? "Outside"
                          : "-"}
                    </td>
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