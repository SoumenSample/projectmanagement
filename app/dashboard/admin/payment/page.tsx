// "use client"

// import { useEffect, useState } from "react"
// import PaymentForm from "@/components/paymentForm"

// export default function AdminPayment() {
//   const [payments, setPayments] = useState([])
//   const [open, setOpen] = useState(false)
//   const [editData, setEditData] = useState(null)

//   const load = async () => {
//     const res = await fetch("/api/payments")
//     const data = await res.json()
//     setPayments(data.payments)
//   }

//   useEffect(() => { load() }, [])

//   return (
//     <div className="p-6 space-y-4">

//       <div className="flex justify-between text-black dark:text-white dark:bg-black">
//         <h2 className="text-xl font-bold">Payments</h2>
//         <button onClick={()=>{setEditData(null); setOpen(true)}} className="bg-black text-white px-3 py-1">
//           Add Payment
//         </button>
//       </div>

//       {payments.map((p:any)=>(
//         <div key={p._id} className="border p-4 text-black dark:text-white dark:bg-black rounded">
//           <p>{p.title}</p>
//           <p>{p.clientEmail}</p>
//           <p>₹{p.amount} / ₹{p.totalFee}</p>

//           <button
//             onClick={()=>{
//               setEditData(p)
//               setOpen(true)
//             }}
//             className="mt-2 text-blue-500"
//           >
//             Edit
//           </button>
//         </div>
//       ))}

//       <PaymentForm open={open} setOpen={setOpen} onSuccess={load} editData={editData} />
//     </div>
//   )
// }
"use client"

import { useCallback, useEffect, useState } from "react"
import PaymentForm from "@/components/paymentForm"
import AdminSalaryForm from "@/components/adminSalaryForm"
import AdminVendorForm from "@/components/adminVendorForm"
import { useNotification } from "@/hooks/useNotification"

