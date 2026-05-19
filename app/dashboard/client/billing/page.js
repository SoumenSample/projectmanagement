import { requireRole } from "@/lib/auth";
import BillingWorkspace from "@/components/billing/BillingWorkspace";

export const dynamic = "force-dynamic";

export default async function ClientBillingPage() {
  await requireRole("client");

  return <BillingWorkspace mode="client" />;
}