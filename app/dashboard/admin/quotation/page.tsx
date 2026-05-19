"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import QuotationForm from "@/components/quotationForm"

// ─── Download the actual uploaded file, converting to PDF via Cloudinary if needed ─
function getDownloadUrl(q: any): string | null {
  if (!q.fileUrl) return null

  const url: string = q.fileUrl

  // Already a PDF — return as-is
  if (url.includes(".pdf") || url.includes("f_pdf")) return url

  // Cloudinary URL — inject fl_attachment,f_pdf transformation to force PDF download
  // e.g. https://res.cloudinary.com/demo/image/upload/v123/file.docx
  //   → https://res.cloudinary.com/demo/image/upload/fl_attachment,f_pdf/v123/file.docx
  if (url.includes("cloudinary.com")) {
    // Insert transformation after /upload/
    return url.replace("/upload/", "/upload/fl_attachment,f_pdf/")
  }

  // Fallback: return as-is and let the browser handle it
  return url
}

async function handleDownloadPDF(q: any, setDownloading: (id: string | null) => void) {
  const downloadUrl = getDownloadUrl(q)

  if (!downloadUrl) {
    alert("No file attached to this quotation.")
    return
  }

  setDownloading(q._id)

  try {
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error("Failed to fetch file")

    const blob = await response.blob()

    // Force the filename to end in .pdf
    const filename = `Quotation-${(q.title || "document").replace(/\s+/g, "-")}.pdf`

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error("Download failed:", err)
    // Fallback: open in new tab so user can save manually
    window.open(downloadUrl, "_blank")
  } finally {
    setDownloading(null)
  }
}

export default function QuotationPage() {
  const [data, setData] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [quotRes, clientRes] = await Promise.all([
        fetch("/api/quotations"),
        fetch("/api/users/list"),
      ])

      try {
        const j = JSON.parse(await quotRes.text())
        setData(j.quotations || [])
      } catch { console.error("Failed to parse quotations") }

      try {
        const j = JSON.parse(await clientRes.text())
        setClients((j.users || []).filter((u: any) => u.role === "client"))
      } catch { console.error("Failed to parse clients") }
    } catch (err) {
      console.error("Error loading data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleEditClick = (q: any) => {
    setEditingId(q._id)
    setEditingData(q)
    setOpen(true)
  }

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) { alert(result.error || "Failed to delete quotation"); return }
      setData((prev) => prev.filter((q) => q._id !== id))
      alert("Quotation deleted successfully")
    } catch (err: any) {
      alert(err.message || "An error occurred")
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseModal = () => { setOpen(false); setEditingId(null); setEditingData(null) }
  const handleSuccess = () => { handleCloseModal(); loadData() }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quotations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data.length} quotation{data.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setEditingData(null); setOpen(true) }}>
          + Add Quotation
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["#", "Title", "Client", "Description", "Document", "Actions"].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    <p className="text-sm">Loading...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="12" y2="17"/>
                      </svg>
                      <span className="text-sm">No quotations yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((q: any, index: number) => (
                  <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {q.title || "—"}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {q.recipientUserId?.name || "—"}
                      {q.recipientUserId?.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{q.recipientUserId.email}</div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-sm truncate">
                      {q.description || "—"}
                    </td>

                    {/* Download actual uploaded file as PDF */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {q.fileUrl ? (
                        <button
                          onClick={() => handleDownloadPDF(q, setDownloading)}
                          disabled={downloading === q._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60
                            border border-gray-200 dark:border-white/10
                            bg-white dark:bg-white/5
                            text-gray-700 dark:text-gray-300
                            hover:border-gray-400 dark:hover:border-white/30
                            hover:text-gray-900 dark:hover:text-white"
                        >
                          {downloading === q._id ? (
                            <>
                              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                              Downloading…
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v13M7 11l5 5 5-5"/><path d="M4 18h16"/>
                              </svg>
                              Download PDF
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600 italic">No file</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(q)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                            border border-gray-200 dark:border-white/10
                            bg-white dark:bg-white/5
                            text-gray-700 dark:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(q._id)}
                          disabled={deleting}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60
                            border border-red-200 dark:border-red-900/30
                            bg-red-50 dark:bg-red-900/20
                            text-red-700 dark:text-red-400
                            hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
            Showing {data.length} quotation{data.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <QuotationForm
        open={open}
        setOpen={handleCloseModal}
        onSuccess={handleSuccess}
        quotationId={editingId}
        initialData={editingData}
        clients={clients}
      />
    </div>
  )
}