import { requireRole } from "@/lib/auth";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireRole("admin");

  return <LeadsClient />;
}
