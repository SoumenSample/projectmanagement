"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"

export default function EmployeePayment() {
  const { data: session } = useSession()
  const email = session?.user?.email

  const [payments, setPayments] = useState([])

  const load = useCallback(async () => {
    // API will use session to filter employee payments
    const res = await fetch(`/api/payments`)
    const data = await res.json()
    setPayments(data.payments || [])
  }, [])

  useEffect(() => { load() }, [load])

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalFees = payments.reduce((sum, p) => sum + (p.totalFee || 0), 0)
  const totalDue  = totalFees - totalPaid
  // Compute received this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const receivedThisMonth = payments.reduce((sum, p) => {
    const d = p?.createdAt ? new Date(p.createdAt) : null
    if (!d) return sum
    if (d >= startOfMonth && d < startOfNextMonth) return sum + (p.amount || 0)
    return sum
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Payments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {payments.length} record{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        {[
          { label: "Total Received", value: `₹${totalPaid.toLocaleString()}` },
          { label: "Received This Month", value: `₹${receivedThisMonth.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-1 text-xl font-bold font-mono`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {['#', 'Title', 'Description', 'Total Fee', 'Paid', 'Balance'].map((col)=> (
                  <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
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
                payments.map((p, index)=>{
                  const balance = (p.totalFee || 0) - (p.amount || 0)
                  const isPaid = balance <= 0
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{index+1}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{p.title || '—'}</td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{p.description || '—'}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-gray-700 dark:text-gray-300">₹{(p.totalFee || 0).toLocaleString()}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">₹{(p.amount || 0).toLocaleString()}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">₹{balance.toLocaleString()} due</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
