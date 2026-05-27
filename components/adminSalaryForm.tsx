"use client"

import { useEffect, useState } from "react"
import { useNotification } from "@/hooks/useNotification"

export default function AdminSalaryForm({ open, setOpen, onSuccess, editData }) {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employeeId: "", amount: "", description: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const notify = useNotification()

  useEffect(() => {
    if (open) fetchEmployees()
  }, [open])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/users/list')
      const text = await res.text()
      let parsed = null
      try {
        parsed = text ? JSON.parse(text) : null
      } catch (err) {
        console.error('Failed to parse /api/users/list response', err, text)
      }

      let all = []
      if (Array.isArray(parsed)) all = parsed
      else if (parsed && Array.isArray(parsed.users)) all = parsed.users
      else if (parsed && Array.isArray(parsed.usersWithUnread)) all = parsed.usersWithUnread

      const list = (all || []).filter((u) => String(u.role || '').toLowerCase() === 'employee')
      setEmployees(list)
    } catch (err) {
      console.error('Failed to load employees', err)
    }
  }

  useEffect(() => {
    if (!open) {
      setForm({ employeeId: "", amount: "", description: "" })
      setError("")
    }
    // when opening for edit, populate form
    if (open && editData) {
      setForm({
        employeeId: editData.employee?._id || editData.employee || "",
        amount: editData.amount?.toString?.() ?? `${editData.amount ?? ""}`,
        description: editData.description || "",
      })
    }
  }, [open, editData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.employeeId) {
      setError('Please select an employee')
      return
    }
    const amount = Number(form.amount) || 0
    if (amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const method = editData ? 'PUT' : 'POST'
      const url = editData ? `/api/payments/${editData._id}` : '/api/payments'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData?.title || `Salary`,
          description: form.description || 'Salary payment',
          amount,
          totalFee: amount,
          employee: form.employeeId,
        }),
      })

      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch (err) {
        data = null
      }

      if (!res.ok) {
        const message = (data && (data.error || data.message)) || text || `Request failed with status ${res.status}`
        throw new Error(message)
      }

      notify.success(editData ? 'Salary updated' : 'Salary recorded', editData ? 'Employee salary updated successfully' : 'Employee salary recorded successfully')
      setOpen(false)
      onSuccess && onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      notify.error('Save failed', msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-11000 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e)=>{ if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-visible bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300">
                <path d="M12 2v6" />
                <path d="M6 10v6" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Salary</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Assign salary to an employee</p>
            </div>
          </div>
          <button type="button" onClick={()=>setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">Employee</label>
            <div>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                required
                className="w-full h-10 px-3 rounded-lg text-sm outline-none bg-gray-50 dark:bg-zinc-800 dark:text-white border border-gray-200 dark:border-white/10 text-gray-900 appearance-none"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id} className="dark:bg-zinc-800 dark:text-white">
                    {emp.name ? `${emp.name} — ${emp.email}` : emp.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500">₹</span>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount: e.target.value})} required className="w-full h-10 pl-7 pr-3 rounded-lg text-sm outline-none font-mono bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">Description</label>
            <textarea value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 bg-gray-900 text-white dark:bg-white dark:text-black hover:opacity-90">
              {submitting ? 'Saving…' : 'Save Salary'}
            </button>
            <button type="button" onClick={()=>setOpen(false)} className="h-10 px-4 rounded-lg text-sm font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
