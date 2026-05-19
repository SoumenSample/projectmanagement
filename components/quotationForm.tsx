"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function QuotationForm({
  open,
  setOpen,
  onSuccess,
  quotationId = null,
  initialData = null,
  clients = [],
}: any) {
  const [form, setForm] = useState({ title: "", description: "", recipientUserId: "" })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        recipientUserId: initialData.recipientUserId?._id || initialData.recipientUserId || "",
      })
      setFile(null)
      setError("")
    } else {
      setForm({ title: "", description: "", recipientUserId: "" })
      setFile(null)
      setError("")
    }
  }, [initialData, open])

  // Only accept PDF on file pick
  const handleFileChange = (picked: File | null) => {
    if (!picked) { setFile(null); return }
    if (picked.type !== "application/pdf") {
      setError("Only PDF files are accepted. Please upload a PDF.")
      return
    }
    setError("")
    setFile(picked)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileChange(e.dataTransfer.files?.[0] ?? null)
  }

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!form.recipientUserId) {
      setError("Please select a client")
      setSubmitting(false)
      return
    }

    try {
      let fileUrl = initialData?.fileUrl || ""

      // Upload the PDF to Cloudinary
      if (file) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          setError(uploadData.error || "Failed to upload file")
          setSubmitting(false)
          return
        }

        fileUrl = uploadData.url
      }

      const formData = new FormData()
      formData.append("title", form.title)
      formData.append("description", form.description)
      formData.append("recipientUserId", form.recipientUserId)
      formData.append("fileUrl", fileUrl)

      const method = quotationId ? "PUT" : "POST"
      const url = quotationId ? `/api/quotations/${quotationId}` : "/api/quotations"

      const res = await fetch(url, { method, body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save quotation")
        setSubmitting(false)
        return
      }

      setForm({ title: "", description: "", recipientUserId: "" })
      setFile(null)
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <div>
            <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
              {quotationId ? "Edit Quotation" : "New Quotation"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400 dark:text-gray-500">
              Fill in the details and attach your PDF document
            </DialogDescription>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Client */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
              Assign To Client *
            </label>
            <select
              value={form.recipientUserId}
              onChange={(e) => setForm({ ...form, recipientUserId: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all
                bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                text-gray-900 dark:text-white
                focus:border-gray-400 dark:focus:border-white/30
                focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10"
            >
              <option value="" className="bg-gray-900 text-white">Select a client</option>
              {clients.map((client: any) => (
                <option key={client._id} value={client._id} className="bg-gray-900 text-white">
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
              Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Web Design Proposal Q2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all
                bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600
                focus:border-gray-400 dark:focus:border-white/30
                focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
              Description
            </label>
            <textarea
              placeholder="Briefly describe the scope, terms, or notes…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none
                bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600
                focus:border-gray-400 dark:focus:border-white/30
                focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10"
            />
          </div>

          {/* File upload — PDF only */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
              PDF Document <span className="normal-case font-normal text-gray-400">(required — PDF only)</span>
            </label>

            {file ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                border border-emerald-200 dark:border-emerald-700/40
                bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    bg-emerald-100 dark:bg-emerald-900/40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">{file.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 transition-colors
                    text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300
                    hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                {/* Show existing file info when editing */}
                {initialData?.fileUrl && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      A PDF is already attached. Upload a new one to replace it.
                    </p>
                  </div>
                )}

                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg cursor-pointer transition-all border-2 border-dashed
                    ${dragOver
                      ? "border-gray-400 dark:border-white/40 bg-gray-100 dark:bg-white/10"
                      : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500">
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Drop PDF here or <span className="text-gray-900 dark:text-white underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">PDF files only</p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all disabled:opacity-60
                bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90"
            >
              {submitting && (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
              {submitting ? "Saving…" : quotationId ? "Update Quotation" : "Submit Quotation"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-lg text-sm font-semibold transition-colors
                border border-gray-200 dark:border-white/10
                bg-white dark:bg-white/5
                text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}