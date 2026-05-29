import { requireAnyRole } from "@/lib/auth"
import SpreadsheetStudio from "@/components/spreadsheets/SpreadsheetStudio"

export const dynamic = "force-dynamic"

export default async function ClientSheetsPage() {
  await requireAnyRole(["client", "employee", "vendor", "admin"])

  return <SpreadsheetStudio />
}