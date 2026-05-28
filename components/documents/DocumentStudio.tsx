"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Link2, Table, FileDown,
  Plus, RefreshCcw, Save, Trash2, Share2,
  LoaderCircle, X, Copy, Check,
  Undo2, Redo2, ZoomIn, ZoomOut,
  FileText, Paperclip, Type, FilePlus
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  "Calibri", "Arial", "Times New Roman", "Georgia", "Verdana",
  "Trebuchet MS", "Courier New", "Palatino", "Garamond", "Cambria",
]

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

const COLORS = [
  "#000000", "#ffffff", "#1f3864", "#1f497d", "#4472c4", "#9dc3e6",
  "#ff0000", "#ff6600", "#ffc000", "#ffff00", "#92d050", "#00b050",
  "#7030a0", "#d9027d", "#7f7f7f", "#bfbfbf", "#d6dce4", "#dae3f3",
]

const emptyDraft = {
  title: "Untitled Notes",
  summary: "",
  content: "",
  isShared: true,
}

function formatUpdatedAt(dateValue) {
  if (!dateValue) return "just now"
  try {
    return formatDistanceToNow(new Date(dateValue), { addSuffix: true })
  } catch {
    return "recently"
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Apply a pixel font-size to the current selection (or wrap a zero-width
 * span at the caret so the next typed characters use that size).
 * Does NOT use execCommand("fontSize") which causes the flicker bug.
 */
function applyFontSizeToSelection(editor, ptSize) {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)

  if (!range.collapsed) {
    // Wrap selected content in a span with the desired font-size
    const span = document.createElement("span")
    span.style.fontSize = `${ptSize}pt`
    try {
      range.surroundContents(span)
    } catch {
      // surroundContents fails on partial selections across elements;
      // fall back to extracting and re-wrapping
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
    }
    // Re-select the span contents
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(newRange)
  } else {
    // No selection — insert a zero-width span so next keystrokes pick up the size
    const span = document.createElement("span")
    span.style.fontSize = `${ptSize}pt`
    span.appendChild(document.createTextNode("\u200B")) // zero-width space
    range.insertNode(span)
    // Place caret inside the span after the zero-width char
    const newRange = document.createRange()
    newRange.setStart(span.firstChild, 1)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
  }
}

/**
 * Apply a font-family to the current selection without execCommand flicker.
 */
function applyFontFamilyToSelection(editor, family) {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)

  if (!range.collapsed) {
    const span = document.createElement("span")
    span.style.fontFamily = family
    try {
      range.surroundContents(span)
    } catch {
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
    }
  } else {
    // execCommand fontName is fine for setting the "next typed" font family
    // since it doesn't visually jump the existing content
    document.execCommand("fontName", false, family)
  }
}

/**
 * Read the computed font-size of the node at the current caret/selection.
 * Returns a pt value (number) or null.
 */
function getSelectionFontSizePt() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const node = sel.getRangeAt(0).startContainer
  const el = (node.nodeType === 3 ? node.parentElement : node) as Element | null
  if (!el) return null
  const computed = window.getComputedStyle(el).fontSize // "16px"
  const px = parseFloat(computed)
  if (isNaN(px)) return null
  return Math.round(px * 0.75) // px → pt  (1pt = 1.333px)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RibbonDivider() {
  return <div className="w-px self-stretch bg-[#c8c8c8] mx-1" />
}

