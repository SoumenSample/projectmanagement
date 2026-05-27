import { requireRole } from "@/lib/auth"
import DocumentStudio from "@/components/documents/DocumentStudio"

export const dynamic = "force-dynamic"

export default async function AdminDocumentsPage() {
  await requireRole("admin")

  return <DocumentStudio />
}
