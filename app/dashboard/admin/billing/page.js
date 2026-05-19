import { requireRole } from "@/lib/auth";
import BillingWorkspace from "@/components/billing/BillingWorkspace";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requireRole("admin");

  return <BillingWorkspace mode="admin" />;
}