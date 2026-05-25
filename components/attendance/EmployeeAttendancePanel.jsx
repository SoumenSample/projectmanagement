"use client";

import { useEffect, useState } from "react";

function formatTimestamp(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString();
}

function formatDistance(distanceMeters) {
  if (distanceMeters === null || distanceMeters === undefined) return "Not calculated";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function AttendanceLocation({ location }) {
  if (!location) {
    return <span className="text-sm text-muted-foreground">Location not captured</span>;
  }

  return (
    <span className="text-sm text-foreground">
      {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
    </span>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-3 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-950/40">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(error.message || "Unable to fetch location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function EmployeeAttendancePanel() {
  const [attendance, setAttendance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({
    workingDays: 0,
    checkIns: 0,
    checkOuts: 0,
    completedDays: 0,
    totalRecords: 0,
  });
  const [monthKey, setMonthKey] = useState("");
  const [officeLocation, setOfficeLocation] = useState(null);
  const [officeRadiusMeters, setOfficeRadiusMeters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      try {
        const response = await fetch("/api/attendance", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load attendance");
        }

        if (!active) return;

        setAttendance(data.attendance || null);
        setRecentAttendance(Array.isArray(data.recentAttendance) ? data.recentAttendance : []);
        setMonthlySummary(data.monthlySummary || monthlySummary);
        setMonthKey(data.monthKey || "");
        setOfficeLocation(data.officeLocation || null);
        setOfficeRadiusMeters(data.officeRadiusMeters ?? null);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError.message || "Unable to load attendance");
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
  }, []);

  const handleMarkAttendance = async () => {
    setSubmitting(true);
    setError("");

    try {
      const location = await getBrowserLocation();
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save attendance");
      }

      setAttendance(data.attendance || null);
      setMonthlySummary(data.monthlySummary || monthlySummary);
      setMonthKey(data.monthKey || monthKey);
      setOfficeLocation(data.officeLocation || officeLocation);
      setOfficeRadiusMeters(data.officeRadiusMeters ?? officeRadiusMeters);
      setRecentAttendance((current) => {
        const next = [data.attendance, ...current.filter((item) => item?._id !== data.attendance?._id)];
        return next.slice(0, 10);
      });
    } catch (attendanceError) {
      setError(attendanceError.message || "Unable to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckedIn = Boolean(attendance?.checkInAt && !attendance?.checkOutAt);
  const isCheckedOut = Boolean(attendance?.checkOutAt);
  const hasCompletedAttendance = Boolean(attendance?.checkInAt && attendance?.checkOutAt);
  const actionLabel = hasCompletedAttendance ? "Checked Out" : isCheckedIn ? "Check Out" : "Check In";
  const monthLabel = monthKey
    ? new Date(`${monthKey}-01T00:00:00Z`).toLocaleString(undefined, { month: "long", year: "numeric" })
    : "This month";

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/95 p-4 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-900/55">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Attendance</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Capture your live location when you mark attendance.</p>
        </div>

        <button
          type="button"
          onClick={handleMarkAttendance}
          disabled={loading || submitting || hasCompletedAttendance}
          className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Fetching location..." : actionLabel}
        </button>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Working Days"
          value={monthlySummary.workingDays ?? 0}
          hint={`${monthLabel} attendance days`}
        />
        <StatCard label="Check-ins" value={monthlySummary.checkIns ?? 0} hint="Recorded punches for the month" />
        <StatCard label="Completed Days" value={monthlySummary.completedDays ?? 0} hint="Days with both check-in and check-out" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-3 dark:border-zinc-700/70 dark:bg-zinc-950/40">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Today</p>
          <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {loading ? "Loading..." : isCheckedOut ? "Checked out" : isCheckedIn ? "Checked in" : "Not marked yet"}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Check in: {formatTimestamp(attendance?.checkInAt)}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Check out: {formatTimestamp(attendance?.checkOutAt)}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Distance from office: {formatDistance(attendance?.officeDistanceMeters)}</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-3 dark:border-zinc-700/70 dark:bg-zinc-950/40">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Location</p>
          <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">Current attendance coordinates</p>
          <div className="mt-2 space-y-1">
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Check in:</span>{" "}
              <AttendanceLocation location={attendance?.checkInLocation} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Check out:</span>{" "}
              <AttendanceLocation location={attendance?.checkOutLocation} />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Office radius: {officeRadiusMeters === null ? "Not configured" : `${officeRadiusMeters} m`}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Office coordinates:{" "}
              {officeLocation && officeLocation.latitude !== null && officeLocation.longitude !== null
                ? `${Number(officeLocation.latitude).toFixed(6)}, ${Number(officeLocation.longitude).toFixed(6)}`
                : "Not configured"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground">Recent records</h4>
        <div className="mt-2 overflow-hidden rounded-md border border-zinc-500">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Check in</th>
                <th className="px-3 py-2">Check out</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm text-muted-foreground">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((entry) => (
                  <tr key={entry._id} className="border-t">
                    <td className="px-3 py-2 text-foreground">{entry.attendanceDate}</td>
                    <td className="px-3 py-2 text-foreground">{entry.status}</td>
                    <td className="px-3 py-2 text-foreground">{formatTimestamp(entry.checkInAt)}</td>
                    <td className="px-3 py-2 text-foreground">{formatTimestamp(entry.checkOutAt)}</td>
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