function RibbonButton({ onClick, active = false, title, disabled = false, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex items-center justify-center rounded px-1.5 py-1 text-[13px] text-[#212121] transition",
        "hover:bg-[#e5e5e5] active:bg-[#ccc] disabled:opacity-40 disabled:cursor-not-allowed",
        active ? "bg-[#cde8ff] hover:bg-[#b8daff]" : "",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function SelectDropdown({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`h-7 rounded border border-[#ababab] bg-white px-1 text-[12px] text-[#212121] focus:outline-none focus:border-[#4472c4] ${className}`}
    >
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  )
}

function ColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={label}
        onClick={() => setOpen(o => !o)}
        className="flex flex-col items-center justify-center rounded px-1.5 py-0.5 hover:bg-[#e5e5e5] transition"
      >
        <Type className="h-3.5 w-3.5" />
        <div className="mt-0.5 h-1.5 w-5 rounded-sm border border-[#aaa]" style={{ backgroundColor: value }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded border border-[#ccc] bg-white p-2 shadow-lg">
          <div className="grid grid-cols-6 gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false) }}
                className="h-5 w-5 rounded-sm border border-[#ccc] hover:scale-110 transition"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[11px] text-[#666]">Custom:</span>
            <input
              type="color"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="h-6 w-10 cursor-pointer rounded border border-[#ccc]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ShareModal({ shareUrl, onClose, isShared, setIsShared }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border border-[#d0d0d0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#4472c4]" />
            <span className="text-[15px] font-semibold text-[#212121]">Share Document</span>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[#f0f0f0] transition">
            <X className="h-4 w-4 text-[#666]" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3 rounded-lg border border-[#e0e0e0] bg-[#f8f8f8] p-3">
            <FileText className="h-8 w-8 shrink-0 text-[#4472c4]" />
            <div>
              <p className="text-[13px] font-medium text-[#212121]">Document link</p>
              <p className="text-[12px] text-[#666]">Anyone with the link can view this document</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#444] uppercase tracking-wide">Share Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl || "Save the document first to generate a link"}
                className="flex-1 rounded border border-[#d0d0d0] bg-[#f5f5f5] px-3 py-2 text-[13px] text-[#555] focus:outline-none"
              />
              <button
                onClick={copy}
                disabled={!shareUrl}
                className="flex items-center gap-1.5 rounded border border-[#4472c4] bg-[#4472c4] px-3 py-2 text-[13px] text-white hover:bg-[#365fa0] disabled:opacity-40 transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#e0e0e0] p-3">
            <input
              id="share-toggle"
              type="checkbox"
              checked={isShared}
              onChange={e => setIsShared(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[#4472c4]"
            />
            <label htmlFor="share-toggle" className="cursor-pointer text-[13px] text-[#333]">
              Allow public access via link
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e0e0e0] px-5 py-3">
          {shareUrl && (
            <a href={shareUrl} target="_blank" rel="noreferrer">
              <button className="rounded border border-[#d0d0d0] bg-white px-4 py-2 text-[13px] text-[#333] hover:bg-[#f5f5f5] transition">
                Open in new tab
              </button>
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded bg-[#4472c4] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#365fa0] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DocumentStudio() {
  const [documents, setDocuments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [title, setTitle] = useState(emptyDraft.title)
  const [summary, setSummary] = useState(emptyDraft.summary)
  const [isShared, setIsShared] = useState(emptyDraft.isShared)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const [origin, setOrigin] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [zoom, setZoom] = useState(100)

  // ── Toolbar UI state (display only — does NOT drive editor style directly) ──
  const [toolbarFont, setToolbarFont] = useState("Calibri")
  const [toolbarSize, setToolbarSize] = useState("12")
  const [fontColor, setFontColor] = useState("#000000")
  const [fmtBold, setFmtBold] = useState(false)
  const [fmtItalic, setFmtItalic] = useState(false)
  const [fmtUnderline, setFmtUnderline] = useState(false)
  const [fmtStrike, setFmtStrike] = useState(false)
  const [fmtAlign, setFmtAlign] = useState("left")
  const [activeTab, setActiveTab] = useState("Home")

  const editorRef = useRef(null)
  const selectedIdRef = useRef(null) // track without re-render for editor content sync

  const activeDocument = documents.find(d => d._id === selectedId) || null
  const shareUrl = origin && activeDocument?.shareToken
    ? `${origin}/share/documents/${activeDocument.shareToken}`
    : ""

  // ── Load documents ────────────────────────────────────────────────────────

  const loadDocuments = async () => {
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/documents")
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Failed to load documents")
      const docs = payload.documents || []
      setDocuments(docs)
      if (docs.length > 0) {
        applyDocToEditor(docs[0])
      } else {
        resetDraft()
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])
  useEffect(() => { setOrigin(window.location.origin) }, [])

  // ── Apply a document object to all state + editor ────────────────────────

  const applyDocToEditor = (doc) => {
    setSelectedId(doc._id)
    selectedIdRef.current = doc._id
    setTitle(doc.title || emptyDraft.title)
    setSummary(doc.summary || "")
    setIsShared(doc.isShared !== false)
    setMessage("")
    // Directly set innerHTML — this is the ONLY place we sync content to the DOM
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content || ""
    }
  }

  const resetDraft = () => {
    setSelectedId(null)
    selectedIdRef.current = null
    setTitle(emptyDraft.title)
    setSummary(emptyDraft.summary)
    setIsShared(true)
    setMessage("")
    if (editorRef.current) editorRef.current.innerHTML = ""
  }

  // ── Sync toolbar state from caret position ────────────────────────────────
  // Only reads bold/italic/underline/strike/align — NOT font size (that caused the bug).
  // Font size is read separately and only when the caret actually moves.

  const syncToolbarFromSelection = () => {
    setFmtBold(document.queryCommandState("bold"))
    setFmtItalic(document.queryCommandState("italic"))
    setFmtUnderline(document.queryCommandState("underline"))
    setFmtStrike(document.queryCommandState("strikeThrough"))

    // Alignment
    if (document.queryCommandState("justifyCenter")) setFmtAlign("center")
    else if (document.queryCommandState("justifyRight")) setFmtAlign("right")
    else if (document.queryCommandState("justifyFull")) setFmtAlign("justify")
    else setFmtAlign("left")

    // Font family — safe to read via queryCommandValue
    const fam = document.queryCommandValue("fontName")
    if (fam) {
      const clean = fam.replace(/['"]/g, "").split(",")[0].trim()
      if (FONT_FAMILIES.includes(clean)) setToolbarFont(clean)
    }

    // Font size — read from computed style, NOT from execCommand
    const ptSize = getSelectionFontSizePt()
    if (ptSize !== null) {
      // Snap to nearest value in our list for clean display
      const nearest = FONT_SIZES.reduce((a, b) =>
        Math.abs(b - ptSize) < Math.abs(a - ptSize) ? b : a
      )
      setToolbarSize(String(nearest))
    }
  }

  // ── Formatting commands ───────────────────────────────────────────────────

  const exec = (cmd, value = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    syncToolbarFromSelection()
  }

  const handleFontFamilyChange = (family) => {
    setToolbarFont(family) // update dropdown immediately, no flicker
    applyFontFamilyToSelection(editorRef.current, family)
  }

  const handleFontSizeChange = (sizeStr) => {
    const pt = parseInt(sizeStr, 10)
    if (isNaN(pt)) return
    setToolbarSize(sizeStr) // update dropdown immediately, no flicker
    applyFontSizeToSelection(editorRef.current, pt)
  }

  const handleFontSizeGrow = () => {
    const cur = parseInt(toolbarSize, 10) || 12
    const next = FONT_SIZES.find(s => s > cur) || cur
    handleFontSizeChange(String(next))
  }

  const handleFontSizeShrink = () => {
    const cur = parseInt(toolbarSize, 10) || 12
    const prev = [...FONT_SIZES].reverse().find(s => s < cur) || cur
    handleFontSizeChange(String(prev))
  }

  const handleColorChange = (color) => {
    setFontColor(color)
    exec("foreColor", color)
  }

  const insertLink = () => {
    const url = window.prompt("Enter URL:", "https://")
    if (url) exec("createLink", url)
  }

  const insertTable = () => {
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;">'
    for (let r = 0; r < 3; r++) {
      html += "<tr>"
      for (let c = 0; c < 3; c++) {
        html += '<td style="border:1px solid #bbb;padding:6px 10px;min-width:80px;">&nbsp;</td>'
      }
      html += "</tr>"
    }
    html += "</table><p><br></p>"
    exec("insertHTML", html)
  }

  /**
   * Insert a page break — a full-width div with a visible dashed line and
   * a "page-break-before: always" CSS rule so it prints/exports correctly.
   */
  const insertPageBreak = () => {
    const html = `
      <div class="doc-page-break" style="
        page-break-before: always;
        border-top: 2px dashed #aaa;
        margin: 24px 0 8px 0;
        position: relative;
      ">
        <span style="
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 0 8px;
          font-size: 10px;
          color: #999;
          font-family: Arial, sans-serif;
          pointer-events: none;
          user-select: none;
        ">— Page Break —</span>
      </div>
      <p><br></p>
    `
    exec("insertHTML", html)
  }

  // ── Save / Delete ─────────────────────────────────────────────────────────

  const saveDocument = async () => {
    setSaving(true)
    setMessage("")
    try {
      const htmlContent = editorRef.current?.innerHTML || ""
      const payload = { title, summary, content: htmlContent, isShared }
      const res = await fetch(
        selectedId ? `/api/documents/${selectedId}` : "/api/documents",
        { method: selectedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      )
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || "Failed to save document")
      const saved = result.document
      setDocuments(prev => {
        const idx = prev.findIndex(d => d._id === saved._id)
        if (idx === -1) return [saved, ...prev]
        const next = [...prev]
        next[idx] = saved
        return next
      })
      setSelectedId(saved._id)
      setTitle(saved.title || emptyDraft.title)
      setSummary(saved.summary || "")
      setIsShared(saved.isShared !== false)
      setMessage("Document saved.")
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save document")
    } finally {
      setSaving(false)
    }
  }

  const deleteDocument = async () => {
    if (!selectedId) return
    if (!window.confirm("Delete this document permanently?")) return
    setDeleting(true)
    setMessage("")
    try {
      const res = await fetch(`/api/documents/${selectedId}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || "Failed to delete document")
      resetDraft()
      setMessage("Document deleted.")
      await loadDocuments()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete document")
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const TABS = ["Home", "Insert", "View"]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f3f3f3] text-[#212121]" style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}>

      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between border-b border-[#303132] bg-[#303132] px-4 py-1.5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-white" />
          <span className="text-[13px] font-semibold text-white">Notes</span>
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-72 rounded bg-transparent px-2 py-0.5 text-center text-[13px] text-white placeholder-white/60 focus:bg-white/10 focus:outline-none"
          placeholder="Document title"
        />
        <div className="flex items-center gap-2">
          {message && (
            <span className="rounded bg-white/10 px-2 py-0.5 text-[12px] text-white/80">{message}</span>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 rounded bg-white/15 px-3 py-1 text-[13px] text-white hover:bg-white/25 transition"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button
            onClick={saveDocument}
            disabled={saving}
            className="flex items-center gap-1.5 rounded bg-[#217346] px-3 py-1 text-[13px] text-white hover:bg-[#1a5e38] disabled:opacity-60 transition"
          >
            {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* ── Ribbon Tab Strip ── */}
      <div className="flex items-end border-b border-[#303132] bg-[#303132] px-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-t px-4 py-1.5 text-[12px] font-medium transition ${
              activeTab === tab
                ? "bg-[#f3f3f3] text-[#2b579a]"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Ribbon Panel ── */}
      <div className="flex min-h-16 flex-wrap items-center gap-1 border-b border-[#c8c8c8] bg-[#f3f3f3] px-3 py-1.5">

        {activeTab === "Home" && (
          <>
            {/* Undo / Redo */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex gap-0.5">
                <RibbonButton onClick={() => exec("undo")} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></RibbonButton>
                <RibbonButton onClick={() => exec("redo")} title="Redo (Ctrl+Y)"><Redo2 className="h-4 w-4" /></RibbonButton>
              </div>
              <span className="text-[10px] text-[#888]">Undo</span>
            </div>
            <RibbonDivider />

            {/* Font family + size */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <SelectDropdown
                  value={toolbarFont}
                  onChange={handleFontFamilyChange}
                  options={FONT_FAMILIES}
                  className="w-36"
                />
                {/* Font size: single dropdown to avoid duplicate controls */}
                <div className="flex items-center">
                  <SelectDropdown
                    value={toolbarSize}
                    onChange={handleFontSizeChange}
                    options={FONT_SIZES.map(s => String(s))}
                    className="w-16 text-center"
                  />
                </div>
                <RibbonButton onClick={handleFontSizeGrow} active={false} disabled={false} title="Increase font size">
                  <span className="text-[12px] font-bold leading-none">A↑</span>
                </RibbonButton>
                <RibbonButton onClick={handleFontSizeShrink} active={false} disabled={false} title="Decrease font size">
                  <span className="text-[12px] font-bold leading-none">A↓</span>
                </RibbonButton>
              </div>
              <div className="flex items-center gap-0.5">
                <RibbonButton onClick={() => exec("bold")} active={fmtBold} disabled={false} title="Bold (Ctrl+B)">
                  <Bold className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("italic")} active={fmtItalic} disabled={false} title="Italic (Ctrl+I)">
                  <Italic className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("underline")} active={fmtUnderline} disabled={false} title="Underline (Ctrl+U)">
                  <Underline className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("strikeThrough")} active={fmtStrike} disabled={false} title="Strikethrough">
                  <Strikethrough className="h-4 w-4" />
                </RibbonButton>
                <RibbonDivider />
                <ColorPicker value={fontColor} onChange={handleColorChange} label="Font Color" />
              </div>
            </div>
            <RibbonDivider />

            {/* Paragraph */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0.5">
                <RibbonButton onClick={() => exec("insertUnorderedList")} active={false} disabled={false} title="Bullet List">
                  <List className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("insertOrderedList")} active={false} disabled={false} title="Numbered List">
                  <ListOrdered className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("outdent")} active={false} disabled={false} title="Decrease Indent">
                  <Outdent className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => exec("indent")} active={false} disabled={false} title="Increase Indent">
                  <Indent className="h-4 w-4" />
                </RibbonButton>
              </div>
              <div className="flex items-center gap-0.5">
                <RibbonButton onClick={() => { setFmtAlign("left"); exec("justifyLeft") }} active={fmtAlign === "left"} disabled={false} title="Align Left">
                  <AlignLeft className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => { setFmtAlign("center"); exec("justifyCenter") }} active={fmtAlign === "center"} disabled={false} title="Center">
                  <AlignCenter className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => { setFmtAlign("right"); exec("justifyRight") }} active={fmtAlign === "right"} disabled={false} title="Align Right">
                  <AlignRight className="h-4 w-4" />
                </RibbonButton>
                <RibbonButton onClick={() => { setFmtAlign("justify"); exec("justifyFull") }} active={fmtAlign === "justify"} disabled={false} title="Justify">
                  <AlignJustify className="h-4 w-4" />
                </RibbonButton>
              </div>
            </div>
            <RibbonDivider />

            {/* Heading styles */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0.5">
                {[
                  { label: "H1", cmd: "<h1>" },
                  { label: "H2", cmd: "<h2>" },
                  { label: "H3", cmd: "<h3>" },
                  { label: "¶", cmd: "<p>", title: "Normal paragraph" },
                ].map(({ label, cmd, title }) => (
                  <button
                    key={label}
                    type="button"
                    title={title || label}
                    onClick={() => exec("formatBlock", cmd)}
                    className="rounded border border-[#d0d0d0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#333] hover:bg-[#e5e5e5] transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#888] text-center">Styles</span>
            </div>
          </>
        )}

        {activeTab === "Insert" && (
          <>
            <RibbonButton onClick={insertTable} active={false} disabled={false} title="Insert Table (3×3)">
              <div className="flex flex-col items-center gap-0.5">
                <Table className="h-5 w-5" />
                <span className="text-[10px]">Table</span>
              </div>
            </RibbonButton>
            <RibbonDivider />
            <RibbonButton onClick={insertLink} active={false} disabled={false} title="Insert Hyperlink">
              <div className="flex flex-col items-center gap-0.5">
                <Link2 className="h-5 w-5" />
                <span className="text-[10px]">Link</span>
              </div>
            </RibbonButton>
            <RibbonDivider />
            <RibbonButton onClick={() => exec("insertHorizontalRule")} active={false} disabled={false} title="Horizontal Rule">
              <div className="flex flex-col items-center gap-0.5">
                <div className="h-0.5 w-5 bg-[#555]" />
                <span className="text-[10px]">Line</span>
              </div>
            </RibbonButton>
            <RibbonDivider />
            <RibbonButton onClick={insertPageBreak} active={false} disabled={false} title="Insert Page Break">
              <div className="flex flex-col items-center gap-0.5">
                <FilePlus className="h-5 w-5" />
                <span className="text-[10px]">Page Break</span>
              </div>
            </RibbonButton>
          </>
        )}

        {activeTab === "View" && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#555]">Zoom:</span>
            <RibbonButton onClick={() => setZoom(z => Math.max(50, z - 10))} active={false} disabled={false} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </RibbonButton>
            <span className="w-10 text-center text-[12px] font-medium">{zoom}%</span>
            <RibbonButton onClick={() => setZoom(z => Math.min(200, z + 10))} active={false} disabled={false} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </RibbonButton>
            <button
              onClick={() => setZoom(100)}
              className="rounded border border-[#d0d0d0] bg-white px-2 py-0.5 text-[11px] hover:bg-[#e5e5e5] transition"
            >
              100%
            </button>
            <button
              onClick={() => setZoom(75)}
              className="rounded border border-[#d0d0d0] bg-white px-2 py-0.5 text-[11px] hover:bg-[#e5e5e5] transition"
            >
              75%
            </button>
            <button
              onClick={() => setZoom(125)}
              className="rounded border border-[#d0d0d0] bg-white px-2 py-0.5 text-[11px] hover:bg-[#e5e5e5] transition"
            >
              125%
            </button>
          </div>
        )}
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-[#d0d0d0] bg-white overflow-y-auto">
          <div className="border-b border-[#e0e0e0] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#666]">Documents</span>
              <div className="flex gap-1">
                <button
                  onClick={loadDocuments}
                  disabled={loading}
                  title="Refresh"
                  className="rounded p-1 text-[#666] hover:bg-[#f0f0f0] transition"
                >
                  {loading
                    ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCcw className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={resetDraft}
                  title="New document"
                  className="rounded p-1 text-[#303132] hover:bg-[#e8f0fc] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Blank document button */}
          <button
            type="button"
            onClick={resetDraft}
            className={`flex items-center gap-2 border-b border-[#e0e0e0] px-3 py-2.5 text-left transition hover:bg-[#e8f0fc] ${
              selectedId === null ? "bg-[#e8f0fc]" : ""
            }`}
          >
            <div className="flex h-8 w-6 items-center justify-center rounded border border-[#c0c0c0] bg-white shadow-sm">
              <Paperclip className="h-3.5 w-3.5 text-[#303132]" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#333]">Blank document</p>
              <p className="text-[11px] text-[#888]">New file</p>
            </div>
          </button>

          {documents.length === 0 && !loading && (
            <div className="px-3 py-4 text-[12px] text-[#999]">No documents yet.</div>
          )}
          {documents.map(doc => (
            <button
              key={doc._id}
              type="button"
              onClick={() => applyDocToEditor(doc)}
              className={`flex w-full items-start gap-2 border-b border-[#e8e8e8] px-3 py-2.5 text-left transition hover:bg-[#f5f8ff] ${
                doc._id === selectedId
                  ? "bg-[#e8f0fc] border-l-2 border-l-[#2b579a]"
                  : ""
              }`}
            >
              <div className="mt-0.5 flex h-8 w-6 shrink-0 items-center justify-center rounded border border-[#c8c8c8] bg-white shadow-sm">
                <FileText className="h-3.5 w-3.5 text-[#303132]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[#333]">{doc.title}</p>
                <p className="text-[11px] text-[#888]">{formatUpdatedAt(doc.updatedAt)}</p>
              </div>
            </button>
          ))}
        </aside>

        {/* ── Editor Area ── */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[#e8e8e8]">

          {/* Sub-toolbar: subtitle + actions */}
          <div className="flex items-center gap-3 border-b border-[#d0d0d0] bg-[#f3f3f3] px-4 py-1.5">
            <input
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Add subtitle or description..."
              className="flex-1 bg-transparent text-[12px] text-[#555] placeholder-[#aaa] focus:outline-none"
            />
            <div className="flex items-center gap-2 ml-auto">
              {selectedId && (
                <>
                  <a
                    href={`/api/documents/share/${activeDocument?.shareToken}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded border border-[#d0d0d0] bg-white px-2 py-1 text-[11px] text-[#333] hover:bg-[#f0f0f0] transition"
                  >
                    <FileDown className="h-3.5 w-3.5" /> .docx
                  </a>
                  <button
                    onClick={deleteDocument}
                    disabled={deleting}
                    className="flex items-center gap-1 rounded border border-[#ffcccc] bg-white px-2 py-1 text-[11px] text-[#c00] hover:bg-[#fff0f0] transition"
                  >
                    {deleting
                      ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Page canvas */}
          <div className="flex-1 overflow-auto bg-[#e8e8e8] px-8 py-8">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                // When zoomed out, compensate the height so scrollbar doesn't disappear
                marginBottom: zoom < 100 ? `${-(100 - zoom) * 9}px` : 0,
              }}
            >
              <div
                style={{ maxWidth: 850, margin: "0 auto" }}
                className="rounded-sm bg-white shadow-[0_2px_20px_rgba(0,0,0,0.18)]"
              >
                {/* 1-inch page margins */}
                <div className="px-24 py-24">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyUp={syncToolbarFromSelection}
                    onMouseUp={syncToolbarFromSelection}
                    onSelect={syncToolbarFromSelection}
                    style={{
                      minHeight: "864px", // ~9 inches at 96dpi
                      outline: "none",
                      lineHeight: 1.6,
                      fontFamily: "Calibri, Arial, sans-serif",
                      fontSize: "12pt",
                      color: "#000000",
                    }}
                    className="word-doc-editor"
                    data-placeholder="Start typing your document here..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-[#303132] bg-[#303132] px-4 py-1">
            <span className="text-[11px] text-white/70">
              {selectedId ? "Editing saved document" : "New document — unsaved"}
            </span>
            <span className="text-[11px] text-white/70">{zoom}%</span>
          </div>
        </main>
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && (
        <ShareModal
          shareUrl={shareUrl}
          onClose={() => setShowShareModal(false)}
          isShared={isShared}
          setIsShared={setIsShared}
        />
      )}

      <style jsx global>{`
        /* Placeholder */
        .word-doc-editor:empty::before {
          content: attr(data-placeholder);
          color: #bbb;
          pointer-events: none;
        }

        /* Heading styles matching Word defaults */
        .word-doc-editor h1 {
          font-size: 16pt; font-weight: bold; color: #2f5496;
          margin: 12pt 0 6pt; line-height: 1.3;
        }
        .word-doc-editor h2 {
          font-size: 13pt; font-weight: bold; color: #2f5496;
          margin: 10pt 0 4pt; line-height: 1.3;
        }
        .word-doc-editor h3 {
          font-size: 12pt; font-weight: bold; color: #1f3763;
          margin: 8pt 0 4pt; line-height: 1.3;
        }
        .word-doc-editor p { margin: 0 0 6pt; }

        /* Lists */
        .word-doc-editor ul { list-style: disc; margin: 0 0 6pt 1.5em; padding: 0; }
        .word-doc-editor ol { list-style: decimal; margin: 0 0 6pt 1.5em; padding: 0; }
        .word-doc-editor li { margin-bottom: 3pt; }

        /* Tables */
        .word-doc-editor table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        .word-doc-editor td, .word-doc-editor th {
          border: 1px solid #bbb; padding: 4pt 8pt; vertical-align: top;
        }
        .word-doc-editor th { background: #f2f2f2; font-weight: bold; }

        /* Links */
        .word-doc-editor a { color: #1155cc; text-decoration: underline; }

        /* Horizontal rule */
        .word-doc-editor hr { border: none; border-top: 1px solid #ccc; margin: 8pt 0; }

        /* Page break visual */
        .word-doc-editor .doc-page-break {
          page-break-before: always;
          border-top: 2px dashed #aaa;
          margin: 24px 0 8px;
          position: relative;
        }

        /* Print: honour page breaks */
        @media print {
          .word-doc-editor .doc-page-break { display: block; }
        }

        /* Remove number input spinners for cleaner look */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 1; }
      `}</style>
    </div>
  )
}