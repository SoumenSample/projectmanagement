import { requireAnyRole } from "@/lib/auth"
import SpreadsheetStudio from "@/components/spreadsheets/SpreadsheetStudio"

export const dynamic = "force-dynamic"

export default async function EmployeeSheetsPage() {
  await requireAnyRole(["employee", "client", "vendor", "admin"])

  return <SpreadsheetStudio />
}