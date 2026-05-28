export function createEmptySpreadsheetGrid(rows = 12, cols = 8) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""))
}

export function normalizeSpreadsheetGrid(cells, rows = 12, cols = 8) {
  const sourceRows = Array.isArray(cells) ? cells : []
  const rowCount = Math.max(rows, sourceRows.length)
  const colCount = Math.max(
    cols,
    ...sourceRows.map((row) => (Array.isArray(row) ? row.length : 0))
  )

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const sourceRow = Array.isArray(sourceRows[rowIndex]) ? sourceRows[rowIndex] : []

    return Array.from({ length: colCount }, (_, colIndex) => String(sourceRow[colIndex] ?? ""))
  })
}

export function getSpreadsheetColumnLabel(index) {
  let value = index + 1
  let label = ""

  while (value > 0) {
    const remainder = (value - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    value = Math.floor((value - 1) / 26)
  }

  return label
}

export function escapeSpreadsheetHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function sanitizeSpreadsheetFileName(title) {
  return String(title || "sheet")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sheet"
}

export function buildSpreadsheetHtml({ title, summary, cells }) {
  const rows = Array.isArray(cells) ? cells : []
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
  const headers = Array.from({ length: columnCount }, (_, index) => `<th>${getSpreadsheetColumnLabel(index)}</th>`).join("")
  const bodyRows = rows
    .map((row, rowIndex) => {
      const cellsHtml = Array.from({ length: columnCount }, (_, colIndex) => {
        const value = Array.isArray(row) ? row[colIndex] ?? "" : ""
        return `<td>${escapeSpreadsheetHtml(value)}</td>`
      }).join("")

      return `<tr><th>${rowIndex + 1}</th>${cellsHtml}</tr>`
    })
    .join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=utf-8" />
    <title>${escapeSpreadsheetHtml(title || "Untitled Grid")}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 16px; color: #4b5563; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
      thead th { background: #e2e8f0; font-weight: 700; }
      tbody th { background: #f8fafc; width: 54px; }
      td { min-height: 28px; }
    </style>
  </head>
  <body>
    <h1>${escapeSpreadsheetHtml(title || "Untitled Grid")}</h1>
    ${summary ? `<p>${escapeSpreadsheetHtml(summary)}</p>` : ""}
    <table>
      <thead><tr><th>#</th>${headers}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`
}
