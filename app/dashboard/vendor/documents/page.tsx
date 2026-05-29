import { requireAnyRole } from "@/lib/auth"
import DocumentStudio from "@/components/documents/DocumentStudio"

export const dynamic = "force-dynamic"

export default async function VendorDocumentsPage() {
  await requireAnyRole(["vendor", "client", "employee", "admin"])

  return <DocumentStudio />
}