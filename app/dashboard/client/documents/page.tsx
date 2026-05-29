import { requireAnyRole } from "@/lib/auth"
import DocumentStudio from "@/components/documents/DocumentStudio"

export const dynamic = "force-dynamic"

export default async function ClientDocumentsPage() {
  await requireAnyRole(["client", "employee", "vendor", "admin"])

  return <DocumentStudio />
}