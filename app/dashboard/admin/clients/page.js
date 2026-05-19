import { requireRole } from "@/lib/auth";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireRole("admin");

  return <ClientsClient />;
}
