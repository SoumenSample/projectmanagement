import { requireAnyRole } from "@/lib/auth"
import SpreadsheetStudio from "@/components/spreadsheets/SpreadsheetStudio"

export const dynamic = "force-dynamic"

export default async function VendorSheetsPage() {
  await requireAnyRole(["vendor", "client", "employee", "admin"])

  return <SpreadsheetStudio />
}