export default function AdminPayment() {
  const [payments, setPayments] = useState([])
  const [open, setOpen] = useState(false)
  const [openSalary, setOpenSalary] = useState(false)
  const [openVendor, setOpenVendor] = useState(false)
  const [editData, setEditData] = useState(null)
  const [salaryEditData, setSalaryEditData] = useState(null)
  const [vendorEditData, setVendorEditData] = useState(null)
  const notify = useNotification()

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/payments")
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load payments.")
      }

      setPayments(data.payments)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load payments."
      notify.error("Payments unavailable", message)
    }
  }, [notify])

  useEffect(() => { load() }, [load])

  const handleAddPayment = () => {
    setEditData(null)
    setSalaryEditData(null)
    setOpen(true)
    notify.info(
      "Add payment opened",
      "Fill in the payment details to record a new entry.",
      { sourceTab: "payment", route: "/dashboard/admin/payment", autoClose: false }
    )
  }

  const handleEditPayment = (payment) => {
    // If this payment targets an employee, open the salary editor
    if (payment?.employee) {
      setSalaryEditData(payment)
      setOpenSalary(true)
      notify.info(
        "Edit salary opened",
        `Editing salary for ${payment.employee?.name || payment.employee || "employee"}.`,
        { sourceTab: "payment", route: "/dashboard/admin/payment", autoClose: false }
      )
      return
    }

    // If this payment targets a vendor, open vendor editor
    if (payment?.vendor) {
      setVendorEditData(payment)
      setOpenVendor(true)
      notify.info(
        "Edit vendor payment opened",
        `Editing payment for ${payment.vendor?.name || payment.vendor || "vendor"}.`,
        { sourceTab: "payment", route: "/dashboard/admin/payment", autoClose: false }
      )
      return
    }

    setEditData(payment)
    setOpen(true)
    notify.info(
      "Edit payment opened",
      `Editing ${payment.title || "payment"}.`,
      { sourceTab: "payment", route: "/dashboard/admin/payment", autoClose: false }
    )
  }

  const handleDeletePayment = async (payment) => {
    const ok = window.confirm(`Delete payment "${payment.title || payment._id}"? This cannot be undone.`)
    if (!ok) return

    try {
      const res = await fetch(`/api/payments/${payment._id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete payment.")
      }

      notify.success("Payment deleted", "Payment removed successfully.")
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      notify.error("Delete failed", message)
    }
  }

        const [view, setView] = useState("clients")

        const clientPayments = payments.filter((p:any) => !p.employee && !p.vendor)
        const employeePayments = payments.filter((p:any) => !!p.employee)
        const vendorPayments = payments.filter((p:any) => !!p.vendor)
        const visiblePayments = view === "clients" ? clientPayments : view === "employees" ? employeePayments : vendorPayments

        const totalRecords = visiblePayments.length
        const totalAmount = visiblePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        const totalFees = visiblePayments.reduce((sum: number, p: any) => sum + (p.totalFee || 0), 0)

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {payments.length} record{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div />
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {view === "employees" || view === "vendors" ? (
          [
            { label: "Total Records", value: totalRecords, mono: false },
            { label: "Total Expenses", value: `₹${totalAmount.toLocaleString()}`, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          ))
        ) : (
          [
            { label: "Total Records", value: totalRecords, mono: false },
            { label: "Total Collected", value: `₹${totalAmount.toLocaleString()}`, mono: true },
            { label: "Total Fees", value: `₹${totalFees.toLocaleString()}`, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          ))
        )}
      </div>

      {/* ── View Toggle / Actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-gray-50 dark:bg-white/5 p-1 inline-flex">
            <button
              onClick={() => setView("clients")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${view === "clients" ? "bg-gray-900 text-white dark:bg-white dark:text-black" : "text-gray-700 dark:text-gray-300"}`}
            >
              Clients
            </button>
            <button
              onClick={() => setView("employees")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${view === "employees" ? "bg-gray-900 text-white dark:bg-white dark:text-black" : "text-gray-700 dark:text-gray-300"}`}
            >
              Employees
            </button>
            <button
              onClick={() => setView("vendors")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${view === "vendors" ? "bg-gray-900 text-white dark:bg-white dark:text-black" : "text-gray-700 dark:text-gray-300"}`}
            >
              Vendors
            </button>
          </div>

          {view === "clients" ? (
            <button
              onClick={handleAddPayment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Payment
            </button>
          ) : view === 'employees' ? (
            <button
              onClick={() => { setOpenSalary(true); notify.info('Add salary opened', 'Fill employee, amount and description', { sourceTab: 'payment', route: '/dashboard/admin/payment', autoClose: false }) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:opacity-90 transition-opacity"
            >
              Add Salary
            </button>
          ) : (
            <button
              onClick={() => { setOpenVendor(true); notify.info('Add vendor payment opened', 'Fill vendor, amount and description', { sourceTab: 'payment', route: '/dashboard/admin/payment', autoClose: false }) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:opacity-90 transition-opacity"
            >
              Add Vendor Payment
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {["Title", "Recipient", "Paid", "Total Fee", "Balance", "Actions"].map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${col === "Actions" ? "text-right" : "text-left"}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-gray-50 dark:bg-white/5">
              {visiblePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span className="text-sm">No payments recorded yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePayments.map((p: any) => {
                  const balance = (p.totalFee || 0) - (p.amount || 0)
                  const isPaid = balance <= 0

                  return (
                    <tr key={p._id} className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      {/* Title */}
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {p.title || "—"}
                      </td>

                      {/* Recipient */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {p.employee ? (
                          typeof p.employee === 'object' ? (p.employee.name || p.employee.email || p.employee._id) : 'Employee'
                        ) : p.vendor ? (
                          typeof p.vendor === 'object' ? (p.vendor.name || p.vendor.email || p.vendor._id) : 'Vendor'
                        ) : (
                          p.clientEmail || "—"
                        )}
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{(p.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Total Fee */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          ₹{(p.totalFee || 0).toLocaleString()}
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

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditPayment(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeletePayment(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-600 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

        {/* Footer */}
        {visiblePayments.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
            Showing {visiblePayments.length} payment{visiblePayments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <PaymentForm open={open} setOpen={setOpen} onSuccess={load} editData={editData} />
      <AdminSalaryForm open={openSalary} setOpen={setOpenSalary} onSuccess={() => { setSalaryEditData(null); load() }} editData={salaryEditData} />
      <AdminVendorForm open={openVendor} setOpen={setOpenVendor} onSuccess={() => { setVendorEditData(null); load() }} editData={vendorEditData} />
    </div>
  )
}