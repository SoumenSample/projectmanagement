"use client"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check, Copy, FileText, LoaderCircle, Plus, Save, Share2, Trash2, X,
  ChevronDown, Folder, FileSpreadsheet, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Download, Undo, Redo,
  Search, Filter, SortAsc, SortDesc, PaintBucket, Type, ChevronUp
} from "lucide-react"
import {
  createEmptySpreadsheetGrid,
  getSpreadsheetColumnLabel,
  normalizeSpreadsheetGrid,
  buildSpreadsheetHtml,
  sanitizeSpreadsheetFileName,
} from "@/lib/spreadsheet-utils"

const DEFAULT_ROWS = 200
const DEFAULT_COLS = 100

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
]

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"]

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#444746" },
  { label: "Gray", value: "#9aa0a6" },
  { label: "Red", value: "#d93025" },
  { label: "Orange", value: "#e8710a" },
  { label: "Yellow", value: "#f9ab00" },
  { label: "Green", value: "#34a853" },
  { label: "Blue", value: "#1a73e8" },
  { label: "Purple", value: "#a142f4" },
]

// ─── Formula Engine ────────────────────────────────────────────────────────────
function evaluateFormula(formula: string, cells: string[][]): string {
  if (!formula.startsWith("=")) return formula
  const rawExpr = formula.slice(1).trim()
  if (!rawExpr) return ""
  if (/[+\-*/(,]$/.test(rawExpr)) return ""
  const openParens = (rawExpr.match(/\(/g) || []).length
  const closeParens = (rawExpr.match(/\)/g) || []).length
  if (openParens > closeParens) return ""
  const expr = rawExpr.toUpperCase()

  const parseCellRef = (ref: string) => {
    const m = ref.match(/^([A-Z]+)(\d+)$/)
    if (!m) return null
    let col = 0
    for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64
    col -= 1
    const row = parseInt(m[2], 10) - 1
    return { row, col }
  }

  const parseRange = (range: string) => {
    const [start, end] = range.split(":")
    const s = parseCellRef(start)
    const e = parseCellRef(end)
    if (!s || !e) return []
    const vals: number[] = []
    for (let r = s.row; r <= e.row; r++)
      for (let c = s.col; c <= e.col; c++) {
        const v = parseFloat(cells[r]?.[c] ?? "")
        if (!isNaN(v)) vals.push(v)
      }
    return vals
  }

  const resolveNum = (token: string) => {
    token = token.trim()
    if (/^[A-Z]+\d+$/.test(token)) {
      const ref = parseCellRef(token)
      if (!ref) return NaN
      return parseFloat(cells[ref.row]?.[ref.col] ?? "")
    }
    return parseFloat(token)
  }

  try {
    if (/^SUM\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^SUM\((.+)\)$/)![1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return String(nums.reduce((a, b) => a + b, 0))
    }
    if (/^AVERAGE\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^AVERAGE\((.+)\)$/)![1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(nums.reduce((a, b) => a + b, 0) / nums.length) : "0"
    }
    if (/^COUNT\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^COUNT\((.+)\)$/)![1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return String(nums.length)
    }
    if (/^MAX\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^MAX\((.+)\)$/)![1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(Math.max(...nums)) : ""
    }
    if (/^MIN\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^MIN\((.+)\)$/)![1]
      const nums = inner.includes(":") ? parseRange(inner) : inner.split(",").map(resolveNum).filter((n) => !isNaN(n))
      return nums.length ? String(Math.min(...nums)) : ""
    }
    if (/^COUNTA\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^COUNTA\((.+)\)$/)![1]
      const [start, end] = inner.split(":")
      const s = parseCellRef(start), e = parseCellRef(end)
      if (!s || !e) return "0"
      let count = 0
      for (let r = s.row; r <= e.row; r++)
        for (let c = s.col; c <= e.col; c++)
          if ((cells[r]?.[c] ?? "") !== "") count++
      return String(count)
    }
    if (/^IF\((.+)\)$/.test(expr)) {
      const inner = expr.match(/^IF\((.+)\)$/)![1]
      const parts = inner.split(",")
      if (parts.length < 3) return "#ERROR!"
      const [condStr, tStr, fStr] = parts
      const condMatch = condStr.trim().match(/^(.+?)(>=|<=|<>|>|<|=)(.+)$/)
      if (!condMatch) return "#ERROR!"
      const lhs = resolveNum(condMatch[1]) || condMatch[1].trim().replace(/"/g, "")
      const op = condMatch[2]
      const rhs = resolveNum(condMatch[3]) || condMatch[3].trim().replace(/"/g, "")
      const lNum = parseFloat(String(lhs)), rNum = parseFloat(String(rhs))
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
      return result ? tStr.trim().replace(/"/g, "") : fStr.trim().replace(/"/g, "")
    }
    const arithmetic = expr.replace(/([A-Z]+\d+)/g, (ref) => {
      const cell = parseCellRef(ref)
      if (!cell) return "0"
      const value = parseFloat(cells[cell.row]?.[cell.col] ?? "0")
      return Number.isFinite(value) ? String(value) : "0"
    })
    if (/^[\d\s+\-*/().]+$/.test(arithmetic)) {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${arithmetic})`)()
      return isFinite(result) ? String(result) : "#DIV/0!"
    }
    return "#ERROR!"
  } catch { return "#ERROR!" }
}

// ─── Dropdown Menu ─────────────────────────────────────────────────────────────
function DropdownMenu({ label, items, isOpen, onToggle, onClose }: {
  label: string; items: any[]; isOpen: boolean; onToggle: () => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen, onClose])

  return (
    <div ref={ref} className="relative">
      <button onClick={onToggle} className={`rounded px-2 py-0.5 text-xs text-[#202124] transition hover:bg-[#f1f3f4] ${isOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : ""}`}>
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[200px] rounded-lg border border-[#dadce0] bg-white py-1 shadow-xl">
          {items.map((item, i) =>
            item === "---" ? <div key={i} className="my-1 border-t border-[#e0e0e0]" /> : (
              <button key={i} onClick={() => { item.action?.(); onClose() }} disabled={item.disabled}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-left text-xs text-[#202124] transition hover:bg-[#f1f3f4] disabled:opacity-40">
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

// ─── Small inline select for toolbar ──────────────────────────────────────────
function ToolbarSelect({ value, onChange, options, width = "w-28", title }: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; width?: string; title?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      className={`${width} rounded border border-[#dadce0] bg-white px-1.5 py-0.5 text-xs text-[#202124] outline-none hover:border-[#bdc1c6] focus:border-[#1a73e8] cursor-pointer`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── Font size stepper ─────────────────────────────────────────────────────────
function FontSizeStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const sizes = FONT_SIZES
  const idx = sizes.indexOf(value)
  const dec = () => { if (idx > 0) onChange(sizes[idx - 1]) }
  const inc = () => { if (idx < sizes.length - 1) onChange(sizes[idx + 1]) }
  return (
    <div className="flex items-center rounded border border-[#dadce0] bg-white overflow-hidden">
      <button onClick={dec} disabled={idx <= 0} className="px-1 py-0.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30 text-xs">
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      <input
        type="text"
        value={value || "11"}
        onChange={(e) => { if (/^\d{0,2}$/.test(e.target.value)) onChange(e.target.value) }}
        onBlur={(e) => {
          const n = parseInt(e.target.value)
          if (!isNaN(n) && n > 0) onChange(String(Math.min(200, Math.max(6, n))))
          else onChange("11")
        }}
        className="w-8 border-x border-[#dadce0] bg-white px-1 py-0.5 text-center text-xs text-[#202124] outline-none"
      />
      <button onClick={inc} disabled={idx >= sizes.length - 1} className="px-1 py-0.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30 text-xs">
        <ChevronUp className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}

// ─── Color picker swatch button ────────────────────────────────────────────────
function ColorSwatchPicker({ value, onChange, colors, title }: {
  value: string; onChange: (v: string) => void; colors: { label: string; value: string }[]; title?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={title}
        className="flex items-center gap-1 rounded border border-[#dadce0] bg-white px-2 py-1 hover:bg-[#e8eaed]"
      >
        <span
          className="inline-block h-4 w-4 rounded-sm border border-[#dadce0]"
          style={{ background: value || "#000000" }}
        />
        <ChevronDown className="h-3 w-3 text-[#5f6368]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-[#dadce0] bg-white p-3 shadow-xl">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#5f6368]">{title}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {colors.map((c) => (
              <button
                key={c.value || "default"}
                onClick={() => { onChange(c.value); setOpen(false) }}
                title={c.label}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition hover:bg-[#f1f3f4] ${value === c.value ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-[#dadce0] bg-white"}`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-sm border border-[#dadce0]"
                  style={{ background: c.value || "#000000" }}
                />
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#202124]">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Find & Replace Modal ──────────────────────────────────────────────────────
function FindReplaceModal({ cells, onReplace, onClose }: {
  cells: string[][]; onReplace: (f: string, r: string) => void; onClose: () => void
}) {
  const [find, setFind] = useState("")
  const [replace, setReplace] = useState("")
  const [count, setCount] = useState(0)
  const findCount = () => {
    let n = 0; cells.forEach((row) => row.forEach((cell) => { if (find && cell.includes(find)) n++ })); setCount(n)
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
          <button onClick={() => { onReplace(find, replace); onClose() }} disabled={!find} className="rounded bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1557b0] disabled:opacity-40">Replace all</button>
          <button onClick={onClose} className="ml-auto rounded px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ shareUrl, onClose, isShared, setIsShared, assignedTo, setAssignedTo, onAssignUpdated }: {
  shareUrl: string; onClose: () => void; isShared: boolean; setIsShared: (v: boolean) => void; assignedTo: string[]; setAssignedTo: (v: string[]) => void; onAssignUpdated?: (newAssigned: string[]) => Promise<void> | void
}) {
  const [copied, setCopied] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedAssignee, setSelectedAssignee] = useState("")
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/users/simple')
        const p = await res.json()
        if (!res.ok) throw new Error(p?.error || 'Failed to load users')
        if (mounted) setUsers(p.users || [])
      } catch {
        if (mounted) setUsers([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const copy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-zinc-600" />
            <span className="text-[15px] font-semibold text-zinc-900">Share Sheet</span>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-zinc-100"><X className="h-4 w-4 text-zinc-500" /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <FileText className="h-8 w-8 shrink-0 text-zinc-600" />
            <div>
              <p className="text-[13px] font-medium text-zinc-900">Sheet link</p>
              <p className="text-[12px] text-zinc-500">Anyone with the link can view this sheet</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-zinc-600">Share Link</label>
            <div className="flex gap-2">
              <input readOnly value={shareUrl || "Save the sheet first to generate a link"}
                className="flex-1 rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-[13px] text-zinc-700 focus:outline-none" />
              <button onClick={copy} disabled={!shareUrl}
                className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-700 px-3 py-2 text-[13px] text-white hover:bg-zinc-600 disabled:opacity-40">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-zinc-600">Assign To</label>
            <div className="flex gap-2">
              <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)} className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-700">
                <option value="">Choose user...</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} — {u.role}</option>
                ))}
              </select>
              <button type="button" onClick={async () => {
                if (!selectedAssignee) return
                if (assignedTo.includes(selectedAssignee)) { setSelectedAssignee(""); return }
                const newAssigned = [...assignedTo, selectedAssignee]
                setAssignedTo(newAssigned)
                setSelectedAssignee("")
                if (typeof onAssignUpdated === "function") await onAssignUpdated(newAssigned)
              }} className="rounded bg-[#217346] px-3 py-2 text-[13px] text-white hover:bg-[#1a5e38]">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {assignedTo.map(aid => {
                const u = users.find(x => x._id === aid)
                return (
                  <div key={aid} className="flex items-center gap-2 rounded bg-zinc-100 px-2 py-1 text-[13px] text-zinc-800">
                    <span>{u ? `${u.name} — ${u.role}` : aid}</span>
                    <button type="button" onClick={async () => {
                      const newAssigned = assignedTo.filter(x => x !== aid)
                      setAssignedTo(newAssigned)
                      if (typeof onAssignUpdated === "function") await onAssignUpdated(newAssigned)
                    }} className="rounded px-1 text-sm text-red-600">×</button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
            <input id="share-toggle" type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="h-4 w-4 cursor-pointer accent-zinc-700" />
            <label htmlFor="share-toggle" className="cursor-pointer text-[13px] text-zinc-700">Allow public access via link</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          {shareUrl && <a href={shareUrl} target="_blank" rel="noreferrer"><button className="rounded border border-zinc-300 bg-white px-4 py-2 text-[13px] text-zinc-700 hover:bg-zinc-100">Open in new tab</button></a>}
          <button onClick={onClose} className="rounded bg-zinc-800 px-5 py-2 text-[13px] font-medium text-white hover:bg-zinc-700">Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sheets List Modal ─────────────────────────────────────────────────────────
function SheetsListModal({ sheets, selectedId, loading, onSelect, onClose, onRefresh, onNew }: {
  sheets: any[]; selectedId: string | null; loading: boolean; onSelect: (s: any) => void; onClose: () => void; onRefresh: () => void; onNew: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#dadce0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-base font-medium text-[#202124]">Saved Sheets</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? <div className="px-5 py-8 text-center text-sm text-[#5f6368]">Loading sheets...</div>
            : sheets.length === 0 ? <div className="px-5 py-8 text-center text-sm text-[#5f6368]">No sheets yet.</div>
              : sheets.map((sheet) => (
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
          <button onClick={onRefresh} className="rounded px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Refresh</button>
          <button onClick={() => { onNew(); onClose() }} className="ml-auto flex items-center gap-1 rounded bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1557b0]">
            <Plus className="h-3 w-3" /> New sheet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cell formatting type ──────────────────────────────────────────────────────
type CellFmt = {
  bold: boolean; italic: boolean; underline: boolean
  align: string; bg: string; color: string
  fontSize: string; fontFamily: string
}

const EMPTY_CELL_FORMAT: CellFmt = {
  bold: false, italic: false, underline: false,
  align: "left", bg: "", color: "",
  fontSize: "", fontFamily: "",
}

function makeEmptyFormat(rows: number, cols: number): CellFmt[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ ...EMPTY_CELL_FORMAT })))
}

function normalizeFmt(fmt: any, rows: number, cols: number): CellFmt[][] {
  const base = makeEmptyFormat(rows, cols)
  if (!Array.isArray(fmt)) return base
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (fmt[r]?.[c]) base[r][c] = { ...EMPTY_CELL_FORMAT, ...fmt[r][c] }
  return base
}

const FORMULA_SUGGESTIONS = [
  { name: "SUM", example: "=SUM(A1:A3)", description: "Add values" },
  { name: "AVERAGE", example: "=AVERAGE(A1:A3)", description: "Average values" },
  { name: "COUNT", example: "=COUNT(A1:A3)", description: "Count numbers" },
  { name: "MAX", example: "=MAX(A1:A3)", description: "Largest value" },
  { name: "MIN", example: "=MIN(A1:A3)", description: "Smallest value" },
  { name: "COUNTA", example: "=COUNTA(A1:A3)", description: "Count non-empty cells" },
  { name: "IF", example: '=IF(A1>0,"yes","no")', description: "Conditional result" },
]

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SpreadsheetStudio({ initialSheet = null, readOnly = false }) {
  const isReadOnly = !!readOnly
  const [sheets, setSheets] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState("Untitled Grids")
  const [summary, setSummary] = useState("")
  const [cells, setCells] = useState<string[][]>(createEmptySpreadsheetGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [fmt, setFmt] = useState<CellFmt[][]>(makeEmptyFormat(DEFAULT_ROWS, DEFAULT_COLS))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const [origin, setOrigin] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSheetsModal, setShowSheetsModal] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [isShared, setIsShared] = useState(true)
  const [assignedTo, setAssignedTo] = useState([])
  const [selection, setSelection] = useState({ row: 0, col: 0 })
  const [selRange, setSelRange] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [history, setHistory] = useState<string[][][]>([])
  const [redoStack, setRedoStack] = useState<string[][][]>([])
  const [showGridLines, setShowGridLines] = useState(true)
  const [showFormulas, setShowFormulas] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [filterRow, setFilterRow] = useState<number | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({})

  // ── Draft editing state ────────────────────────────────────────────────────
  const [editDraft, setEditDraft] = useState("")
  const editingCellRef = useRef<{ row: number; col: number } | null>(null)
  const editDraftRef = useRef<string>("")

  // keep editDraftRef in sync with editDraft state
  useEffect(() => { editDraftRef.current = editDraft }, [editDraft])

  // ── Formula bar state ──────────────────────────────────────────────────────
  const [formulaBarActive, setFormulaBarActive] = useState(false)
  const [formulaBarDraft, setFormulaBarDraft] = useState("")

  const selectedIdRef = useRef<string | null>(null)
  const originalAssignedRef = useRef<string[]>([])
  const titleInputRef = useRef<HTMLInputElement>(null)
  const dragStart = useRef<{ row: number; col: number } | null>(null)

  // ── Use a ref for saveSheet to avoid stale closure in keyboard handler ─────
  // FIX #1: saveSheet captured stale state in the keyboard useEffect because it
  // wasn't listed as a dependency. Using a ref that's kept current avoids this.
  const saveSheetRef = useRef<() => Promise<void>>(async () => {})

  const activeSheet = useMemo(() => sheets.find((s) => s._id === selectedId) || null, [sheets, selectedId])
  const shareUrl = origin && activeSheet?.shareToken ? `${origin}/share/sheets/${activeSheet.shareToken}` : ""
  const selectedCellLabel = `${getSpreadsheetColumnLabel(selection.col)}${selection.row + 1}`
  const selectedCellRawValue = cells[selection.row]?.[selection.col] ?? ""
  const selectedFmt = fmt[selection.row]?.[selection.col] ?? EMPTY_CELL_FORMAT

  const rows = cells.length
  // FIX #2: Guard against cols being 0 when cells[0] is undefined
  const cols = cells[0]?.length || DEFAULT_COLS

  // ── Active draft for formula suggestions ───────────────────────────────────
  // FIX #3: Show live editDraft in formula bar while typing in a cell
  const activeDraftValue = editingCellRef.current ? editDraft : formulaBarActive ? formulaBarDraft : ""

  const formulaSuggestions = useMemo(() => {
    const input = activeDraftValue.trim()
    if (!input.startsWith("=")) return []
    const rawExpr = input.slice(1).trim().toUpperCase()
    if (rawExpr.includes("(")) return []
    const prefix = rawExpr.match(/^[A-Z]*/)?.[0] || ""
    return FORMULA_SUGGESTIONS.filter((item) => item.name.startsWith(prefix))
  }, [activeDraftValue])

  const showSuggestions = (editingCellRef.current !== null || formulaBarActive) && formulaSuggestions.length > 0

  // ── Evaluated display values ───────────────────────────────────────────────
  const displayCells = useMemo(() => {
    if (showFormulas) return cells
    return cells.map((row) => row.map((cell) => cell.startsWith("=") ? evaluateFormula(cell, cells) : cell))
  }, [cells, showFormulas])

  // ── History ────────────────────────────────────────────────────────────────
  const pushHistory = useCallback((prevCells: string[][]) => {
    setHistory((h) => [...h.slice(-49), prevCells]); setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setRedoStack((r) => [...r, cells]); setCells(prev)
      return h.slice(0, -1)
    })
  }, [cells])

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r
      const next = r[r.length - 1]
      setHistory((h) => [...h, cells]); setCells(next)
      return r.slice(0, -1)
    })
  }, [cells])

  // ── Cell update ────────────────────────────────────────────────────────────
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setCells((current) => {
      pushHistory(current)
      return current.map((row, r) => r === rowIndex ? row.map((cell, c) => c === colIndex ? value : cell) : row)
    })
  }, [pushHistory])

  // ── Commit editing cell ────────────────────────────────────────────────────
  const commitEditingCell = useCallback(() => {
    const ec = editingCellRef.current
    if (ec) {
      updateCell(ec.row, ec.col, editDraftRef.current)
      editingCellRef.current = null
      setEditDraft("")
      editDraftRef.current = ""
    }
  }, [updateCell])

  // ── Format ─────────────────────────────────────────────────────────────────
  const applyFmt = useCallback((patch: Partial<CellFmt>) => {
    setFmt((f) => {
      const next = f.map((row) => row.map((cell) => ({ ...cell })))
      if (selRange) {
        const r1 = Math.min(selRange.r1, selRange.r2), r2 = Math.max(selRange.r1, selRange.r2)
        const c1 = Math.min(selRange.c1, selRange.c2), c2 = Math.max(selRange.c1, selRange.c2)
        for (let r = r1; r <= r2; r++)
          for (let c = c1; c <= c2; c++)
            if (next[r]?.[c]) next[r][c] = { ...next[r][c], ...patch }
      } else {
        if (next[selection.row]?.[selection.col])
          next[selection.row][selection.col] = { ...next[selection.row][selection.col], ...patch }
      }
      return next
    })
  }, [selection, selRange])

  // ── Row/col ops ────────────────────────────────────────────────────────────
  // FIX #4: Never call setFmt() inside a setCells() updater function.
  // React disallows setState calls inside another setState updater.
  // All row/col operations now update cells and fmt independently.

  const emptyFmtRow = useCallback((len: number) =>
    Array.from({ length: len }, () => ({ ...EMPTY_CELL_FORMAT })), [])

  const addRow = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    const newRowLen = cells[0]?.length || DEFAULT_COLS
    setCells((c) => [...c, Array.from({ length: newRowLen }, () => "")])
    setFmt((f) => [...f, emptyFmtRow(newRowLen)])
  }, [cells, pushHistory, emptyFmtRow])

  const addColumn = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    setCells((c) => c.map((row) => [...row, ""]))
    setFmt((f) => f.map((row) => [...row, { ...EMPTY_CELL_FORMAT }]))
  }, [cells, pushHistory])

  const removeRow = useCallback(() => {
    if (isReadOnly) return
    if (cells.length <= 1) return
    pushHistory(cells)
    setCells((c) => c.slice(0, -1))
    setFmt((f) => f.slice(0, -1))
  }, [cells, pushHistory])

  const removeColumn = useCallback(() => {
    if (isReadOnly) return
    if ((cells[0]?.length || 0) <= 1) return
    pushHistory(cells)
    setCells((c) => c.map((row) => row.slice(0, -1)))
    setFmt((f) => f.map((row) => row.slice(0, -1)))
  }, [cells, pushHistory])

  const insertRowAbove = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    const r = selection.row
    const newRowLen = cells[0]?.length || DEFAULT_COLS
    setCells((c) => {
      const next = [...c]
      next.splice(r, 0, Array.from({ length: newRowLen }, () => ""))
      return next
    })
    setFmt((f) => {
      const nf = [...f]
      nf.splice(r, 0, emptyFmtRow(f[0]?.length || DEFAULT_COLS))
      return nf
    })
  }, [cells, selection.row, pushHistory, emptyFmtRow])

  const insertRowBelow = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    const r = selection.row + 1
    const newRowLen = cells[0]?.length || DEFAULT_COLS
    setCells((c) => {
      const next = [...c]
      next.splice(r, 0, Array.from({ length: newRowLen }, () => ""))
      return next
    })
    setFmt((f) => {
      const nf = [...f]
      nf.splice(r, 0, emptyFmtRow(f[0]?.length || DEFAULT_COLS))
      return nf
    })
  }, [cells, selection.row, pushHistory, emptyFmtRow])

  const insertColLeft = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    const c = selection.col
    setCells((current) => current.map((row) => { const n = [...row]; n.splice(c, 0, ""); return n }))
    setFmt((f) => f.map((row) => { const n = [...row]; n.splice(c, 0, { ...EMPTY_CELL_FORMAT }); return n }))
  }, [cells, selection.col, pushHistory])

  const insertColRight = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    const c = selection.col + 1
    setCells((current) => current.map((row) => { const n = [...row]; n.splice(c, 0, ""); return n }))
    setFmt((f) => f.map((row) => { const n = [...row]; n.splice(c, 0, { ...EMPTY_CELL_FORMAT }); return n }))
  }, [cells, selection.col, pushHistory])

  const deleteRow = useCallback(() => {
    if (isReadOnly) return
    if (cells.length <= 1) return
    pushHistory(cells)
    const r = selection.row
    setCells((c) => c.filter((_, i) => i !== r))
    setFmt((f) => f.filter((_, i) => i !== r))
    setSelection((s) => ({ ...s, row: Math.max(0, s.row - 1) }))
  }, [cells, selection.row, pushHistory])

  const deleteCol = useCallback(() => {
    if (isReadOnly) return
    if ((cells[0]?.length || 0) <= 1) return
    pushHistory(cells)
    const col = selection.col
    setCells((c) => c.map((row) => row.filter((_, i) => i !== col)))
    setFmt((f) => f.map((row) => row.filter((_, i) => i !== col)))
    setSelection((s) => ({ ...s, col: Math.max(0, s.col - 1) }))
  }, [cells, selection.col, pushHistory])

  const clearCell = useCallback(() => {
    if (isReadOnly) return
    pushHistory(cells)
    if (selRange) {
      const r1 = Math.min(selRange.r1, selRange.r2), r2 = Math.max(selRange.r1, selRange.r2)
      const c1 = Math.min(selRange.c1, selRange.c2), c2 = Math.max(selRange.c1, selRange.c2)
      setCells((c) => c.map((row, r) => row.map((cell, col) => r >= r1 && r <= r2 && col >= c1 && col <= c2 ? "" : cell)))
    } else {
      updateCell(selection.row, selection.col, "")
    }
  }, [pushHistory, cells, selRange, selection, updateCell])

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sortByCol = useCallback((col: number, dir: string) => {
    if (isReadOnly) return
    pushHistory(cells)
    setCells((c) => [...c].sort((a, b) => {
      const av = parseFloat(a[col]) || a[col] || "", bv = parseFloat(b[col]) || b[col] || ""
      if (av < bv) return dir === "asc" ? -1 : 1
      if (av > bv) return dir === "asc" ? 1 : -1
      return 0
    }))
  }, [cells, pushHistory])

  // ── Find & Replace ─────────────────────────────────────────────────────────
  const doFindReplace = useCallback((find: string, replace: string) => {
    if (isReadOnly) return
    pushHistory(cells)
    setCells((c) => c.map((row) => row.map((cell) => cell.includes(find) ? cell.replaceAll(find, replace) : cell)))
  }, [cells, pushHistory])

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportAsCSV = useCallback(() => {
    const csv = cells.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${sanitizeSpreadsheetFileName(title)}.csv`; a.click(); URL.revokeObjectURL(url)
  }, [cells, title])

  const exportAsHTML = useCallback(() => {
    const html = buildSpreadsheetHtml({ title, summary, cells })
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${sanitizeSpreadsheetFileName(title)}.xls`; a.click(); URL.revokeObjectURL(url)
  }, [cells, title, summary])

  const printSheet = useCallback(() => {
    const html = buildSpreadsheetHtml({ title, summary, cells })
    const w = window.open("", "_blank")!; w.document.write(html); w.document.close(); w.print()
  }, [cells, title, summary])

  // ── Load / Save / Delete ───────────────────────────────────────────────────
  const applySheetToEditor = useCallback((sheet: any) => {
    setSelectedId(sheet._id); selectedIdRef.current = sheet._id
    setTitle(sheet.title || "Untitled Grid"); setSummary(sheet.summary || "")
    const c = normalizeSpreadsheetGrid(sheet.cells, DEFAULT_ROWS, DEFAULT_COLS)
    setCells(c); setFmt(normalizeFmt(sheet.fmt, c.length, c[0]?.length || DEFAULT_COLS))
    setIsShared(sheet.isShared !== false); setMessage("")
    if (Array.isArray(sheet.assignedTo)) {
      setAssignedTo(sheet.assignedTo)
      originalAssignedRef.current = sheet.assignedTo.map(String)
    } else if (sheet.assignedTo) {
      setAssignedTo([sheet.assignedTo])
      originalAssignedRef.current = [String(sheet.assignedTo)]
    } else {
      setAssignedTo([])
      originalAssignedRef.current = []
    }
    setSelection({ row: 0, col: 0 }); setSelRange(null)
    setHistory([]); setRedoStack([])
    editingCellRef.current = null; setEditDraft(""); editDraftRef.current = ""
  }, [])

  const resetDraft = useCallback(() => {
    setSelectedId(null); selectedIdRef.current = null
    setTitle("Untitled Grid"); setSummary("")
    const c = createEmptySpreadsheetGrid(DEFAULT_ROWS, DEFAULT_COLS)
    setCells(c); setFmt(makeEmptyFormat(DEFAULT_ROWS, DEFAULT_COLS))
    setIsShared(true); setMessage("")
    setAssignedTo([])
    originalAssignedRef.current = []
    setSelection({ row: 0, col: 0 }); setSelRange(null)
    setHistory([]); setRedoStack([])
    editingCellRef.current = null; setEditDraft(""); editDraftRef.current = ""
  }, [])

  const loadSheets = useCallback(async () => {
    setLoading(true); setMessage("")
    try {
      const res = await fetch("/api/sheets")
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Failed to load sheets")
      const nextSheets = payload.sheets || []
      setSheets(nextSheets)
      if (nextSheets.length > 0) applySheetToEditor(nextSheets[0]); else resetDraft()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load sheets")
    } finally { setLoading(false) }
  }, [applySheetToEditor, resetDraft])

  useEffect(() => {
    if (initialSheet) {
      setSheets([initialSheet])
      applySheetToEditor(initialSheet)
      setLoading(false)
    } else {
      loadSheets()
    }
    setOrigin(window.location.origin)
  }, [])
  useEffect(() => { if (editingTitle && titleInputRef.current) titleInputRef.current.focus() }, [editingTitle])

  const saveSheet = useCallback(async (assignedOverride = undefined) => {
    if (isReadOnly) return
    setSaving(true); setMessage("")
    try {
      // Read the latest state via functional updater to avoid stale closure
      let currentCells: string[][] = []
      let currentFmt: CellFmt[][] = []
      let currentTitle = ""
      let currentSummary = ""
      let currentIsShared = true
      let currentSelectedId: string | null = null

      // Grab current values synchronously via refs
      currentSelectedId = selectedIdRef.current

      // We can't avoid using the closure state for most fields, but using
      // the selectedIdRef ensures we always POST/PUT to the right endpoint.
      // The cells/fmt/title/summary/isShared are read from the latest render closure.
      currentCells = cells
      currentFmt = fmt
      currentTitle = title
      currentSummary = summary
      currentIsShared = isShared

      // Sanitize assigned list to avoid passing DOM/React objects in payload
      const rawAssigned = assignedOverride ?? assignedTo
      const safeAssigned = Array.isArray(rawAssigned)
        ? rawAssigned
            .map(a => {
              if (typeof a === 'string') return a
              if (a && typeof a === 'object') {
                if (a._id) return a._id
                if (a.id) return a.id
                if (a.email) return a.email
              }
              return null
            })
            .filter(x => x != null)
        : []

      // Only include assignedTo if caller provided it or it changed from original
      const includeAssigned = assignedOverride !== undefined || (
        selectedId ?
          JSON.stringify((originalAssignedRef.current || []).sort()) !== JSON.stringify((safeAssigned || []).map(String).sort())
          : true
      )

      const payload: {
        title: string
        summary: string
        cells: string[][]
        fmt: CellFmt[][]
        isShared: boolean
        assignedTo?: string[]
      } = {
        title: currentTitle,
        summary: currentSummary,
        cells: currentCells,
        fmt: currentFmt,
        isShared: currentIsShared,
      }
      if (includeAssigned) payload.assignedTo = safeAssigned
      const res = await fetch(currentSelectedId ? `/api/sheets/${currentSelectedId}` : "/api/sheets", {
        method: currentSelectedId ? "PUT" : "POST",
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
      setTitle(saved.title || "Untitled Grid"); setSummary(saved.summary || ""); setIsShared(saved.isShared !== false)
      if (Array.isArray(saved.assignedTo)) { setAssignedTo(saved.assignedTo); originalAssignedRef.current = saved.assignedTo.map(String) }
      else if (saved.assignedTo) { setAssignedTo([saved.assignedTo]); originalAssignedRef.current = [String(saved.assignedTo)] }
      else { setAssignedTo([]); originalAssignedRef.current = [] }
      setMessage("Saved"); setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save sheet")
    } finally { setSaving(false) }
  }, [cells, fmt, title, summary, isShared]) // selectedId accessed via ref

  // Keep the saveSheetRef current so keyboard handler always calls the latest version
  useEffect(() => { saveSheetRef.current = saveSheet }, [saveSheet])

  const deleteSheet = useCallback(async () => {
    if (isReadOnly) return
    if (!selectedId || !window.confirm("Delete this sheet permanently?")) return
    setDeleting(true); setMessage("")
    try {
      const res = await fetch(`/api/sheets/${selectedId}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || "Failed to delete sheet")
      resetDraft(); setMessage("Deleted"); setTimeout(() => setMessage(""), 2000); await loadSheets()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete sheet")
    } finally { setDeleting(false) }
  }, [selectedId, resetDraft, loadSheets])

  const createNewSheet = useCallback(() => {
    if (isReadOnly) return
    resetDraft(); setMessage("New sheet ready."); setTimeout(() => setMessage(""), 2000)
  }, [resetDraft])

  // ── Navigate to a cell ─────────────────────────────────────────────────────
  const navigateTo = useCallback((row: number, col: number) => {
    commitEditingCell()
    const r = Math.max(0, Math.min(rows - 1, row))
    const c = Math.max(0, Math.min(cols - 1, col))
    setSelection({ row: r, col: c })
    setSelRange(null)
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(`[data-cell="${r}-${c}"]`)
      input?.focus()
    })
  }, [commitEditingCell, rows, cols])

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  // FIX #5: Use saveSheetRef.current instead of saveSheet directly so the
  // keyboard handler never captures a stale version of saveSheet.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const isCellInput = active?.dataset?.cell !== undefined
      const isAnyInput = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA"

      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); commitEditingCell(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); commitEditingCell(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveSheetRef.current(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") { e.preventDefault(); setShowFindReplace(true); return }
      if ((e.ctrlKey || e.metaKey) && !isCellInput && e.key === "b") { e.preventDefault(); applyFmt({ bold: !selectedFmt.bold }); return }
      if ((e.ctrlKey || e.metaKey) && !isCellInput && e.key === "i") { e.preventDefault(); applyFmt({ italic: !selectedFmt.italic }); return }
      if ((e.ctrlKey || e.metaKey) && !isCellInput && e.key === "u") { e.preventDefault(); applyFmt({ underline: !selectedFmt.underline }); return }

      if (!isCellInput && !isAnyInput) {
        if (e.key === "ArrowUp") { e.preventDefault(); navigateTo(selection.row - 1, selection.col) }
        else if (e.key === "ArrowDown") { e.preventDefault(); navigateTo(selection.row + 1, selection.col) }
        else if (e.key === "ArrowLeft") { e.preventDefault(); navigateTo(selection.row, selection.col - 1) }
        else if (e.key === "ArrowRight") { e.preventDefault(); navigateTo(selection.row, selection.col + 1) }
        else if (e.key === "Tab") { e.preventDefault(); navigateTo(selection.row, selection.col + 1) }
        else if (e.key === "Enter") { e.preventDefault(); navigateTo(selection.row + 1, selection.col) }
        else if (e.key === "Delete" || e.key === "Backspace") clearCell()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, selection, selectedFmt, applyFmt, commitEditingCell, navigateTo, clearCell])
  // Note: saveSheet intentionally excluded — accessed via saveSheetRef to avoid stale closure

  // ── Menu definitions ───────────────────────────────────────────────────────
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
      { label: "Supported formulas", action: () => alert('=SUM(A1:C3)  =AVERAGE(A1:A10)  =COUNT(A1:A10)  =COUNTA(A1:A10)  =MAX(A1:A10)  =MIN(A1:A10)  =IF(A1>0,"yes","no")  Arithmetic: =A1+B2*3') },
    ],
  }

  // ── Drag selection ─────────────────────────────────────────────────────────
  const onCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelRange({ r1: Math.min(selection.row, r), c1: Math.min(selection.col, c), r2: Math.max(selection.row, r), c2: Math.max(selection.col, c) })
    } else {
      commitEditingCell()
      setSelection({ row: r, col: c }); setSelRange(null)
      dragStart.current = { row: r, col: c }
    }
  }
  const onCellMouseEnter = (r: number, c: number) => {
    if (dragStart.current)
      setSelRange({ r1: Math.min(dragStart.current.row, r), c1: Math.min(dragStart.current.col, c), r2: Math.max(dragStart.current.row, r), c2: Math.max(dragStart.current.col, c) })
  }
  const onMouseUp = () => { dragStart.current = null }

  const isCellInRange = (r: number, c: number) =>
    selRange
      ? r >= Math.min(selRange.r1, selRange.r2) && r <= Math.max(selRange.r1, selRange.r2) &&
        c >= Math.min(selRange.c1, selRange.c2) && c <= Math.max(selRange.c1, selRange.c2)
      : false

  // ── Column resize ──────────────────────────────────────────────────────────
  const resizeDrag = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)
  const onResizeMouseDown = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startWidth = columnWidths[colIndex] || 100
    resizeDrag.current = { colIndex, startX, startWidth }
    const onMove = (me: MouseEvent) => {
      const diff = me.clientX - resizeDrag.current!.startX
      setColumnWidths((w) => ({ ...w, [resizeDrag.current!.colIndex]: Math.max(40, resizeDrag.current!.startWidth + diff) }))
    }
    const onUp = () => { resizeDrag.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp)
  }

  // FIX #6: Guard against cols being 0 — already fixed above by using DEFAULT_COLS as fallback
  const colTemplate = `46px ${Array.from({ length: cols }, (_, i) => `${columnWidths[i] || 100}px`).join(" ")}`

  // FIX #7: Apply filterRow to visible rows — rows after the header row are always shown,
  // but when filterRow is active we visually mark row 0 as a header.
  const visibleRows = cells

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white text-[#202124] select-none"
      style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif", fontSize: `${zoom}%` }}
      onMouseUp={onMouseUp}
    >
      {/* ── Title bar ── */}
      <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-1.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          {editingTitle ? (
            <input ref={titleInputRef} value={title} onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingTitle(false) }}
              className="rounded border border-[#1a73e8] px-2 py-0.5 text-sm font-medium text-[#202124] outline-none ring-1 ring-[#1a73e8] w-56" />
          ) : (
            <span onClick={() => setEditingTitle(true)} className="cursor-text rounded px-2 py-0.5 text-sm font-medium text-[#202124] hover:bg-[#f1f3f4] truncate max-w-[240px]">{title}</span>
          )}
          <div className="flex items-center gap-0.5 px-1">
            {Object.entries(menuItems).map(([label, items]) => (
              <DropdownMenu key={label} label={label} items={items} isOpen={openMenu === label}
                onToggle={() => setOpenMenu((m) => m === label ? null : label)} onClose={() => setOpenMenu(null)} />
            ))}
          </div>
        </div>
        <div className="flex-1" />
        {message ? <span className="text-xs text-[#5f6368]">{message}</span> : null}
        {saving ? <span className="flex items-center gap-1 text-xs text-[#5f6368]"><LoaderCircle className="h-3 w-3 animate-spin" /> Saving…</span> : null}
        <button onClick={() => setShowSheetsModal(true)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-[#5f6368] transition hover:bg-[#f1f3f4]">
          <Folder className="h-4 w-4" /><span className="hidden sm:inline">My Sheets</span><ChevronDown className="h-3 w-3" />
        </button>
        {!isReadOnly && (
          <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 rounded-full bg-[#454749] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#3b3b3b]">
            <Share2 className="h-4 w-4" />Share
          </button>
        )}
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="flex shrink-0 items-center gap-1 border-b border-t border-[#e0e0e0] bg-[#f8f9fa] px-2 py-1 flex-wrap">
        <button onClick={undo} disabled={isReadOnly || !history.length} title="Undo (Ctrl+Z)" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30"><Undo className="h-3.5 w-3.5" /></button>
        <button onClick={redo} disabled={isReadOnly || !redoStack.length} title="Redo (Ctrl+Y)" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] disabled:opacity-30"><Redo className="h-3.5 w-3.5" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        {!isReadOnly && (
          <button onClick={() => saveSheet()} disabled={saving} title="Save (Ctrl+S)" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed] disabled:opacity-40">
            {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save
          </button>
        )}

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <ToolbarSelect
          title="Font"
          value={selectedFmt.fontFamily}
          onChange={(v) => applyFmt({ fontFamily: v })}
          options={FONT_FAMILIES}
          width="w-32"
        />

        <FontSizeStepper
          value={selectedFmt.fontSize || "11"}
          onChange={(v) => applyFmt({ fontSize: v })}
        />

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <button onClick={() => applyFmt({ bold: !selectedFmt.bold })} title="Bold (Ctrl+B)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.bold ? "bg-[#e8eaed] font-bold" : ""}`}><Bold className="h-3.5 w-3.5" /></button>
        <button onClick={() => applyFmt({ italic: !selectedFmt.italic })} title="Italic (Ctrl+I)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.italic ? "bg-[#e8eaed]" : ""}`}><Italic className="h-3.5 w-3.5" /></button>
        <button onClick={() => applyFmt({ underline: !selectedFmt.underline })} title="Underline (Ctrl+U)" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.underline ? "bg-[#e8eaed]" : ""}`}><Underline className="h-3.5 w-3.5" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <ColorSwatchPicker
          title="Text Color"
          value={selectedFmt.color}
          onChange={(v) => applyFmt({ color: v })}
          colors={TEXT_COLORS}
        />

        <div className="flex items-center gap-0.5">
          {["#fff9c4", "#e8f5e9", "#fce8e6", "#e8f0fe", "#fce4ec", ""].map((bg) => (
            <button key={bg || "clear"} onClick={() => applyFmt({ bg })} title={bg || "Clear bg"} className="h-5 w-5 rounded border border-[#dadce0] hover:scale-110 transition-transform"
              style={{ background: bg || "#fff", backgroundImage: bg ? undefined : "linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)" }} />
          ))}
        </div>

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <button onClick={() => applyFmt({ align: "left" })} title="Align left" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "left" ? "bg-[#e8eaed]" : ""}`}><AlignLeft className="h-3.5 w-3.5" /></button>
        <button onClick={() => applyFmt({ align: "center" })} title="Align center" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "center" ? "bg-[#e8eaed]" : ""}`}><AlignCenter className="h-3.5 w-3.5" /></button>
        <button onClick={() => applyFmt({ align: "right" })} title="Align right" className={`rounded p-1.5 text-[#444746] hover:bg-[#e8eaed] ${selectedFmt.align === "right" ? "bg-[#e8eaed]" : ""}`}><AlignRight className="h-3.5 w-3.5" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <button onClick={() => sortByCol(selection.col, "asc")} title="Sort A→Z" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed]"><SortAsc className="h-3.5 w-3.5" /></button>
        <button onClick={() => sortByCol(selection.col, "desc")} title="Sort Z→A" className="rounded p-1.5 text-[#444746] hover:bg-[#e8eaed]"><SortDesc className="h-3.5 w-3.5" /></button>

        <div className="h-4 w-px bg-[#dadce0] mx-0.5" />

        <button onClick={insertRowAbove} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Row↑</button>
        <button onClick={insertRowBelow} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Row↓</button>
        <button onClick={insertColLeft} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Col←</button>
        <button onClick={insertColRight} className="rounded px-2 py-1 text-xs text-[#3c4043] hover:bg-[#e8eaed]">+Col→</button>
        <button onClick={deleteRow} className="rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6]">−Row</button>
        <button onClick={deleteCol} className="rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6]">−Col</button>

        <div className="flex-1" />

        {!isReadOnly && (
          <button onClick={deleteSheet} disabled={!selectedId || deleting} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#d93025] hover:bg-[#fce8e6] disabled:opacity-40">
            {deleting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete
          </button>
        )}
      </div>

      {/* ── Formula bar ── */}
      {/* FIX #8: Show live editDraft in formula bar while a cell is being edited inline */}
      <div className="flex shrink-0 items-center border-b border-[#e0e0e0] bg-white">
        <div className="flex w-[80px] shrink-0 items-center justify-center border-r border-[#e0e0e0] py-1.5 text-xs font-medium text-[#202124]">
          {selectedCellLabel}
        </div>
        <div className="flex w-8 shrink-0 items-center justify-center border-r border-[#e0e0e0] py-1.5 text-xs italic text-[#5f6368]">fx</div>
        <input
          value={
            editingCellRef.current
              ? editDraft                          // live draft while typing in cell
              : formulaBarActive
                ? formulaBarDraft                  // formula bar is focused
                : selectedCellRawValue             // just viewing
          }
          onFocus={() => {
            // Don't activate formula bar while a cell is being edited inline
            if (editingCellRef.current) return
            setFormulaBarActive(true)
            setFormulaBarDraft(selectedCellRawValue)
          }}
          onChange={(e) => setFormulaBarDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateCell(selection.row, selection.col, formulaBarDraft)
              setFormulaBarActive(false)
              e.currentTarget.blur()
            }
            if (e.key === "Escape") { setFormulaBarActive(false); e.currentTarget.blur() }
          }}
          onBlur={() => {
            if (formulaBarActive) updateCell(selection.row, selection.col, formulaBarDraft)
            setFormulaBarActive(false)
          }}
          className="flex-1 bg-white px-3 py-1.5 text-sm text-[#202124] outline-none select-text"
          readOnly={!!editingCellRef.current} // read-only mirror while cell is being edited
        />
      </div>

      {/* ── Formula suggestions ── */}
      {showSuggestions && (
        <div className="border-b border-[#e0e0e0] bg-white px-3 py-2">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#5f6368]">Suggestions</div>
          <div className="flex flex-wrap gap-2">
            {formulaSuggestions.map((item) => (
              <button key={item.name} type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (editingCellRef.current) setEditDraft(item.example)
                  else setFormulaBarDraft(item.example)
                }}
                className="rounded-full border border-[#dadce0] bg-[#f8f9fa] px-3 py-1 text-left text-[12px] text-[#202124] transition hover:bg-[#e8eaed]"
                title={item.description}
              >
                <span className="font-semibold">{item.name}</span>
                <span className="ml-2 text-[#5f6368]">{item.example}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <div className="inline-grid" style={{ gridTemplateColumns: colTemplate }}>
          {/* Corner */}
          <div className="sticky left-0 top-0 z-30 border-b border-r border-[#e0e0e0] bg-[#f8f9fa]" style={{ minHeight: 24 }} />

          {/* Column headers */}
          {cells[0]?.map((_, colIndex) => {
            const isActive = selection.col === colIndex
            const isInRange = selRange ? colIndex >= Math.min(selRange.c1, selRange.c2) && colIndex <= Math.max(selRange.c1, selRange.c2) : false
            return (
              <div key={colIndex}
                className={`sticky top-0 z-20 flex items-center justify-center border-b border-r border-[#e0e0e0] text-xs font-medium cursor-pointer select-none relative ${isActive || isInRange ? "bg-[#e2edff] text-[#1a73e8]" : "bg-[#f8f9fa] text-[#444746] hover:bg-[#e8eaed]"}`}
                style={{ minHeight: 24 }}
                onMouseDown={() => { setSelection((s) => ({ ...s, col: colIndex })); setSelRange({ r1: 0, c1: colIndex, r2: rows - 1, c2: colIndex }) }}
              >
                {getSpreadsheetColumnLabel(colIndex)}
                <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#1a73e8] z-10" onMouseDown={(e) => onResizeMouseDown(colIndex, e)} />
              </div>
            )
          })}

          {/* Rows */}
          {visibleRows.map((row, rowIndex) => {
            const isRowActive = selection.row === rowIndex
            const isRowInRange = selRange ? rowIndex >= Math.min(selRange.r1, selRange.r2) && rowIndex <= Math.max(selRange.r1, selRange.r2) : false
            // FIX #9: Visually style row 0 as a filter/header row when filterRow is active
            const isFilterHeader = filterRow !== null && rowIndex === filterRow
            return (
              <Fragment key={`row-${rowIndex}`}>
                {/* Row number */}
                <div
                  className={`sticky left-0 z-10 flex items-center justify-center border-b border-r border-[#e0e0e0] text-xs font-medium cursor-pointer select-none ${isRowActive || isRowInRange ? "bg-[#e2edff] text-[#1a73e8]" : "bg-[#f8f9fa] text-[#444746] hover:bg-[#e8eaed]"}`}
                  style={{ minHeight: 22 }}
                  onMouseDown={() => { setSelection((s) => ({ ...s, row: rowIndex })); setSelRange({ r1: rowIndex, c1: 0, r2: rowIndex, c2: cols - 1 }) }}
                >
                  {rowIndex + 1}
                </div>

                {/* Data cells */}
                {row.map((cell, colIndex) => {
                  const isSelected = selection.row === rowIndex && selection.col === colIndex
                  const isThisCellEditing = editingCellRef.current?.row === rowIndex && editingCellRef.current?.col === colIndex
                  const inRange = isCellInRange(rowIndex, colIndex)
                  const cellFmt = fmt[rowIndex]?.[colIndex] || EMPTY_CELL_FORMAT
                  const displayVal = displayCells[rowIndex]?.[colIndex] ?? ""
                  const isError = !isThisCellEditing && displayVal.startsWith("#") && displayVal.endsWith("!")

                  const inputDisplayValue = isThisCellEditing
                    ? editDraft
                    : showFormulas ? cell : displayVal

                  const borderStyle = showGridLines ? "border-b border-r border-[#e0e0e0]" : "border-b border-r border-transparent"

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`relative ${borderStyle} ${isSelected ? "z-10 ring-2 ring-inset ring-[#1a73e8]" : ""} ${inRange && !isSelected ? "bg-[#e8f0fe]/60" : ""} ${isFilterHeader ? "bg-[#e8f5e9]" : ""}`}
                      style={{ minHeight: 22, background: isSelected ? undefined : inRange ? undefined : isFilterHeader ? "#e8f5e9" : (cellFmt.bg || undefined) }}
                      onMouseDown={(e) => { if (!isReadOnly) onCellMouseDown(rowIndex, colIndex, e); else { setSelection({ row: rowIndex, col: colIndex }); setSelRange(null) } }}
                      onMouseEnter={() => { if (!isReadOnly) onCellMouseEnter(rowIndex, colIndex) }}
                    >
                      <input
                        data-cell={`${rowIndex}-${colIndex}`}
                        value={inputDisplayValue}
                        onChange={(e) => {
                          if (isReadOnly) return
                          setEditDraft(e.target.value)
                          editDraftRef.current = e.target.value
                        }}
                        onFocus={() => {
                          setSelection({ row: rowIndex, col: colIndex })
                          setSelRange(null)
                          if (isReadOnly) return
                          editingCellRef.current = { row: rowIndex, col: colIndex }
                          const raw = cells[rowIndex]?.[colIndex] ?? ""
                          setEditDraft(raw)
                          editDraftRef.current = raw
                          setFormulaBarActive(false)
                          setFormulaBarDraft(raw)
                        }}
                        onBlur={() => {
                          if (isReadOnly) return
                          const ec = editingCellRef.current
                          if (ec && ec.row === rowIndex && ec.col === colIndex) {
                            updateCell(rowIndex, colIndex, editDraftRef.current)
                            editingCellRef.current = null
                            setEditDraft("")
                            editDraftRef.current = ""
                          }
                        }}
                        onKeyDown={(e) => {
                          if (isReadOnly) { e.preventDefault(); return }
                          if (e.key === "Enter") {
                            e.preventDefault()
                            updateCell(rowIndex, colIndex, editDraftRef.current)
                            editingCellRef.current = null
                            setEditDraft(""); editDraftRef.current = ""
                            const nextRow = Math.min(rows - 1, rowIndex + 1)
                            setSelection({ row: nextRow, col: colIndex }); setSelRange(null)
                            requestAnimationFrame(() => {
                              document.querySelector<HTMLInputElement>(`[data-cell="${nextRow}-${colIndex}"]`)?.focus()
                            })
                          } else if (e.key === "Tab") {
                            e.preventDefault()
                            updateCell(rowIndex, colIndex, editDraftRef.current)
                            editingCellRef.current = null
                            setEditDraft(""); editDraftRef.current = ""
                            const nextCol = Math.min(cols - 1, colIndex + 1)
                            setSelection({ row: rowIndex, col: nextCol }); setSelRange(null)
                            requestAnimationFrame(() => {
                              document.querySelector<HTMLInputElement>(`[data-cell="${rowIndex}-${nextCol}"]`)?.focus()
                            })
                          } else if (e.key === "Escape") {
                            editingCellRef.current = null
                            setEditDraft(""); editDraftRef.current = ""
                            e.currentTarget.blur()
                          } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            const input = e.currentTarget
                            const atStart = input.selectionStart === 0 && input.selectionEnd === 0
                            const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length
                            const isEmpty = editDraftRef.current === ""
                            const shouldNav = isEmpty
                              || e.key === "ArrowUp" || e.key === "ArrowDown"
                              || (e.key === "ArrowLeft" && atStart)
                              || (e.key === "ArrowRight" && atEnd)
                            if (shouldNav) {
                              e.preventDefault()
                              updateCell(rowIndex, colIndex, editDraftRef.current)
                              editingCellRef.current = null
                              setEditDraft(""); editDraftRef.current = ""
                              e.currentTarget.blur()
                              let nr = rowIndex, nc = colIndex
                              if (e.key === "ArrowUp") nr = Math.max(0, rowIndex - 1)
                              else if (e.key === "ArrowDown") nr = Math.min(rows - 1, rowIndex + 1)
                              else if (e.key === "ArrowLeft") nc = Math.max(0, colIndex - 1)
                              else if (e.key === "ArrowRight") nc = Math.min(cols - 1, colIndex + 1)
                              setSelection({ row: nr, col: nc }); setSelRange(null)
                              requestAnimationFrame(() => {
                                document.querySelector<HTMLInputElement>(`[data-cell="${nr}-${nc}"]`)?.focus()
                              })
                            }
                          }
                        }}
                        className="h-full w-full bg-transparent px-1.5 py-0 text-xs outline-none select-text"
                        style={{
                          minHeight: 22,
                          fontWeight: isFilterHeader || cellFmt.bold ? "bold" : undefined,
                          fontStyle: cellFmt.italic ? "italic" : undefined,
                          textDecoration: cellFmt.underline ? "underline" : undefined,
                          textAlign: (cellFmt.align || "left") as "left" | "center" | "right",
                          color: isError ? "#d93025" : (cellFmt.color || undefined),
                          background: isSelected ? (cellFmt.bg || "transparent") : inRange ? "#e8f0fe40" : (cellFmt.bg || "transparent"),
                          caretColor: "#1a73e8",
                          fontSize: cellFmt.fontSize ? `${cellFmt.fontSize}px` : undefined,
                          fontFamily: cellFmt.fontFamily || undefined,
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
        {!isReadOnly && (
          <button onClick={createNewSheet} className="rounded p-1 text-[#5f6368] transition hover:bg-[#e8eaed]" title="New sheet"><Plus className="h-4 w-4" /></button>
        )}
        <div className="mx-1 h-4 w-px bg-[#dadce0]" />
        <div className="flex items-end gap-0 overflow-x-auto">
          {sheets.length === 0 ? (
            <div className="flex items-center gap-1.5 border-b-2 border-[#1a73e8] bg-white px-4 py-1 text-xs font-medium text-[#202124]">
              <FileSpreadsheet className="h-3 w-3 text-[#34a853]" />{title || "Untitled Grid"}
            </div>
          ) : sheets.map((sheet) => (
            <button key={sheet._id} onClick={() => applySheetToEditor(sheet)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-1 text-xs font-medium transition ${sheet._id === selectedId ? "border-[#1a73e8] bg-white text-[#202124]" : "border-transparent text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124]"}`}>
              <FileSpreadsheet className="h-3 w-3 text-[#34a853]" />{sheet.title}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center pr-1">
          <input value={summary} onChange={(e) => { if (!isReadOnly) setSummary(e.target.value) }} placeholder="Sheet description…"
            className="rounded border border-transparent bg-transparent px-2 py-1 text-xs text-[#5f6368] outline-none placeholder:text-[#bdc1c6] focus:border-[#dadce0] focus:bg-white select-text" readOnly={isReadOnly} />
        </div>
      </div>

      {/* ── Modals ── */}
      {showShareModal && <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} isShared={isShared} setIsShared={setIsShared} assignedTo={assignedTo} setAssignedTo={setAssignedTo} onAssignUpdated={(newAssigned) => saveSheet(newAssigned)} />}
      {showSheetsModal && <SheetsListModal sheets={sheets} selectedId={selectedId} loading={loading} onSelect={applySheetToEditor} onClose={() => setShowSheetsModal(false)} onRefresh={loadSheets} onNew={createNewSheet} />}
      {showFindReplace && <FindReplaceModal cells={cells} onReplace={doFindReplace} onClose={() => setShowFindReplace(false)} />}
    </div>
  )
}