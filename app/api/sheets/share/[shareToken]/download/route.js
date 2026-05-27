import { connectToDatabase } from "@/lib/mongodb"
import SpreadsheetDocument from "@/lib/models/SpreadsheetDocument"
import { buildSpreadsheetHtml, sanitizeSpreadsheetFileName } from "@/lib/spreadsheet-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request, { params }) {
  await connectToDatabase()

  const sheet = await SpreadsheetDocument.findOne({ shareToken: params.shareToken, isShared: true }).lean()

  if (!sheet) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  const html = buildSpreadsheetHtml(sheet)
  const fileName = `${sanitizeSpreadsheetFileName(sheet.title)}.xls`

  return new Response(html, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
