import { requireRole } from "@/lib/auth";
import EmployeeAttendancePanel from "@/components/attendance/EmployeeAttendancePanel";

export const dynamic = "force-dynamic";

export default async function EmployeeAttendancePage() {
  await requireRole("employee");

  return (
    <div className="space-y-6">
      <EmployeeAttendancePanel />
    </div>
  );
}