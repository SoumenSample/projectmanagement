"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"

export default function EmployeeContractsPage() {
  const { data: session } = useSession()
  const [contracts, setContracts] = useState([])
  const [viewingContract, setViewingContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingId, setSigningId] = useState(null)
  const [signatureForm, setSignatureForm] = useState({
    signature: "",
    date: new Date().toISOString().split('T')[0],
  })

  const loadContracts = async () => {
    setLoading(true)
    try {
      if (!session?.user?.email) return

      const res = await fetch(`/api/contracts?email=${session.user.email}&recipientType=employee`)
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
    if (session?.user?.email) {
      loadContracts()
    }
  }, [session?.user?.email])

  const handleViewContract = (contract: any) => {
    setViewingContract(contract)
  }

  const handleSignContract = (contractId: string) => {
    setSigningId(contractId)
    setSignatureForm({
      signature: "",
      date: new Date().toISOString().split('T')[0],
    })
  }

  const submitSignature = async () => {
    if (!signatureForm.signature.trim()) {
      alert("Please enter your signature (name)")
      return
    }

    try {
      const res = await fetch(`/api/contracts/${signingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: signatureForm.signature.trim(),
          signedDate: signatureForm.date,
        }),
      })

      if (res.ok) {
        alert("Contract signed successfully!")
        setSigningId(null)
        setViewingContract(null)
        loadContracts()
      } else {
        alert("Error signing contract")
      }
    } catch (error) {
      console.error("Error signing contract:", error)
      alert("Error signing contract")
    }
  }

  const getStatusBadge = (contract: any) => {
    const status = (contract?.status || "pending").toLowerCase()
    const isSigned = status === "signed" || status === "completed" || !!contract?.signature

    if (isSigned) {
      return {
        label: "Signed",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
      }
    }

    return {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    }
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Contracts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["Reference", "Description", "Status", "Issued Date", "Actions"].map((col) => (
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
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
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
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="12" y2="17"/>
                      </svg>
                      <span className="text-sm">No contracts assigned yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((c: any) => {
                  const statusBadge = getStatusBadge(c)

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Issued Date */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {c.createdDate
                          ? new Date(c.createdDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {c.status !== "completed" && !c.signature ? (
                            <button
                              onClick={() => handleSignContract(c._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              </svg>
                              Sign
                            </button>
                          ) : c.signature ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Signed
                            </span>
                          ) : null}
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
            Showing {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

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
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingContract).className}`}>
                    {getStatusBadge(viewingContract).icon}
                    {getStatusBadge(viewingContract).label}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reference</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">{viewingContract.reference || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Issued Date</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {viewingContract.createdDate
                      ? new Date(viewingContract.createdDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Owner Signature</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{viewingContract.adminSignature || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Your Signature</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{viewingContract.signature || "—"}</p>
                </div>
                {viewingContract.signedDate && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signed Date</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {new Date(viewingContract.signedDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Description - Full */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contract Terms</label>
                <div className="mt-2 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all overflow-wrap-break-word">
                    {viewingContract.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                {viewingContract.status !== "completed" && !viewingContract.signature ? (
                  <Button
                    onClick={() => handleSignContract(viewingContract._id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Sign Contract
                  </Button>
                ) : null}
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

      {/* ── Signature Modal ── */}
      <Dialog open={!!signingId} onOpenChange={(isOpen) => !isOpen && setSigningId(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Sign Contract</DialogTitle>
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sign Contract</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Please enter your signature and date
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Full Name (Signature)</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={signatureForm.signature}
                  onChange={(e) => setSignatureForm({ ...signatureForm, signature: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Signature Date</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={signatureForm.date}
                  onChange={(e) => setSignatureForm({ ...signatureForm, date: e.target.value })}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
              <Button
                variant="outline"
                onClick={() => setSigningId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSignature}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
