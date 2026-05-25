import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/lib/models/Attendance";
import BusinessSettings from "@/lib/models/BusinessSettings";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attendancePayloadSchema = z.object({
  action: z.enum(["check-in", "check-out"]).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).optional().nullable(),
});

const OFFICE_RADIUS_METERS = 3000;

function buildGeofenceError(message = "Attendance is only allowed within 3km of the office location") {
  return Response.json(
    { error: message },
    { status: 403 }
  );
}

function isValidDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseMonthParam(monthParam) {
  const fallback = new Date();
  const source = typeof monthParam === "string" && /^\d{4}-\d{2}$/.test(monthParam)
    ? `${monthParam}-01T00:00:00.000Z`
    : `${fallback.getUTCFullYear()}-${String(fallback.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;
  const parsed = new Date(source);

  if (Number.isNaN(parsed.getTime())) {
    return parseMonthParam();
  }

  return {
    monthKey: `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`,
    startDateKey: `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-01`,
    endDateKey: new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10),
  };
}

function getDateRangeFromQuery(searchParams) {
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const monthParam = searchParams.get("month");
  const monthRange = parseMonthParam(monthParam || undefined);

  return {
    monthKey: monthRange.monthKey,
    fromDateKey: isValidDateKey(fromParam) ? fromParam : monthRange.startDateKey,
    toDateKey: isValidDateKey(toParam) ? toParam : monthRange.endDateKey,
  };
}

function getAttendanceDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function toPoint(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return {
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
  };
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((value) => typeof value !== "number" || Number.isNaN(value))) {
    return null;
  }

  const earthRadius = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

function evaluatePunchZone({ jobLocation, officeDistanceMeters, homeDistanceMeters, hasHomeLocation }) {
  const officeWithinRadius = typeof officeDistanceMeters === "number" && officeDistanceMeters <= OFFICE_RADIUS_METERS;
  const homeWithinRadius = typeof homeDistanceMeters === "number" && homeDistanceMeters <= OFFICE_RADIUS_METERS;

  if (jobLocation === "remote") {
    if (!hasHomeLocation) {
      return {
        allowed: false,
        matchedLocationType: null,
        officeWithinRadius,
        homeWithinRadius,
        error: "Remote employees must have a home location before attendance can be marked",
      };
    }

    if (officeWithinRadius || homeWithinRadius) {
      if (officeWithinRadius && homeWithinRadius) {
        return {
          allowed: true,
          matchedLocationType: officeDistanceMeters <= homeDistanceMeters ? "office" : "home",
          officeWithinRadius,
          homeWithinRadius,
        };
      }

      return {
        allowed: true,
        matchedLocationType: officeWithinRadius ? "office" : "home",
        officeWithinRadius,
        homeWithinRadius,
      };
    }

    return {
      allowed: false,
      matchedLocationType: "outside",
      officeWithinRadius,
      homeWithinRadius,
      error: "Attendance is only allowed within 3km of the office or the employee home location",
    };
  }

  if (officeWithinRadius) {
    return {
      allowed: true,
      matchedLocationType: "office",
      officeWithinRadius,
      homeWithinRadius: null,
    };
  }

  return {
    allowed: false,
    matchedLocationType: "outside",
    officeWithinRadius,
    homeWithinRadius: null,
    error: "Attendance is only allowed within 3km of the office location",
  };
}

function buildLocationPayload({ latitude, longitude, accuracy }) {
  return {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    capturedAt: new Date(),
  };
}

function serializeUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user === "string") {
    return user;
  }

  return {
    _id: user._id?.toString?.() || user._id || user.id || null,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "",
    jobLocation: user.jobLocation || null,
    homeLatitude: typeof user.homeLatitude === "number" ? user.homeLatitude : null,
    homeLongitude: typeof user.homeLongitude === "number" ? user.homeLongitude : null,
  };
}

function serializeAttendance(attendance) {
  if (!attendance) {
    return null;
  }

  const user = attendance.user;

  return {
    ...attendance,
    _id: attendance._id?.toString?.() || attendance._id,
    user: serializeUser(user),
    userId: user?._id?.toString?.() || user?.toString?.() || user || null,
    checkInAt: attendance.checkInAt ? new Date(attendance.checkInAt).toISOString() : null,
    checkOutAt: attendance.checkOutAt ? new Date(attendance.checkOutAt).toISOString() : null,
    createdAt: attendance.createdAt ? new Date(attendance.createdAt).toISOString() : null,
    updatedAt: attendance.updatedAt ? new Date(attendance.updatedAt).toISOString() : null,
  };
}

async function loadOfficeSettings() {
  const settings = await BusinessSettings.findOne({ scope: "global" }).select("latitude longitude").lean();
  const officeLocation = toPoint(settings);

  return {
    officeLocation,
    officeRadiusMeters: OFFICE_RADIUS_METERS,
  };
}

function buildAttendanceSummary(records = []) {
  const workingDays = new Set();
  let checkIns = 0;
  let checkOuts = 0;

  for (const record of records) {
    if (record?.checkInAt) {
      workingDays.add(record.attendanceDate);
      checkIns += 1;
    }

    if (record?.checkOutAt) {
      checkOuts += 1;
    }
  }

  return {
    totalRecords: records.length,
    workingDays: workingDays.size,
    checkIns,
    checkOuts,
    completedDays: records.filter((record) => record?.checkInAt && record?.checkOutAt).length,
  };
}

async function resolveAdminEmployeeIds(searchTerm) {
  if (!searchTerm) {
    return [];
  }

  const safeSearch = String(searchTerm).trim();
  if (!safeSearch) {
    return [];
  }

  const regex = new RegExp(safeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const employees = await User.find({
    role: "employee",
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id")
    .lean();

  return employees.map((employee) => employee._id);
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.role || !["admin", "employee"].includes(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const todayKey = getAttendanceDateKey();
    const { officeLocation, officeRadiusMeters } = await loadOfficeSettings();

    const { searchParams } = new URL(request.url);
    const { monthKey, fromDateKey, toDateKey } = getDateRangeFromQuery(searchParams);
    const employeeId = searchParams.get("employeeId") || "";
    const statusFilter = searchParams.get("status") || "";
    const searchTerm = searchParams.get("search") || "";

    const query = {
      attendanceDate: {
        $gte: fromDateKey,
        $lte: toDateKey,
      },
    };

    if (session.user.role === "employee") {
      query.user = session.user.id;
    } else {
      if (employeeId) {
        query.user = employeeId;
      } else {
        const resolvedIds = await resolveAdminEmployeeIds(searchTerm);
        if (searchTerm) {
          query.user = { $in: resolvedIds };
        }
      }

      if (statusFilter === "checked-in" || statusFilter === "checked-out") {
        query.status = statusFilter;
      }
    }

    const [todayAttendance, historyAttendance] = await Promise.all([
      Attendance.findOne({ ...query, attendanceDate: todayKey }).populate("user", "name email role jobLocation homeLatitude homeLongitude").lean(),
      Attendance.find(query)
        .sort({ attendanceDate: -1, updatedAt: -1 })
        .populate("user", "name email role jobLocation homeLatitude homeLongitude")
        .lean(),
    ]);

    const recentAttendance = historyAttendance.slice(0, 10);
    const monthlySummary = buildAttendanceSummary(historyAttendance);

    return Response.json({
      attendance: serializeAttendance(todayAttendance),
      history: historyAttendance.map(serializeAttendance),
      recentAttendance: recentAttendance.map(serializeAttendance),
      monthlySummary,
      monthKey,
      officeLocation,
      officeRadiusMeters,
    });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return Response.json({ error: error?.message || "Unable to load attendance" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "employee") {
      return Response.json({ error: "Only employees can mark attendance" }, { status: 403 });
    }

    const payload = await request.json();
    const parsed = attendancePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid attendance payload" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select("role isActive jobLocation homeLatitude homeLongitude").lean();

    if (!user || !user.isActive || user.role !== "employee") {
      return Response.json({ error: "Employee account not found" }, { status: 404 });
    }

    const todayKey = getAttendanceDateKey();
    const now = new Date();
    const { officeLocation, officeRadiusMeters } = await loadOfficeSettings();
    const isRemoteEmployee = user.jobLocation === "remote";
    const hasOfficeLocation =
      officeLocation && officeLocation.latitude !== null && officeLocation.longitude !== null;
    const hasHomeLocation =
      typeof user.homeLatitude === "number" && typeof user.homeLongitude === "number";

    if (isRemoteEmployee && !hasHomeLocation) {
      return buildGeofenceError("Remote employees must have a home location before attendance can be marked");
    }

    if (!hasOfficeLocation && !isRemoteEmployee) {
      return buildGeofenceError();
    }

    const officeDistance = hasOfficeLocation
      ? distanceMeters(
          parsed.data.latitude,
          parsed.data.longitude,
          officeLocation.latitude,
          officeLocation.longitude
        )
      : null;
    const homeDistance = hasHomeLocation
      ? distanceMeters(
          parsed.data.latitude,
          parsed.data.longitude,
          user.homeLatitude,
          user.homeLongitude,
        )
      : null;
    const zoneCheck = evaluatePunchZone({
      jobLocation: user.jobLocation,
      officeDistanceMeters: officeDistance,
      homeDistanceMeters: homeDistance,
      hasHomeLocation,
    });

    if (!zoneCheck.allowed) {
      return buildGeofenceError(zoneCheck.error);
    }

    let attendance = await Attendance.findOne({ user: session.user.id, attendanceDate: todayKey });

    const action =
      parsed.data.action || (attendance?.checkInAt && !attendance?.checkOutAt ? "check-out" : "check-in");

    if (attendance?.checkInAt && attendance?.checkOutAt) {
      return Response.json({ error: "Attendance for today is already completed" }, { status: 409 });
    }

    if (action === "check-in") {
      if (attendance?.checkInAt && !attendance?.checkOutAt) {
        return Response.json({ error: "You have already checked in today" }, { status: 409 });
      }

      if (!attendance) {
        attendance = new Attendance({
          user: session.user.id,
          attendanceDate: todayKey,
          status: "checked-in",
        });
      }

      attendance.status = "checked-in";
      attendance.checkInAt = now;
      attendance.checkInLocation = buildLocationPayload(parsed.data);
      attendance.officeLocation = officeLocation || { latitude: null, longitude: null };
      attendance.officeDistanceMeters = officeDistance;
      attendance.checkInWithinOfficeRadius = zoneCheck.officeWithinRadius;
      attendance.checkInLocationType = zoneCheck.matchedLocationType;
      attendance.checkInHomeDistanceMeters = homeDistance;
      attendance.checkOutAt = null;
      attendance.checkOutLocation = null;
      attendance.checkOutLocationType = null;
      attendance.checkOutHomeDistanceMeters = null;

      await attendance.save();
    } else {
      if (!attendance?.checkInAt) {
        return Response.json({ error: "Check in first before checking out" }, { status: 400 });
      }

      if (attendance.checkOutAt) {
        return Response.json({ error: "You have already checked out today" }, { status: 409 });
      }

      attendance.status = "checked-out";
      attendance.checkOutAt = now;
      attendance.checkOutLocation = buildLocationPayload(parsed.data);
      attendance.officeLocation = officeLocation || { latitude: null, longitude: null };
      attendance.officeDistanceMeters = officeDistance;
      attendance.checkOutWithinOfficeRadius = zoneCheck.officeWithinRadius;
      attendance.checkOutLocationType = zoneCheck.matchedLocationType;
      attendance.checkOutHomeDistanceMeters = homeDistance;

      await attendance.save();
    }

    const savedAttendance = await Attendance.findById(attendance._id).populate("user", "name email role jobLocation homeLatitude homeLongitude").lean();

    return Response.json({
      attendance: serializeAttendance(savedAttendance),
      officeLocation,
      officeRadiusMeters,
      action,
    });
  } catch (error) {
    console.error("Attendance save error:", error);
    return Response.json({ error: error?.message || "Unable to save attendance" }, { status: 500 });
  }
}