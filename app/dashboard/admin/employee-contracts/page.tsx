"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import ContractForm from "@/components/contactForm"

export default function EmployeeContractsPage() {
  const [contracts, setContracts] = useState([])
  const [open, setOpen] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadContracts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/contracts?recipientType=employee")
      const data = await res.json()
      setContracts(data.contracts || [])
      console.log("Employee Contracts:", data.contracts)
    } catch (error) {
      console.error("Error loading contracts:", error)
      alert("Error loading contracts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) return

    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setContracts(contracts.filter((c) => c._id !== id))
      } else {
        alert("Failed to delete contract")
      }
    } catch (error) {
      console.error("Error deleting contract:", error)
      alert("Error deleting contract")
    }
  }

  const handleEdit = (contract: any) => {
    setEditingContract(contract)
    setOpen(true)
  }

  const handleFormClose = () => {
    setOpen(false)
    setEditingContract(null)
  }

  const handleFormSuccess = () => {
    loadContracts()
    handleFormClose()
  }

  const handleViewContract = (contract: any) => {
    setViewingContract(contract)
  }

  const statusStyles: Record<string, string> = {
    signed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
    rejected: "bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400",
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Employee Contracts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          + Issue Contract
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["Employee Email", "Reference", "Description", "Status", "Signed Date", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-gray-50 dark:bg-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 animate-spin">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="12" y2="17"/>
                      </svg>
                      <span className="text-sm">No employee contracts yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((c: any) => {
                  const status = (c.status || "pending").toLowerCase()
                  const badgeClass = statusStyles[status] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      {/* Employee Email */}
                      <td className="px-5 py-4 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {c.employeeEmail || "—"}
                      </td>

                      {/* Reference */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                          {c.reference || "—"}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        <button
                          onClick={() => handleViewContract(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors whitespace-nowrap"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          View
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${badgeClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {c.status || "pending"}
                        </span>
                      </td>

                      {/* Signed Date */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {c.signedDate
                          ? new Date(c.signedDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        {contracts.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
            Showing {contracts.length} record{contracts.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <ContractForm
        open={open}
        setOpen={handleFormClose}
        onSuccess={handleFormSuccess}
        initialData={editingContract}
      />

      {/* ── Contract Detail Modal ── */}
      <Dialog open={!!viewingContract} onOpenChange={(isOpen) => !isOpen && setViewingContract(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Contract Details</DialogTitle>
          {viewingContract && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Contract Details</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[(viewingContract.status || "pending").toLowerCase()] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {viewingContract.status || "pending"}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Employee Email</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{viewingContract.employeeEmail || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reference</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{viewingContract.reference || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signed Date</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {viewingContract.signedDate
                      ? new Date(viewingContract.signedDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signature</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{viewingContract.signature || "—"}</p>
                </div>
              </div>

              {/* Description - Full */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all overflow-wrap-break-word">
                    {viewingContract.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button
                  onClick={() => setViewingContract(null)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
