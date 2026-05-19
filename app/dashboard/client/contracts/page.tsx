// "use client"

// import { useSession } from "next-auth/react"
// import { useEffect, useState } from "react"

// export default function ClientContracts() {
//   const { data: session } = useSession()

//   const email = session?.user?.email

//   const [contracts, setContracts] = useState([])

//   const [open, setOpen] = useState(false)
//   const [selectedId, setSelectedId] = useState(null)

//   const [signature, setSignature] = useState("")
//   const [date, setDate] = useState("")

//   // ✅ LOAD CONTRACTS
//   const loadContracts = async () => {
//     if (!email) return

//     const res = await fetch(`/api/contracts?email=${email}`)
//     const data = await res.json()

//     setContracts(data.contracts || [])
//   }

//   useEffect(() => {
//     if (email) {
//       loadContracts()
//     }
//   }, [email])

//   // ✅ HANDLE SIGN SUBMIT (PUT REQUEST)
//   const handleSubmit = async () => {
//     if (!signature || !date) {
//       alert("Please fill signature and date")
//       return
//     }

//     try {
//       console.log("Sending PUT for ID:", selectedId)

//       await fetch(`/api/contracts/${selectedId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           signature,
//           signedDate: date,
//         }),
//       })

//       // reset
//       setOpen(false)
//       setSignature("")
//       setDate("")
//       setSelectedId(null)

//       loadContracts()

//     } catch (err) {
//       console.error("Error signing contract:", err)
//     }
//   }

//   return (
//     <div className="p-6 space-y-4">

//       <h2 className="text-xl font-bold  text-black dark:text-white">
//         My Contracts
//       </h2>

//       {/* ✅ CONTRACT LIST */}
//       {contracts.map((c: any) => (
//         <div key={c._id} className="border p-4 rounded  text-black dark:text-white space-y-2">

//           <p>{c.description}</p>
//           <p>Status: {c.status}</p>

//           {/* ✅ SHOW SIGNED INFO */}
//           {c.signature && (
//             <p className="text-green-600 text-sm">
//               Signed on {new Date(c.signedDate).toLocaleDateString()}
//             </p>
//           )}

//           {/* ✅ SIGN BUTTON (ONLY IF NOT SIGNED) */}
//           {!c.signature && (
//             <button
//               onClick={() => {
//                 setSelectedId(c._id)
//                 setOpen(true)
//               }}
//               className="mt-2 px-3 py-1 bg-black text-white rounded"
//             >
//               Sign Contract
//             </button>
//           )}

//         </div>
//       ))}

//       {/* ✅ SIGN MODAL */}
//       {open && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded w-[320px] space-y-4  text-black dark:text-white">

//             <h3 className="text-lg font-semibold  text-black dark:text-white">Sign Contract</h3>

//             <input
//               type="text"
//               placeholder="Your Signature"
//               className="w-full border p-2 rounded"
//               value={signature}
//               onChange={(e) => setSignature(e.target.value)}
//             />

//             <input
//               type="date"
//               className="w-full border p-2 rounded"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//             />

//             <div className="flex gap-2">
//               <button
//                 onClick={() => setOpen(false)}
//                 className="flex-1 border p-2 rounded"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={handleSubmit}
//                 className="flex-1 bg-black text-white p-2 rounded"
//               >
//                 Submit
//               </button>
//             </div>

//           </div>
//         </div>
//       )}

//     </div>
//   )
// }




"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function ClientContracts() {
  const { data: session } = useSession()
  const email = session?.user?.email

  const [contracts, setContracts] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [signature, setSignature] = useState("")
  const [date, setDate] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingContract, setViewingContract] = useState(null)

  const loadContracts = useCallback(async () => {
    if (!email) return
    const res = await fetch(`/api/contracts?email=${email}`)
    const data = await res.json()
    setContracts(data.contracts || [])
  }, [email])

  useEffect(() => { if (email) loadContracts() }, [email, loadContracts])

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
      loadContracts()
    } catch (err) {
      console.error("Error signing contract:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewContract = (contract: any) => {
    setViewingContract(contract)
  }

  const signed = contracts.filter((c: any) => c.signature).length
  const pending = contracts.length - signed

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Contracts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: contracts.length, color: "" },
          { label: "Signed", value: signed, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pending", value: pending, color: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color || "text-gray-900 dark:text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["#", "Description", "Status", "Owner Signed On", "Signed On", "Action"].map((col) => (
                  <th key={col}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${col === "Action" ? "text-right" : "text-left"}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-gray-900/50">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="12" y2="17"/>
                      </svg>
                      <span className="text-sm">No contracts found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((c: any, index: number) => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">

                    {/* Index */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4">
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
                      {c.signature ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Owner Signed On */}
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {c.adminSignature && c.adminSignedDate
                        ? new Date(c.adminSignedDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                        : <span className="text-gray-300 dark:text-gray-700 italic text-xs">Not signed</span>}
                    </td>

                    {/* Signed On */}
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {c.signature && c.signedDate
                        ? new Date(c.signedDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                        : <span className="text-gray-300 dark:text-gray-700 italic text-xs">Not signed</span>}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {!c.signature && (
                        <button
                          onClick={() => { setSelectedId(c._id); setOpen(true) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                            bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-80"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {contracts.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
            Showing {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Sign Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden
            bg-white dark:bg-zinc-900
            border border-gray-200 dark:border-white/10">

            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/10">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-gray-600 dark:text-gray-300">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sign Contract</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Enter your signature and date to confirm</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20
                  text-gray-500 dark:text-gray-400"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
                  Your Signature
                </label>
                <div className="relative">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Type your full name"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none transition-all
                      bg-gray-50 dark:bg-white/5
                      border border-gray-200 dark:border-white/10
                      text-gray-900 dark:text-white
                      placeholder:text-gray-400 dark:placeholder:text-gray-600
                      focus:border-gray-400 dark:focus:border-white/30
                      focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all
                    bg-gray-50 dark:bg-white/5
                    border border-gray-200 dark:border-white/10
                    text-gray-900 dark:text-white
                    focus:border-gray-400 dark:focus:border-white/30
                    focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all disabled:opacity-60
                    bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90"
                >
                  {submitting && (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  )}
                  {submitting ? "Submitting…" : "Confirm Signature"}
                </button>
                <button
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
            </div>
          </div>
        </div>
      )}

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

              {/* Details Grid */}
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

              {/* Description - Full */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {viewingContract.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setViewingContract(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    border border-gray-200 dark:border-white/10
                    bg-white dark:bg-white/5
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}