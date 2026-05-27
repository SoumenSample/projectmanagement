import { requireRole } from "@/lib/auth"
import SpreadsheetStudio from "@/components/spreadsheets/SpreadsheetStudio"

export const dynamic = "force-dynamic"

export default async function AdminSheetsPage() {
  await requireRole("admin")

  return <SpreadsheetStudio />
}
