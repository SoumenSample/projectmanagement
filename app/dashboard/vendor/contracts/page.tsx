"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function VendorContractsPage() {
  const { data: session } = useSession()
  const email = session?.user?.email

  const [contracts, setContracts] = useState([])
  const [viewingContract, setViewingContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [signature, setSignature] = useState("")
  const [date, setDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadContracts = useCallback(async () => {
    setLoading(true)
    try {
      if (!email) return

      const res = await fetch(`/api/contracts?email=${email}&recipientType=vendor`)
      const data = await res.json()
      setContracts(data.contracts || [])
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (email) loadContracts()
  }, [email, loadContracts])

  const handleSubmit = async () => {
    if (!signature || !date) {
      alert("Please fill signature and date")
      return
    }
    setSubmitting(true)
    try {
      await fetch(`/api/contracts/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, signedDate: date }),
      })
      setOpen(false)
      setSignature("")
      setDate("")
      setSelectedId(null)
      await loadContracts()
    } catch (err) {
      console.error("Error signing contract:", err)
      alert("Error signing contract")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partner Contracts</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {contracts.length} contract{contracts.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["Reference", "Description", "Status", "Issued Date", "Actions"].map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${col === "Actions" ? "text-right" : "text-left"}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-gray-50 dark:bg-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">Loading...</td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">No contracts assigned yet</td>
                </tr>
              ) : contracts.map((contract: any) => (
                <tr key={contract._id} className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">{contract.reference || "—"}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    <button onClick={() => setViewingContract(contract)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      View
                    </button>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-900 dark:text-white">{contract.status || "pending"}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {contract.createdDate ? new Date(contract.createdDate).toLocaleDateString() : "—"}
                  </td>
                  
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {!contract.signature && (
                          <button
                            onClick={() => { setSelectedId(contract._id); setOpen(true) }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-80"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Sign
                          </button>
                        )}
                        {contract.signature && (
                          <span className="inline-flex items-center text-sm text-gray-400">Signed</span>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewingContract} onOpenChange={(isOpen) => !isOpen && setViewingContract(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Contract Details</DialogTitle>
          {viewingContract && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Contract Details</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    viewingContract.signature
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {viewingContract.signature ? "Signed" : "Pending"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reference</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{viewingContract.reference || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signed On</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {viewingContract.signedDate
                      ? new Date(viewingContract.signedDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                      : "Not signed yet"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Owner Signature</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{viewingContract.adminSignature || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Owner Signed On</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {viewingContract.adminSignedDate
                      ? new Date(viewingContract.adminSignedDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                      : "Not signed yet"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Your Signature</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{viewingContract.signature || "—"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{viewingContract.description || "No description provided"}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                <button onClick={() => setViewingContract(null)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10">Close</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/10">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sign Contract</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Enter your signature and date to confirm</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">Your Signature</label>
                <div className="relative">
                  <input type="text" placeholder="Type your full name" value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full h-10 pl-3 pr-3 rounded-lg text-sm outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90">
                  {submitting ? "Submitting…" : "Confirm Signature"}
                </button>
                <button onClick={() => setOpen(false)} className="h-10 px-4 rounded-lg text-sm font-semibold transition-colors border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}