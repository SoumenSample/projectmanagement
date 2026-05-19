"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function ContractForm({ open, setOpen, onSuccess, initialData = null, initialRecipientType = "client" }) {
  const [form, setForm] = useState({
    description: "",
    validFrom: "",
    validTo: "",
    adminSignature: "",
    reference: "",
    clientEmail: "",
    employeeEmail: "",
    recipientType: initialRecipientType,
  })

  const [recipients, setRecipients] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        description: initialData.description || "",
        validFrom: initialData.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : "",
        validTo: initialData.validTo ? new Date(initialData.validTo).toISOString().split('T')[0] : "",
        adminSignature: initialData.adminSignature || "",
        reference: initialData.reference || "",
        clientEmail: initialData.clientEmail || "",
        employeeEmail: initialData.employeeEmail || "",
        recipientType: initialData.recipientType || "client",
      })
    } else {
      setForm({
        description: "",
        validFrom: "",
        validTo: "",
        adminSignature: "",
        reference: "",
        clientEmail: "",
        employeeEmail: "",
        recipientType: initialRecipientType,
      })
    }
  }, [initialData, open, initialRecipientType])

  // Fetch recipients when dialog opens or recipientType changes
  useEffect(() => {
    if (open) {
      fetchRecipients(form.recipientType)
    }
  }, [open, form.recipientType, initialData])

  const fetchRecipients = async (type: string) => {
    setLoadingRecipients(true)
    try {
      const res = await fetch(`/api/recipients?role=${type}`)
      const data = await res.json()
      setRecipients(data.recipients || [])
    } catch (error) {
      console.error("Error fetching recipients:", error)
      alert("Error loading recipients")
    } finally {
      setLoadingRecipients(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const recipientEmail = form.recipientType === "employee" ? form.employeeEmail : form.clientEmail

    if (!recipientEmail) {
      alert(`Please select a ${form.recipientType === "employee" ? "employee" : "client"}`)
      return
    }

    if (!form.description.trim()) {
      alert("Please enter contract description")
      return
    }

    if (!form.reference.trim()) {
      alert("Please enter reference")
      return
    }

    // Validate validity dates if provided
    if (form.validFrom && form.validTo) {
      const from = new Date(form.validFrom)
      const to = new Date(form.validTo)
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        alert("Please enter valid dates for the contract validity period")
        return
      }
      if (to.getTime() < from.getTime()) {
        alert("Contract end date must be on or after start date")
        return
      }
    }

    setSubmitting(true)
    try {
      const method = initialData ? "PUT" : "POST"
      const url = initialData ? `/api/contracts/${initialData._id}` : "/api/contracts"

      // Build clean request body
        const requestBody: any = {
        description: form.description.trim(),
        reference: form.reference.trim(),
        recipientType: form.recipientType,
      }

      const adminSignature = form.adminSignature.trim()
      if (adminSignature) requestBody.adminSignature = adminSignature

      if (form.recipientType === "employee") {
        requestBody.employeeEmail = form.employeeEmail.toLowerCase().trim()
      } else {
        requestBody.clientEmail = form.clientEmail.toLowerCase().trim()
      }

      // Add optional fields if editing
      if (initialData) {
        if (form.validFrom) requestBody.validFrom = form.validFrom
        if (form.validTo) requestBody.validTo = form.validTo
      }

      // When creating, include validity dates if provided
      if (!initialData) {
        if (form.validFrom) requestBody.validFrom = form.validFrom
        if (form.validTo) requestBody.validTo = form.validTo
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        setOpen(false)
        onSuccess()
      } else {
        const errorData = await res.json()
        alert(`Error saving contract: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error saving contract: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = !!initialData
  const currentRecipientEmail = form.recipientType === "employee" ? form.employeeEmail : form.clientEmail
  const selectedRecipient = recipients.find(r => r.email === currentRecipientEmail)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">

        <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
            {isEditing ? "Edit Contract" : "Issue Contract"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            {isEditing ? "Update contract details" : "Create a new contract"}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Recipient Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Issue To</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, recipientType: "client", clientEmail: "", employeeEmail: "" })
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                  form.recipientType === "client"
                    ? "bg-blue-50 dark:bg-zinc-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-zinc-700"
                    : "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, recipientType: "employee", clientEmail: "", employeeEmail: "" })
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                  form.recipientType === "employee"
                    ? "bg-blue-50 dark:bg-zinc-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-zinc-700"
                    : "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600"
                }`}
              >
                Employee
              </button>
            </div>
          </div>

          {/* Recipient Email Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Select {form.recipientType === "employee" ? "Employee" : "Client"}
            </label>
            <select
              value={currentRecipientEmail}
              aria-label={`Select ${form.recipientType === "employee" ? "Employee" : "Client"}`}
              onChange={(e) => {
                if (form.recipientType === "employee") {
                  setForm({ ...form, employeeEmail: e.target.value })
                } else {
                  setForm({ ...form, clientEmail: e.target.value })
                }
              }}
              disabled={loadingRecipients}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent disabled:opacity-50 cursor-pointer"
            >
              <option value="">
                {loadingRecipients ? "Loading..." : `Select ${form.recipientType === "employee" ? "employee" : "client"}...`}
              </option>
              {recipients.map((recipient) => (
                <option key={recipient.email} value={recipient.email}>
                  {recipient.name} ({recipient.email})
                </option>
              ))}
            </select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Reference</label>
            <input
              type="text"
              placeholder="e.g., CONTRACT-2024-001"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 placeholder-gray-500 dark:placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </div>

          {/* Validity period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Valid From</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Valid To</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Terms & Description</label>
            <textarea
              placeholder="Enter contract details and terms..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 placeholder-gray-500 dark:placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Admin/Owner Signature */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">OwnerSignature</label>
            <input
              type="text"
              placeholder="Admin name"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 placeholder-gray-500 dark:placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent"
              value={form.adminSignature}
              onChange={(e) => setForm({ ...form, adminSignature: e.target.value })}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loadingRecipients || !currentRecipientEmail}
              className="flex-1"
            >
              {submitting ? "Saving..." : isEditing ? "Update" : "Issue"}
            </Button>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  )
}