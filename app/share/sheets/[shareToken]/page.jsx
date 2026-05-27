import { notFound } from "next/navigation"

import { connectToDatabase } from "@/lib/mongodb"
import SpreadsheetDocument from "@/lib/models/SpreadsheetDocument"
import { getSpreadsheetColumnLabel } from "@/lib/spreadsheet-utils"

export const dynamic = "force-dynamic"

function SheetGrid({ cells }) {
  const rows = Array.isArray(cells) ? cells : []
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
  const columns = Array.from({ length: columnCount }, (_, index) => getSpreadsheetColumnLabel(index))

  return (
    <div className="overflow-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-medium text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">#</th>
            {columns.map((label) => (
              <th key={label} className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-medium text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-950 dark:even:bg-slate-900/50">
              <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-medium text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                {rowIndex + 1}
              </th>
              {Array.from({ length: columnCount }, (_, colIndex) => (
                <td key={colIndex} className="border-b border-slate-200 px-3 py-2 text-slate-900 dark:border-white/10 dark:text-slate-100">
                  <div className="min-h-6 whitespace-pre-wrap break-words">{String(Array.isArray(row) ? row[colIndex] ?? "" : "")}</div>
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

  const sheet = await SpreadsheetDocument.findOne({ shareToken: params.shareToken, isShared: true }).lean()

  if (!sheet) {
    notFound()
  }

  const downloadUrl = `/api/sheets/share/${sheet.shareToken}/download`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/75 sm:p-10">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Shared sheet</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{sheet.title}</h1>
              {sheet.summary ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{sheet.summary}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={downloadUrl}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                Download .xls
              </a>
            </div>
          </div>

          <div className="mt-8">
            <SheetGrid cells={sheet.cells} />
          </div>
        </div>
      </div>
    </main>
  )
}
