"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check, Copy, LoaderCircle, Plus, Save, Share2, Trash2, X,
  ChevronDown, Folder, FileSpreadsheet, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Download, Upload, Undo, Redo,
  Search, Filter, SortAsc, SortDesc, PaintBucket, Type
} from "lucide-react"
import {
  createEmptySpreadsheetGrid,
  getSpreadsheetColumnLabel,
  normalizeSpreadsheetGrid,
  buildSpreadsheetHtml,
  sanitizeSpreadsheetFileName,
} from "@/lib/spreadsheet-utils"

const DEFAULT_ROWS = 20
const DEFAULT_COLS = 10

// ─── Formula Engine ────────────────────────────────────────────────────────────
function evaluateFormula(formula, cells) {
  if (!formula.startsWith("=")) return formula

  const expr = formula.slice(1).trim().toUpperCase()

  // Parse cell ref like A1 → { row, col }
  const parseCellRef = (ref) => {
    const m = ref.match(/^([A-Z]+)(\d+)$/)
    if (!m) return null
    let col = 0
    for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64
    col -= 1
    const row = parseInt(m[2], 10) - 1
    return { row, col }
  }

  // Parse A1:B3 range → flat array of values
  const parseRange = (range) => {
    const [start, end] = range.split(":")
    const s = parseCellRef(start)
    const e = parseCellRef(end)
    if (!s || !e) return []
    const vals = []
    for (let r = s.row; r <= e.row; r++)
      for (let c = s.col; c <= e.col; c++) {
        const raw = cells[r]?.[c] ?? ""
        const v = parseFloat(raw)
        if (!isNaN(v)) vals.push(v)
      }
    return vals
  }

  // Resolve a single token to number
  const resolveNum = (token) => {
    token = token.trim()
    if (/^[A-Z]+\d+$/.test(token)) {
      const ref = parseCellRef(token)
      if (!ref) return NaN
      const raw = cells[ref.row]?.[ref.col] ?? ""
      return parseFloat(raw)
    }
    return parseFloat(token)
  }

  try {
    // SUM(range or list)
    if (/^SUM\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^SUM\((.+)\)$/)[1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return String(nums.reduce((a, b) => a + b, 0))
    }
    // AVERAGE
    if (/^AVERAGE\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^AVERAGE\((.+)\)$/)[1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(nums.reduce((a, b) => a + b, 0) / nums.length) : "0"
    }
    // COUNT
    if (/^COUNT\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^COUNT\((.+)\)$/)[1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return String(nums.length)
    }
    // MAX
    if (/^MAX\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^MAX\((.+)\)$/)[1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(Math.max(...nums)) : ""
    }
    // MIN
    if (/^MIN\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^MIN\((.+)\)$/)[1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(Math.min(...nums)) : ""
    }
    // COUNTA
    if (/^COUNTA\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^COUNTA\((.+)\)$/)[1]
      const [start, end] = inner.split(":")
      const s = parseCellRef(start)
      const e = parseCellRef(end)
      if (!s || !e) return "0"
      let count = 0
      for (let r = s.row; r <= e.row; r++)
        for (let c = s.col; c <= e.col; c++)
          if ((cells[r]?.[c] ?? "") !== "") count++
      return String(count)
    }
    // IF(cond, t, f)
    if (/^IF\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^IF\((.+)\)$/)[1]
      // naive comma split (doesn't handle nested)
      const parts = inner.split(",")
      if (parts.length < 3) return "#ERROR"
      const [condStr, tStr, fStr] = parts
      // evaluate condition: supports = > < >= <=
      const condMatch = condStr.trim().match(/^(.+?)(>=|<=|<>|>|<|=)(.+)$/)
      if (!condMatch) return "#ERROR"
      const lhs = resolveNum(condMatch[1]) || condMatch[1].trim().replace(/"/g, "")
      const op = condMatch[2]
      const rhs = resolveNum(condMatch[3]) || condMatch[3].trim().replace(/"/g, "")
      const lNum = parseFloat(lhs), rNum = parseFloat(rhs)
      let result = false
      if (!isNaN(lNum) && !isNaN(rNum)) {
        if (op === "=") result = lNum === rNum
        else if (op === ">") result = lNum > rNum
        else if (op === "<") result = lNum < rNum
        else if (op === ">=") result = lNum >= rNum
        else if (op === "<=") result = lNum <= rNum
        else if (op === "<>") result = lNum !== rNum
      } else {
        if (op === "=") result = String(lhs) === String(rhs)
        else if (op === "<>") result = String(lhs) !== String(rhs)
      }
      const val = result ? tStr.trim().replace(/"/g, "") : fStr.trim().replace(/"/g, "")
      return val
    }
    // Arithmetic with cell refs: e.g. =A1+B2*3
    const arithmetic = expr.replace(/([A-Z]+\d+)/g, (ref) => {
      const cell = parseCellRef(ref)
      if (!cell) return "0"
      return parseFloat(cells[cell.row]?.[cell.col] ?? "0") || "0"
    })
    // Safe eval of numeric arithmetic only
    if (/^[\d\s+\-*/().]+$/.test(arithmetic)) {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${arithmetic})`)()
      return isFinite(result) ? String(result) : "#DIV/0!"
    }
    return "#ERROR"
  } catch {
    return "#ERROR"
  }
}

// ─── Dropdown Menu ─────────────────────────────────────────────────────────────
function DropdownMenu({ label, items, isOpen, onToggle, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen, onClose])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`rounded px-2 py-0.5 text-xs text-[#202124] transition hover:bg-[#f1f3f4] ${isOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : ""}`}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[200px] rounded-lg border border-[#dadce0] bg-white py-1 shadow-xl">
          {items.map((item, i) =>
            item === "---" ? (
              <div key={i} className="my-1 border-t border-[#e0e0e0]" />
            ) : (
              <button
                key={i}
                onClick={() => { item.action?.(); onClose() }}
                disabled={item.disabled}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-left text-xs text-[#202124] transition hover:bg-[#f1f3f4] disabled:opacity-40"
              >
                {item.icon && <span className="text-[#5f6368]">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && <span className="text-[10px] text-[#9aa0a6]">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Find & Replace Modal ──────────────────────────────────────────────────────
function FindReplaceModal({ cells, onReplace, onClose }) {
  const [find, setFind] = useState("")
  const [replace, setReplace] = useState("")
  const [count, setCount] = useState(0)

  const findCount = () => {
    let n = 0
    cells.forEach((row) => row.forEach((cell) => { if (find && cell.includes(find)) n++ }))
    setCount(n)
  }

  const doReplace = () => {
    onReplace(find, replace)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24">
      <div className="w-full max-w-sm rounded-lg border border-[#dadce0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-medium text-[#202124]">Find and replace</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#5f6368] hover:bg-[#f1f3f4]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs text-[#5f6368]">Find</label>
            <input value={find} onChange={(e) => { setFind(e.target.value); setCount(0) }} className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-sm outline-none focus:border-[#1a73e8]" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#5f6368]">Replace with</label>
            <input value={replace} onChange={(e) => setReplace(e.target.value)} className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-sm outline-none focus:border-[#1a73e8]" />
          </div>
          {count > 0 && <p className="text-xs text-[#5f6368]">{count} instance(s) found</p>}
        </div>
        <div className="flex gap-2 border-t border-[#e0e0e0] px-5 py-3">
          <button onClick={findCount} className="rounded border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#202124] hover:bg-[#f1f3f4]">Find</button>
          <button onClick={doReplace} disabled={!find} className="rounded bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1557b0] disabled:opacity-40">Replace all</button>
          <button onClick={onClose} className="ml-auto rounded px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ shareUrl, onClose, isShared, setIsShared }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-[#dadce0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-6 py-4">
          <h2 className="text-base font-medium text-[#202124]">Share spreadsheet</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#5f6368] transition hover:bg-[#f1f3f4]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-[#dadce0] bg-[#f8f9fa] p-4">
            <p className="text-sm font-medium text-[#202124]">Public link</p>
            <p className="mt-1 text-sm text-[#5f6368]">Anyone with the link can view and download the sheet.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#5f6368]">Share URL</label>
            <div className="flex gap-2">
              <input readOnly value={shareUrl || "Save the sheet first to generate a link"} className="min-w-0 flex-1 rounded border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#202124] outline-none" />
              <button onClick={copy} disabled={!shareUrl} className="inline-flex items-center gap-1.5 rounded bg-[#1a73e8] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1557b0] disabled:opacity-40">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded border border-[#dadce0] px-4 py-3 hover:bg-[#f8f9fa]">
            <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="h-4 w-4 accent-[#1a73e8]" />
            <span className="text-sm text-[#202124]">Allow public access via link</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e0e0e0] px-6 py-4">
          {shareUrl ? <a href={shareUrl} target="_blank" rel="noreferrer" className="rounded px-4 py-2 text-sm font-medium text-[#1a73e8] transition hover:bg-[#e8f0fe]">Open in new tab</a> : null}
          <button onClick={onClose} className="rounded bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1557b0]">Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sheets List Modal ─────────────────────────────────────────────────────────
function SheetsListModal({ sheets, selectedId, loading, onSelect, onClose, onRefresh, onNew }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#dadce0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-base font-medium text-[#202124]">Saved Sheets</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#5f6368] transition hover:bg-[#f1f3f4]"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-[#5f6368]">Loading sheets...</div>
          ) : sheets.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#5f6368]">No sheets yet.</div>
          ) : sheets.map((sheet) => (
            <button key={sheet._id} onClick={() => { onSelect(sheet); onClose() }}
              className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition hover:bg-[#f1f3f4] ${sheet._id === selectedId ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#202124]"}`}>
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#34a853]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{sheet.title}</div>
                <div className="text-xs text-[#5f6368]">{Array.isArray(sheet.cells) ? sheet.cells.length : 0} rows × {Array.isArray(sheet.cells?.[0]) ? sheet.cells[0].length : 0} cols</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-t border-[#e0e0e0] px-5 py-3">
          <button onClick={onRefresh} className="rounded px-3 py-1.5 text-xs font-medium text-[#5f6368] transition hover:bg-[#f1f3f4]">Refresh</button>
          <button onClick={() => { onNew(); onClose() }} className="ml-auto flex items-center gap-1 rounded bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1557b0]">
            <Plus className="h-3 w-3" /> New sheet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cell formatting state ─────────────────────────────────────────────────────
function makeEmptyFormat(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }))
  )
}

function normalizeFmt(fmt, rows, cols) {
  const base = makeEmptyFormat(rows, cols)
  if (!Array.isArray(fmt)) return base
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (fmt[r]?.[c]) base[r][c] = { ...base[r][c], ...fmt[r][c] }
  return base
}

const EMPTY_CELL_FORMAT = { bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SpreadsheetStudio() {
  const [sheets, setSheets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [title, setTitle] = useState("Untitled spreadsheet")
  const [summary, setSummary] = useState("")
  const [cells, setCells] = useState(createEmptySpreadsheetGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [fmt, setFmt] = useState(makeEmptyFormat(DEFAULT_ROWS, DEFAULT_COLS))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const [origin, setOrigin] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSheetsModal, setShowSheetsModal] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [isShared, setIsShared] = useState(true)
  const [selection, setSelection] = useState({ row: 0, col: 0 })
  const [selRange, setSelRange] = useState(null) // {r1,c1,r2,c2}
  const [editingTitle, setEditingTitle] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [history, setHistory] = useState([]) // undo stack
  const [redoStack, setRedoStack] = useState([])
  const [frozenRow, setFrozenRow] = useState(0)
  const [frozenCol, setFrozenCol] = useState(0)
  const [showGridLines, setShowGridLines] = useState(true)
  const [showFormulas, setShowFormulas] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [sortConfig, setSortConfig] = useState(null) // {col, dir}
  const [filterRow, setFilterRow] = useState(null) // row index used as header filter
  const [columnWidths, setColumnWidths] = useState({})

  const selectedIdRef = useRef(null)
  const titleInputRef = useRef(null)
  const dragStart = useRef(null)

  const activeSheet = useMemo(() => sheets.find((s) => s._id === selectedId) || null, [sheets, selectedId])
  const shareUrl = origin && activeSheet?.shareToken ? `${origin}/share/sheets/${activeSheet.shareToken}` : ""
  const selectedCellLabel = `${getSpreadsheetColumnLabel(selection.col)}${selection.row + 1}`
  const selectedCellValue = cells[selection.row]?.[selection.col] ?? ""
  const selectedFmt = fmt[selection.row]?.[selection.col] ?? EMPTY_CELL_FORMAT

  const rows = cells.length
  const cols = cells[0]?.length || 0

  // Computed display values (evaluate formulas)
  const displayCells = useMemo(() => {
    if (showFormulas) return cells
    return cells.map((row) => row.map((cell) => {
      if (cell.startsWith("=")) {
        const v = evaluateFormula(cell, cells)
        return v
      }
      return cell
    }))
  }, [cells, showFormulas])

  // ── History ──
  const pushHistory = useCallback((prevCells) => {
    setHistory((h) => [...h.slice(-49), prevCells])
    setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setRedoStack((r) => [...r, cells])
      setCells(prev)
      return h.slice(0, -1)
    })
  }, [cells])

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r
      const next = r[r.length - 1]
      setHistory((h) => [...h, cells])
      setCells(next)
      return r.slice(0, -1)
    })
  }, [cells])

  // ── Cell update ──
  const updateCell = useCallback((rowIndex, colIndex, value) => {
    setCells((current) => {
      pushHistory(current)
      return current.map((row, r) => r === rowIndex ? row.map((cell, c) => c === colIndex ? value : cell) : row)
    })
  }, [pushHistory])

  const updateSelectedCellFromBar = (value) => {
    setCells((current) => {
      pushHistory(current)
      return current.map((row, r) => r === selection.row ? row.map((cell, c) => c === selection.col ? value : cell) : row)
    })
  }

  // ── Format ──
  const applyFmt = useCallback((patch) => {
    setFmt((f) => {
      const next = f.map((row) => row.map((cell) => ({ ...cell })))
      if (selRange) {
        for (let r = selRange.r1; r <= selRange.r2; r++)
          for (let c = selRange.c1; c <= selRange.c2; c++)
            if (next[r]?.[c]) next[r][c] = { ...next[r][c], ...patch }
      } else {
        if (next[selection.row]?.[selection.col])
          next[selection.row][selection.col] = { ...next[selection.row][selection.col], ...patch }
      }
      return next
    })
  }, [selection, selRange])

  // ── Row/col ops ──
  const addRow = () => {
    pushHistory(cells)
    setCells((c) => {
      const newFmt = [...fmt, Array.from({ length: c[0]?.length || DEFAULT_COLS }, () => ({ bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }))]
      setFmt(newFmt)
      return [...c, Array.from({ length: c[0]?.length || DEFAULT_COLS }, () => "")]
    })
  }
  const addColumn = () => {
    pushHistory(cells)
    setCells((c) => {
      setFmt((f) => f.map((row) => [...row, { bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }]))
      return c.map((row) => [...row, ""])
    })
  }
  const removeRow = () => {
    if (cells.length <= 1) return
    pushHistory(cells)
    setCells((c) => { setFmt((f) => f.slice(0, -1)); return c.slice(0, -1) })
  }
  const removeColumn = () => {
    if ((cells[0]?.length || 0) <= 1) return
    pushHistory(cells)
    setCells((c) => { setFmt((f) => f.map((row) => row.slice(0, -1))); return c.map((row) => row.slice(0, -1)) })
  }

  const insertRowAbove = () => {
    pushHistory(cells)
    const r = selection.row
    setCells((c) => {
      const next = [...c]
      next.splice(r, 0, Array.from({ length: c[0]?.length || DEFAULT_COLS }, () => ""))
      setFmt((f) => { const nf = [...f]; nf.splice(r, 0, Array.from({ length: f[0]?.length || DEFAULT_COLS }, () => ({ bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }))); return nf })
      return next
    })
  }
  const insertRowBelow = () => {
    pushHistory(cells)
    const r = selection.row + 1
    setCells((c) => {
      const next = [...c]
      next.splice(r, 0, Array.from({ length: c[0]?.length || DEFAULT_COLS }, () => ""))
      setFmt((f) => { const nf = [...f]; nf.splice(r, 0, Array.from({ length: f[0]?.length || DEFAULT_COLS }, () => ({ bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }))); return nf })
      return next
    })
  }
  const insertColLeft = () => {
    pushHistory(cells)
    const c = selection.col
    setCells((cells) => cells.map((row) => { const next = [...row]; next.splice(c, 0, ""); return next }))
    setFmt((f) => f.map((row) => { const next = [...row]; next.splice(c, 0, { bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }); return next }))
  }
  const insertColRight = () => {
    pushHistory(cells)
    const c = selection.col + 1
    setCells((cells) => cells.map((row) => { const next = [...row]; next.splice(c, 0, ""); return next }))
    setFmt((f) => f.map((row) => { const next = [...row]; next.splice(c, 0, { bold: false, italic: false, underline: false, align: "left", bg: "", color: "" }); return next }))
  }
  const deleteRow = () => {
    if (cells.length <= 1) return
    pushHistory(cells)
    const r = selection.row
    setCells((c) => { setFmt((f) => f.filter((_, i) => i !== r)); return c.filter((_, i) => i !== r) })
    setSelection((s) => ({ ...s, row: Math.max(0, s.row - 1) }))
  }
  const deleteCol = () => {
    if ((cells[0]?.length || 0) <= 1) return
    pushHistory(cells)
    const col = selection.col
    setCells((c) => { setFmt((f) => f.map((row) => row.filter((_, i) => i !== col))); return c.map((row) => row.filter((_, i) => i !== col)) })
    setSelection((s) => ({ ...s, col: Math.max(0, s.col - 1) }))
  }
  const clearCell = () => {
    pushHistory(cells)
    if (selRange) {
      setCells((c) => c.map((row, r) => row.map((cell, col) => r >= selRange.r1 && r <= selRange.r2 && col >= selRange.c1 && col <= selRange.c2 ? "" : cell)))
    } else {
      updateCell(selection.row, selection.col, "")
    }
  }

  // ── Sort ──
  const sortByCol = (col, dir) => {
    pushHistory(cells)
    setSortConfig({ col, dir })
    setCells((c) => {
      const sorted = [...c].sort((a, b) => {
        const av = parseFloat(a[col]) || a[col] || ""
        const bv = parseFloat(b[col]) || b[col] || ""
        if (av < bv) return dir === "asc" ? -1 : 1
        if (av > bv) return dir === "asc" ? 1 : -1
        return 0
      })
      return sorted
    })
  }

  // ── Find & Replace ──
  const doFindReplace = (find, replace) => {
    pushHistory(cells)
    setCells((c) => c.map((row) => row.map((cell) => cell.includes(find) ? cell.replaceAll(find, replace) : cell)))
  }

  // ── Export ──
  const exportAsCSV = () => {
    const csv = cells.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${sanitizeSpreadsheetFileName(title)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsHTML = () => {
    const html = buildSpreadsheetHtml({ title, summary, cells })
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${sanitizeSpreadsheetFileName(title)}.xls`; a.click()
    URL.revokeObjectURL(url)
  }

  const printSheet = () => {
    const html = buildSpreadsheetHtml({ title, summary, cells })
    const w = window.open("", "_blank")
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ── Load/Save/Delete ──
  const applySheetToEditor = (sheet) => {
    setSelectedId(sheet._id)
    selectedIdRef.current = sheet._id
    setTitle(sheet.title || "Untitled spreadsheet")
    setSummary(sheet.summary || "")
    const c = normalizeSpreadsheetGrid(sheet.cells, DEFAULT_ROWS, DEFAULT_COLS)
    setCells(c)
    setFmt(normalizeFmt(sheet.fmt, c.length, c[0]?.length || DEFAULT_COLS))
    setIsShared(sheet.isShared !== false)
    setMessage(""); setSelection({ row: 0, col: 0 }); setSelRange(null)
    setHistory([]); setRedoStack([])
  }

  const resetDraft = () => {
    setSelectedId(null); selectedIdRef.current = null
    setTitle("Untitled spreadsheet"); setSummary("")
    const c = createEmptySpreadsheetGrid(DEFAULT_ROWS, DEFAULT_COLS)
    setCells(c); setFmt(makeEmptyFormat(DEFAULT_ROWS, DEFAULT_COLS))
    setIsShared(true); setMessage(""); setSelection({ row: 0, col: 0 }); setSelRange(null)
    setHistory([]); setRedoStack([])
  }

  const loadSheets = async () => {
    setLoading(true); setMessage("")
    try {
      const res = await fetch("/api/sheets")
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Failed to load sheets")
      const nextSheets = payload.sheets || []
      setSheets(nextSheets)
      if (nextSheets.length > 0) applySheetToEditor(nextSheets[0])
      else resetDraft()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load sheets")
    } finally { setLoading(false) }
  }

  useEffect(() => { loadSheets(); setOrigin(window.location.origin) }, [])
  useEffect(() => { if (editingTitle && titleInputRef.current) titleInputRef.current.focus() }, [editingTitle])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo() }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveSheet() }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") { e.preventDefault(); setShowFindReplace(true) }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); applyFmt({ bold: !selectedFmt.bold }) }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); applyFmt({ italic: !selectedFmt.italic }) }
      if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); applyFmt({ underline: !selectedFmt.underline }) }
      // Arrow navigation
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "ArrowUp") { e.preventDefault(); setSelection((s) => ({ ...s, row: Math.max(0, s.row - 1) })); setSelRange(null) }
        if (e.key === "ArrowDown") { e.preventDefault(); setSelection((s) => ({ ...s, row: Math.min(rows - 1, s.row + 1) })); setSelRange(null) }
        if (e.key === "ArrowLeft") { e.preventDefault(); setSelection((s) => ({ ...s, col: Math.max(0, s.col - 1) })); setSelRange(null) }
        if (e.key === "ArrowRight") { e.preventDefault(); setSelection((s) => ({ ...s, col: Math.min(cols - 1, s.col + 1) })); setSelRange(null) }
        if (e.key === "Tab") { e.preventDefault(); setSelection((s) => ({ ...s, col: Math.min(cols - 1, s.col + 1) })); setSelRange(null) }
        if (e.key === "Enter") { e.preventDefault(); setSelection((s) => ({ ...s, row: Math.min(rows - 1, s.row + 1) })); setSelRange(null) }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = document.activeElement
        if (active?.tagName !== "INPUT" && active?.tagName !== "TEXTAREA") clearCell()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, rows, cols, selection, selectedFmt, applyFmt])

  const saveSheet = async () => {
    setSaving(true); setMessage("")
    try {
      const payload = { title, summary, cells, fmt, isShared }
      const res = await fetch(selectedId ? `/api/sheets/${selectedId}` : "/api/sheets", {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || "Failed to save sheet")
      const saved = result.sheet
      setSheets((current) => {
        const index = current.findIndex((s) => s._id === saved._id)
        if (index === -1) return [saved, ...current]
        const next = [...current]; next[index] = saved; return next
      })
      setSelectedId(saved._id); selectedIdRef.current = saved._id
      setTitle(saved.title || "Untitled spreadsheet")
      setSummary(saved.summary || ""); setIsShared(saved.isShared !== false)
      setMessage("Saved"); setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save sheet")
    } finally { setSaving(false) }
  }

  const deleteSheet = async () => {
    if (!selectedId) return
    if (!window.confirm("Delete this sheet permanently?")) return
    setDeleting(true); setMessage("")
    try {
      const res = await fetch(`/api/sheets/${selectedId}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || "Failed to delete sheet")
      resetDraft(); setMessage("Deleted"); setTimeout(() => setMessage(""), 2000)
      await loadSheets()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete sheet")
    } finally { setDeleting(false) }
  }

  const createNewSheet = () => { resetDraft(); setMessage("New sheet ready."); setTimeout(() => setMessage(""), 2000) }

  // ── Menu definitions ────────────────────────────────────────────────────────
  const menuItems = {
    File: [
      { label: "New spreadsheet", icon: <Plus className="h-3.5 w-3.5" />, action: createNewSheet, shortcut: "Ctrl+N" },
      { label: "Save", icon: <Save className="h-3.5 w-3.5" />, action: saveSheet, shortcut: "Ctrl+S" },
      "---",
      { label: "Export as CSV", icon: <Download className="h-3.5 w-3.5" />, action: exportAsCSV },
      { label: "Export as Excel (HTML)", icon: <Download className="h-3.5 w-3.5" />, action: exportAsHTML },
      "---",
      { label: "Print", icon: <Download className="h-3.5 w-3.5" />, action: printSheet, shortcut: "Ctrl+P" },
      "---",
      { label: "Delete sheet", icon: <Trash2 className="h-3.5 w-3.5" />, action: deleteSheet, disabled: !selectedId },
    ],
    Edit: [
      { label: "Undo", icon: <Undo className="h-3.5 w-3.5" />, action: undo, shortcut: "Ctrl+Z", disabled: !history.length },
      { label: "Redo", icon: <Redo className="h-3.5 w-3.5" />, action: redo, shortcut: "Ctrl+Y", disabled: !redoStack.length },
      "---",
      { label: "Clear cell(s)", action: clearCell },
      { label: "Insert row above", action: insertRowAbove },
      { label: "Insert row below", action: insertRowBelow },
      { label: "Insert column left", action: insertColLeft },
      { label: "Insert column right", action: insertColRight },
      { label: "Delete row", action: deleteRow },
      { label: "Delete column", action: deleteCol },
      "---",
      { label: "Find and replace…", icon: <Search className="h-3.5 w-3.5" />, action: () => setShowFindReplace(true), shortcut: "Ctrl+H" },
    ],
    View: [
      { label: showGridLines ? "✓ Show gridlines" : "Show gridlines", action: () => setShowGridLines((v) => !v) },
      { label: showFormulas ? "✓ Show formulas" : "Show formulas", action: () => setShowFormulas((v) => !v) },
      "---",
      { label: "Freeze first row", action: () => setFrozenRow((v) => v === 1 ? 0 : 1) },
      { label: "Freeze first column", action: () => setFrozenCol((v) => v === 1 ? 0 : 1) },
      "---",
      { label: "Zoom in (10%)", action: () => setZoom((z) => Math.min(z + 10, 200)) },
      { label: "Zoom out (10%)", action: () => setZoom((z) => Math.max(z - 10, 50)) },
      { label: "Reset zoom (100%)", action: () => setZoom(100) },
    ],
    Insert: [
      { label: "Row above", icon: <Plus className="h-3.5 w-3.5" />, action: insertRowAbove },
      { label: "Row below", icon: <Plus className="h-3.5 w-3.5" />, action: insertRowBelow },
      { label: "Column left", icon: <Plus className="h-3.5 w-3.5" />, action: insertColLeft },
      { label: "Column right", icon: <Plus className="h-3.5 w-3.5" />, action: insertColRight },
      "---",
      { label: "Add row at end", action: addRow },
      { label: "Add column at end", action: addColumn },
    ],
    Format: [
      { label: selectedFmt.bold ? "✓ Bold" : "Bold", icon: <Bold className="h-3.5 w-3.5" />, action: () => applyFmt({ bold: !selectedFmt.bold }), shortcut: "Ctrl+B" },
      { label: selectedFmt.italic ? "✓ Italic" : "Italic", icon: <Italic className="h-3.5 w-3.5" />, action: () => applyFmt({ italic: !selectedFmt.italic }), shortcut: "Ctrl+I" },
      { label: selectedFmt.underline ? "✓ Underline" : "Underline", icon: <Underline className="h-3.5 w-3.5" />, action: () => applyFmt({ underline: !selectedFmt.underline }), shortcut: "Ctrl+U" },
      "---",
      { label: "Align left", icon: <AlignLeft className="h-3.5 w-3.5" />, action: () => applyFmt({ align: "left" }) },
      { label: "Align center", icon: <AlignCenter className="h-3.5 w-3.5" />, action: () => applyFmt({ align: "center" }) },
      { label: "Align right", icon: <AlignRight className="h-3.5 w-3.5" />, action: () => applyFmt({ align: "right" }) },
      "---",
      { label: "Cell background: Yellow", icon: <PaintBucket className="h-3.5 w-3.5" />, action: () => applyFmt({ bg: "#fff9c4" }) },
      { label: "Cell background: Green", icon: <PaintBucket className="h-3.5 w-3.5" />, action: () => applyFmt({ bg: "#e8f5e9" }) },
      { label: "Cell background: Red", icon: <PaintBucket className="h-3.5 w-3.5" />, action: () => applyFmt({ bg: "#fce8e6" }) },
      { label: "Cell background: Blue", icon: <PaintBucket className="h-3.5 w-3.5" />, action: () => applyFmt({ bg: "#e8f0fe" }) },
      { label: "Clear background", icon: <PaintBucket className="h-3.5 w-3.5" />, action: () => applyFmt({ bg: "" }) },
      "---",
      { label: "Text color: Red", icon: <Type className="h-3.5 w-3.5" />, action: () => applyFmt({ color: "#d93025" }) },
      { label: "Text color: Blue", icon: <Type className="h-3.5 w-3.5" />, action: () => applyFmt({ color: "#1a73e8" }) },
      { label: "Text color: Green", icon: <Type className="h-3.5 w-3.5" />, action: () => applyFmt({ color: "#34a853" }) },
      { label: "Clear text color", icon: <Type className="h-3.5 w-3.5" />, action: () => applyFmt({ color: "" }) },
    ],
    Data: [
      { label: "Sort A → Z (current col)", icon: <SortAsc className="h-3.5 w-3.5" />, action: () => sortByCol(selection.col, "asc") },
      { label: "Sort Z → A (current col)", icon: <SortDesc className="h-3.5 w-3.5" />, action: () => sortByCol(selection.col, "desc") },
      "---",
      { label: filterRow !== null ? "✓ Toggle filter row off" : "Use row 1 as filter header", icon: <Filter className="h-3.5 w-3.5" />, action: () => setFilterRow((v) => v === null ? 0 : null) },
    ],
    Tools: [
      { label: "Find and replace…", icon: <Search className="h-3.5 w-3.5" />, action: () => setShowFindReplace(true), shortcut: "Ctrl+H" },
      "---",
      { label: "Remove row at end", action: removeRow },
      { label: "Remove column at end", action: removeColumn },
    ],
    Extensions: [
      { label: "My Sheets…", icon: <Folder className="h-3.5 w-3.5" />, action: () => setShowSheetsModal(true) },
    ],
    Help: [
      { label: "Keyboard shortcuts", action: () => alert("Ctrl+Z Undo · Ctrl+Y Redo · Ctrl+S Save · Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+H Find&Replace · Arrow keys navigate · Tab/Enter move cell") },
      { label: "Supported formulas", action: () => alert("=SUM(A1:C3)  =AVERAGE(A1:A10)  =COUNT(A1:A10)  =COUNTA(A1:A10)  =MAX(A1:A10)  =MIN(A1:A10)  =IF(A1>0,\"yes\",\"no\")  Arithmetic: =A1+B2*3") },
    ],
  }

  // ── Drag selection ──────────────────────────────────────────────────────────
  const onCellMouseDown = (r, c, e) => {
    if (e.shiftKey) {
      setSelRange({ r1: Math.min(selection.row, r), c1: Math.min(selection.col, c), r2: Math.max(selection.row, r), c2: Math.max(selection.col, c) })
    } else {
      setSelection({ row: r, col: c })
      setSelRange(null)
      dragStart.current = { row: r, col: c }
    }
  }
  const onCellMouseEnter = (r, c) => {
    if (dragStart.current) {
      setSelRange({
        r1: Math.min(dragStart.current.row, r),
        c1: Math.min(dragStart.current.col, c),
        r2: Math.max(dragStart.current.row, r),
        c2: Math.max(dragStart.current.col, c),
      })
    }
  }
  const onMouseUp = () => { dragStart.current = null }

  const isCellInRange = (r, c) => selRange ? r >= selRange.r1 && r <= selRange.r2 && c >= selRange.c1 && c <= selRange.c2 : false

  // ── Column resize ──────────────────────────────────────────────────────────
  const resizeDrag = useRef(null)
  const onResizeMouseDown = (colIndex, e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = columnWidths[colIndex] || 100
    resizeDrag.current = { colIndex, startX, startWidth }
    const onMove = (me) => {
      const diff = me.clientX - resizeDrag.current.startX
      setColumnWidths((w) => ({ ...w, [resizeDrag.current.colIndex]: Math.max(40, resizeDrag.current.startWidth + diff) }))
    }
    const onUp = () => {
      resizeDrag.current = null
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // ── Formula bar ─────────────────────────────────────────────────────────────
  const formulaBarRef = useRef(null)
  useEffect(() => {
    if (formulaBarRef.current) formulaBarRef.current.value = selectedCellValue
  }, [selection, selectedCellValue])

  const colTemplate = `46px ${Array.from({ length: cols }, (_, i) => `${columnWidths[i] || 100}px`).join(" ")}`

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white text-[#202124] select-none"
      style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif", fontSize: `${zoom}%` }}
      onMouseUp={onMouseUp}
    >
      {/* ── Title bar ── */}
      <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-1.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#34a853" />
            <rect x="6" y="7" width="12" height="1.5" rx="0.75" fill="white" />
            <rect x="6" y="11" width="12" height="1.5" rx="0.75" fill="white" />
            <rect x="6" y="15" width="8" height="1.5" rx="0.75" fill="white" />
          </svg>
        </div>

        <div className="flex flex-col min-w-0">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingTitle(false) }}
              className="rounded border border-[#1a73e8] px-2 py-0.5 text-sm font-medium text-[#202124] outline-none ring-1 ring-[#1a73e8] w-56"
            />
          ) : (
            <span onClick={() => setEditingTitle(true)} className="cursor-text rounded px-2 py-0.5 text-sm font-medium text-[#202124] hover:bg-[#f1f3f4] truncate max-w-[240px]">
              {title}
            </span>
          )}

          {/* Menu bar */}
          <div className="flex items-center gap-0.5 px-1">
            {Object.entries(menuItems).map(([label, items]) => (
              <DropdownMenu
                key={label}
                label={label}
                items={items}
                isOpen={openMenu === label}
                onToggle={() => setOpenMenu((m) => m === label ? null : label)}
                onClose={() => setOpenMenu(null)}
              />
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {message ? <span className="text-xs text-[#5f6368]">{message}</span> : null}
        {saving ? <span className="flex items-center gap-1 text-xs text-[#5f6368]"><LoaderCircle className="h-3 w-3 animate-spin" /> Saving…</span> : null}

        <button onClick={() => setShowSheetsModal(true)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-[#5f6368] transition hover:bg-[#f1f3f4]">
          <Folder className="h-4 w-4" />
          <span className="hidden sm:inline">My Sheets</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#1557b0]">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-t border-[#e0e0e0] bg-[#f8f9fa] px-2 py-0.5 flex-wrap">
        {/* Undo/Redo */}
        <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30">
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30">
          <Redo className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Save */}
        <button onClick={saveSheet} disabled={saving} title="Save (Ctrl+S)" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed] disabled:opacity-40">
          {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Bold / Italic / Underline */}
        <button onClick={() => applyFmt({ bold: !selectedFmt.bold })} title="Bold (Ctrl+B)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.bold ? "bg-[#e8eaed]" : ""}`}>
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => applyFmt({ italic: !selectedFmt.italic })} title="Italic (Ctrl+I)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.italic ? "bg-[#e8eaed]" : ""}`}>
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => applyFmt({ underline: !selectedFmt.underline })} title="Underline (Ctrl+U)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.underline ? "bg-[#e8eaed]" : ""}`}>
          <Underline className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Align */}
        <button onClick={() => applyFmt({ align: "left" })} title="Align left" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "left" ? "bg-[#e8eaed]" : ""}`}>
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => applyFmt({ align: "center" })} title="Align center" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "center" ? "bg-[#e8eaed]" : ""}`}>
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => applyFmt({ align: "right" })} title="Align right" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "right" ? "bg-[#e8eaed]" : ""}`}>
          <AlignRight className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Background color swatches */}
        <div className="flex items-center gap-0.5">
          {["#fff9c4", "#e8f5e9", "#fce8e6", "#e8f0fe", "#fce4ec", ""].map((bg) => (
            <button key={bg || "clear"} onClick={() => applyFmt({ bg })} title={bg || "Clear bg"} className="h-5 w-5 rounded border border-[#dadce0] hover:scale-110 transition-transform"
              style={{ background: bg || "#fff", backgroundImage: bg ? undefined : "linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)" }} />
          ))}
        </div>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Sort buttons */}
        <button onClick={() => sortByCol(selection.col, "asc")} title="Sort A→Z" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed]">
          <SortAsc className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => sortByCol(selection.col, "desc")} title="Sort Z→A" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed]">
          <SortDesc className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-[#dadce0]" />

        {/* Row/col quick buttons */}
        <button onClick={insertRowAbove} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Row↑</button>
        <button onClick={insertRowBelow} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Row↓</button>
        <button onClick={insertColLeft} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Col←</button>
        <button onClick={insertColRight} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Col→</button>
        <button onClick={deleteRow} className="rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6]">−Row</button>
        <button onClick={deleteCol} className="rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6]">−Col</button>

        <div className="flex-1" />

        {/* Delete sheet */}
        <button onClick={deleteSheet} disabled={!selectedId || deleting} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6] disabled:opacity-40">
          {deleting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      </div>

      {/* ── Formula bar ── */}
      <div className="flex shrink-0 items-center border-b border-[#e0e0e0] bg-white">
        <div className="flex w-[80px] shrink-0 items-center justify-center border-r border-[#e0e0e0] py-1.5 text-xs font-medium text-[#202124]">
          {selectedCellLabel}
        </div>
        <div className="flex w-8 shrink-0 items-center justify-center border-r border-[#e0e0e0] py-1.5 text-xs italic text-[#5f6368]">fx</div>
        <input
          ref={formulaBarRef}
          defaultValue={selectedCellValue}
          onKeyDown={(e) => { if (e.key === "Enter") { updateSelectedCellFromBar(e.currentTarget.value); e.currentTarget.blur() } }}
          onBlur={(e) => updateSelectedCellFromBar(e.currentTarget.value)}
          className="flex-1 bg-white px-3 py-1.5 text-sm text-[#202124] outline-none select-text"
        />
      </div>

      {/* ── Grid ── */}
      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <div
          className="inline-grid"
          style={{ gridTemplateColumns: colTemplate }}
        >
          {/* Corner */}
          <div className="sticky left-0 top-0 z-30 border-b border-r border-[#e0e0e0] bg-[#f8f9fa]" style={{ minHeight: 24 }} />

          {/* Column headers */}
          {cells[0]?.map((_, colIndex) => {
            const isActive = selection.col === colIndex
            const isInRange = selRange ? colIndex >= selRange.c1 && colIndex <= selRange.c2 : false
            const w = columnWidths[colIndex] || 100
            return (
              <div
                key={colIndex}
                className={`sticky top-0 z-20 flex items-center justify-center border-b border-r border-[#e0e0e0] text-xs font-medium cursor-pointer select-none relative group ${isActive || isInRange ? "bg-[#e2edff] text-[#1a73e8]" : "bg-[#f8f9fa] text-[#444746] hover:bg-[#e8eaed]"}`}
                style={{ minHeight: 24 }}
                onClick={() => { setSelection((s) => ({ ...s, col: colIndex })); setSelRange({ r1: 0, c1: colIndex, r2: rows - 1, c2: colIndex }) }}
              >
                {getSpreadsheetColumnLabel(colIndex)}
                {/* resize handle */}
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#1a73e8] z-10"
                  onMouseDown={(e) => onResizeMouseDown(colIndex, e)}
                />
              </div>
            )
          })}

          {/* Rows */}
          {cells.map((row, rowIndex) => {
            const isRowActive = selection.row === rowIndex
            const isRowInRange = selRange ? rowIndex >= selRange.r1 && rowIndex <= selRange.r2 : false
            return (
              <Fragment key={`row-${rowIndex}`}>
                {/* Row number */}
                <div
                  className={`sticky left-0 z-10 flex items-center justify-center border-b border-r border-[#e0e0e0] text-xs font-medium cursor-pointer select-none ${isRowActive || isRowInRange ? "bg-[#e2edff] text-[#1a73e8]" : "bg-[#f8f9fa] text-[#444746] hover:bg-[#e8eaed]"}`}
                  style={{ minHeight: 22 }}
                  onClick={() => { setSelection((s) => ({ ...s, row: rowIndex })); setSelRange({ r1: rowIndex, c1: 0, r2: rowIndex, c2: cols - 1 }) }}
                >
                  {rowIndex + 1}
                </div>

                {/* Data cells */}
                {row.map((cell, colIndex) => {
                  const isSelected = selection.row === rowIndex && selection.col === colIndex
                  const inRange = isCellInRange(rowIndex, colIndex)
                  const cellFmt = fmt[rowIndex]?.[colIndex] || EMPTY_CELL_FORMAT
                  const displayVal = displayCells[rowIndex]?.[colIndex] ?? ""
                  const isError = displayVal.startsWith("#") && displayVal.endsWith("!")

                  const borderStyle = showGridLines ? "border-b border-r border-[#e0e0e0]" : "border-b border-r border-transparent"

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`relative ${borderStyle} ${isSelected ? "z-10 ring-2 ring-inset ring-[#1a73e8]" : ""} ${inRange && !isSelected ? "bg-[#e8f0fe]/60" : ""}`}
                      style={{
                        minHeight: 22,
                        background: isSelected ? undefined : inRange ? undefined : (cellFmt.bg || undefined),
                      }}
                      onMouseDown={(e) => onCellMouseDown(rowIndex, colIndex, e)}
                      onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
                    >
                      <input
                        value={showFormulas ? cell : displayVal}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onFocus={() => { setSelection({ row: rowIndex, col: colIndex }); setSelRange(null) }}
                        className="h-full w-full bg-transparent px-1.5 py-0 text-xs outline-none select-text"
                        style={{
                          minHeight: 22,
                          fontWeight: cellFmt.bold ? "bold" : undefined,
                          fontStyle: cellFmt.italic ? "italic" : undefined,
                          textDecoration: cellFmt.underline ? "underline" : undefined,
                          textAlign: (cellFmt.align || "left") as "left" | "center" | "right" | "justify",
                          color: isError ? "#d93025" : (cellFmt.color || undefined),
                          background: isSelected ? (cellFmt.bg || "transparent") : (inRange ? "#e8f0fe40" : (cellFmt.bg || "transparent")),
                          caretColor: "#1a73e8",
                        }}
                      />
                    </div>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Sheet tabs ── */}
      <div className="flex shrink-0 items-center gap-0 border-t border-[#e0e0e0] bg-[#f8f9fa] px-2" style={{ minHeight: 32 }}>
        <button onClick={createNewSheet} className="rounded p-1 text-[#5f6368] transition hover:bg-[#e8eaed]" title="New sheet">
          <Plus className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-[#dadce0]" />
        <div className="flex items-end gap-0 overflow-x-auto">
          {sheets.length === 0 ? (
            <div className="flex items-center gap-1.5 border-b-2 border-[#1a73e8] bg-white px-4 py-1 text-xs font-medium text-[#202124]">
              <FileSpreadsheet className="h-3 w-3 text-[#34a853]" />
              {title || "Untitled spreadsheet"}
            </div>
          ) : sheets.map((sheet) => (
            <button
              key={sheet._id}
              onClick={() => applySheetToEditor(sheet)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-1 text-xs font-medium transition ${sheet._id === selectedId ? "border-[#1a73e8] bg-white text-[#202124]" : "border-transparent text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124]"}`}
            >
              <FileSpreadsheet className="h-3 w-3 text-[#34a853]" />
              {sheet.title}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center pr-1">
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Sheet description…"
            className="rounded border border-transparent bg-transparent px-2 py-1 text-xs text-[#5f6368] outline-none placeholder:text-[#bdc1c6] focus:border-[#dadce0] focus:bg-white select-text"
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {showShareModal ? <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} isShared={isShared} setIsShared={setIsShared} /> : null}
      {showSheetsModal ? <SheetsListModal sheets={sheets} selectedId={selectedId} loading={loading} onSelect={applySheetToEditor} onClose={() => setShowSheetsModal(false)} onRefresh={loadSheets} onNew={createNewSheet} /> : null}
      {showFindReplace ? <FindReplaceModal cells={cells} onReplace={doFindReplace} onClose={() => setShowFindReplace(false)} /> : null}
    </div>
  )
}