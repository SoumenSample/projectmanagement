import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import AttendanceReportPanel from "@/components/attendance/AttendanceReportPanel";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  await requireRole("admin");

  await connectToDatabase();

  const employees = await User.find({ role: "employee" })
    .sort({ name: 1, email: 1 })
    .select("_id name email")
    .lean();

  const serializedEmployees = employees.map((employee) => ({
    _id: employee._id?.toString?.() || employee._id,
    name: employee.name || "",
    email: employee.email || "",
  }));

  return (
    <div className="space-y-6">
      <AttendanceReportPanel employees={serializedEmployees} />
    </div>
  );
}