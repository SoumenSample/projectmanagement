import { requireAnyRole } from "@/lib/auth"
import DocumentStudio from "@/components/documents/DocumentStudio"

export const dynamic = "force-dynamic"

export default async function EmployeeDocumentsPage() {
  await requireAnyRole(["employee", "client", "vendor", "admin"])

  return <DocumentStudio />
}