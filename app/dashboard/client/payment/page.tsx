// "use client"

// import { useSession } from "next-auth/react"
// import { useEffect, useState } from "react"

// export default function ClientPayment() {
//   const { data: session } = useSession()
//   const email = session?.user?.email

//   const [payments, setPayments] = useState([])

//   const load = async () => {
//     if (!email) return

//     const res = await fetch(`/api/payments?email=${email}`)
//     const data = await res.json()

//     setPayments(data.payments)
//   }

//   useEffect(() => {
//     if (email) load()
//   }, [email])

//   return (
//     <div className="p-6 space-y-4">
//       <h2 className="text-xl font-bold  text-black dark:text-white">My Payments</h2>

//       {payments.map((p:any)=>(
//         <div key={p._id} className="border p-4 text-black dark:text-white ">
//           <p>{p.title}</p>
//           <p>{p.description}</p>
//           <p><b>Total:</b> ₹{p.amount}</p>
//           <p><b>Paid:</b> ₹{p.totalFee}</p>
//         </div>
//       ))}
//     </div>
//   )
// }



"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"

export default function ClientPayment() {
  const { data: session } = useSession()
  const email = session?.user?.email

  const [payments, setPayments] = useState([])

  const load = useCallback(async () => {
    if (!email) return
    const res = await fetch(`/api/payments?email=${email}`)
    const data = await res.json()
    setPayments(data.payments || [])
  }, [email])

  useEffect(() => { if (email) load() }, [email, load])

  const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const totalFees = payments.reduce((sum: number, p: any) => sum + (p.totalFee || 0), 0)
  const totalDue  = totalFees - totalPaid

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Payments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {payments.length} record{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Fee",   value: `₹${totalFees.toLocaleString()}`,  color: "text-gray-900 dark:text-white" },
          { label: "Total Paid",  value: `₹${totalPaid.toLocaleString()}`,  color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Balance Due", value: `₹${totalDue.toLocaleString()}`,   color: totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-1 text-xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["#", "Title", "Description", "Total Fee", "Paid", "Balance"].map((col) => (
                  <th key={col}
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-gray-900/50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span className="text-sm">No payments found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p: any, index: number) => {
                  const balance = (p.totalFee || 0) - (p.amount || 0)
                  const isPaid  = balance <= 0

                  return (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">

                      {/* Index */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {p.title || "—"}
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {p.description || "—"}
                      </td>

                      {/* Total Fee */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          ₹{(p.totalFee || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{(p.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            ₹{balance.toLocaleString()} due
                          </span>
                        )}
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {payments.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
            Showing {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

    </div>
  )
}