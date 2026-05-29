import { notFound } from "next/navigation"

import { connectToDatabase } from "@/lib/mongodb"
import SpreadsheetDocument from "@/lib/models/SpreadsheetDocument"
import { getSpreadsheetColumnLabel } from "@/lib/spreadsheet-utils"
import SpreadsheetStudio from "@/components/spreadsheets/SpreadsheetStudio"

export const dynamic = "force-dynamic"

function SheetGrid({ cells }) {
  const rows = Array.isArray(cells) ? cells : []
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
  const columns = Array.from({ length: columnCount }, (_, index) => getSpreadsheetColumnLabel(index))

  return (
    <div className="overflow-auto">
      <table
        style={{
          minWidth: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8125rem",
          fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
        }}
      >
        <thead>
          <tr>
            {/* Row number header cell */}
            <th
              style={{
                position: "sticky",
                left: 0,
                zIndex: 20,
                width: 40,
                minWidth: 40,
                padding: "6px 12px",
                textAlign: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: "#94a3b8",
                background: "#f1f5f9",
                borderBottom: "2px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              #
            </th>
            {columns.map((label) => (
              <th
                key={label}
                style={{
                  padding: "6px 16px",
                  textAlign: "left",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#475569",
                  background: "#f1f5f9",
                  borderBottom: "2px solid #334155",
                  borderRight: "1px solid #e2e8f0",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
            {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "sheet-row even" : "sheet-row odd"}
              style={{
                transition: "background 0.1s",
              }}
            >
              {/* Row number */}
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  width: 40,
                  minWidth: 40,
                  padding: "7px 12px",
                  textAlign: "center",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 400,
                  color: "#94a3b8",
                  background: rowIndex % 2 === 0 ? "#f8fafc" : "#f1f5f9",
                  borderBottom: "1px solid #e2e8f0",
                  borderRight: "1px solid #cbd5e1",
                }}
              >
                {rowIndex + 1}
              </th>

              {Array.from({ length: columnCount }, (_, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    padding: "7px 16px",
                    borderBottom: "1px solid #e2e8f0",
                    borderRight: "1px solid #e2e8f0",
                    color: "#1e293b",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      minHeight: 20,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.5,
                    }}
                  >
                    {String(Array.isArray(row) ? row[colIndex] ?? "" : "")}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function SharedSheetPage({ params }) {
  await connectToDatabase()

  const sheet = await SpreadsheetDocument.findOne({
    shareToken: params.shareToken,
    isShared: true,
  }).lean()

  if (!sheet) {
    notFound()
  }

  const downloadUrl = `/api/sheets/share/${sheet.shareToken}/download`
  const rowCount = Array.isArray(sheet.cells) ? sheet.cells.length : 0
  const colCount = Array.isArray(sheet.cells)
    ? sheet.cells.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
    : 0

  const sharedDate = sheet.updatedAt
    ? new Date(sheet.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const sheetData = JSON.parse(JSON.stringify(sheet))

  return (
    <SpreadsheetStudio initialSheet={sheetData} readOnly={true} />
  )
}