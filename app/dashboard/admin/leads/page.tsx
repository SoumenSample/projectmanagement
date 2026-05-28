"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCards } from "./component/stats-card"
import { toast } from "sonner"
import { MoreVertical, Plus, UserPlus, X } from "lucide-react"

interface User {
  _id?: string
  id?: number
  name: string
  email: string
  avatar?: string
  role: string
  plan?: string
  billing?: string
  status?: string
  joinedDate?: string
  lastLogin?: string
}

export default function UsersPage() {
  const [open, setOpen] = useState(false)
  const sourceSuggestions = ["Instagram", "Facebook", "LinkedIn", "Website", "WhatsApp", "Google", "Referral", "Other"]
  const leadStatusOptions = [
    { value: "active", label: "Active", className: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-emerald-300" },
    { value: "inactive", label: "Inactive", className: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-300" },
  ]

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    services: "",
    requirement: "",
    budget: "",
    source: "manual-admin",
    status: "active",
    nextFollowUpDate: "",
  })

  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [convertingLeadId, setConvertingLeadId] = useState(null)
  const [convertDates, setConvertDates] = useState({})
  const [showConvertModal, setShowConvertModal] = useState(null)
  const [convertedCount, setConvertedCount] = useState(0)
  const [editingLead, setEditingLead] = useState(null)
  const [viewingLead, setViewingLead] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    services: "",
    requirement: "",
    budget: "",
    status: "active",
    nextFollowUpDate: "",
  })
  const [editError, setEditError] = useState("")
  const [isUpdatingLead, setIsUpdatingLead] = useState(false)
  const [deletingLeadId, setDeletingLeadId] = useState(null)

  const serviceListPreview = useMemo(() => {
    return formData.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }, [formData.services])

  async function loadLeads() {
    try {
      setLoadingLeads(true)
      setError("")
      const response = await fetch("/api/leads", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load leads")
      setLeads(data.leads || [])
      const converted = (data.leads || []).filter((lead) => lead.convertedToClient).length
      setConvertedCount(converted)
    } catch (err) {
      setError(err.message || "Failed to load leads")
    } finally {
      setLoadingLeads(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  function onFieldChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const services = formData.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    if (services.length === 0) {
      setError("Please provide at least one service.")
      return
    }
    setIsSubmitting(true)
    setMessage("")
    setError("")
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services,
          nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create lead")
      setMessage("Lead added successfully.")
      setFormData({ name: "", email: "", phone: "", services: "", requirement: "", budget: "", source: "manual-admin", status: "active", nextFollowUpDate: "" })
      await loadLeads()
      setTimeout(() => { setOpen(false); setMessage("") }, 1200)
    } catch (err) {
      setError(err.message || "Failed to create lead")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConvertToClient(leadId) {
    const leadToConvert = leads.find((lead) => lead._id === leadId)
    const email = String(convertDates[leadId]?.email ?? leadToConvert?.email ?? "").trim().toLowerCase()

    const password = convertDates[leadId]?.password
    const from = convertDates[leadId]?.from
    const to = convertDates[leadId]?.to
    const projectName = convertDates[leadId]?.projectName || ""
    const projectDescription = convertDates[leadId]?.projectDescription || ""

    if (!email) { setError("Email is required to convert this lead."); return }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) { setError("Please enter a valid email address."); return }

    if (!password || password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (!from || !to) { setError("Please provide both valid from and valid to dates."); return }
    if (new Date(from) >= new Date(to)) { setError("Valid To date must be after Valid From date."); return }

    setConvertingLeadId(leadId)
    setError("")
    try {
      const response = await fetch(`/api/leads/convert/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, email, validFrom: from, validTo: to, projectName, projectDescription }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to convert lead")
      toast.success("Lead converted to client successfully.")
      setShowConvertModal(null)
      setConvertDates({})
      await loadLeads()
    } catch (err) {
      setError(err.message || "Failed to convert lead")
    } finally {
      setConvertingLeadId(null)
    }
  }

  function openEditModal(lead) {
    setEditingLead(lead)
    const followUpDate = lead?.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : ""
    setEditForm({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      services: (lead?.services || []).join(", "),
      requirement: lead?.requirement || "",
      budget: lead?.budget || "",
      status: lead?.status || "active",
      nextFollowUpDate: followUpDate,
    })
    setEditError("")
  }

  function openLeadDetails(lead) {
    setViewingLead(lead)
    setError("")
  }

  function closeLeadDetails() {
    setViewingLead(null)
  }

  function onEditFieldChange(event) {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleUpdateLead() {
    if (!editingLead?._id) return
    const services = editForm.services.split(",").map((item) => item.trim()).filter(Boolean)
    if (services.length === 0) { setEditError("Please provide at least one service."); return }
    setIsUpdatingLead(true)
    setEditError("")
    try {
      const response = await fetch(`/api/leads/${editingLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          services,
          requirement: editForm.requirement,
          budget: editForm.budget,
          status: editForm.status,
          nextFollowUpDate: editForm.nextFollowUpDate ? new Date(editForm.nextFollowUpDate).toISOString() : null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update lead")
      toast.success("Lead updated successfully.")
      setEditingLead(null)
      await loadLeads()
    } catch (err) {
      setEditError(err.message || "Failed to update lead")
    } finally {
      setIsUpdatingLead(false)
    }
  }

  async function handleDeleteLead(lead) {
    if (!lead?._id) return
    const confirmed = window.confirm("Delete this lead? This action cannot be undone.")
    if (!confirmed) return
    setDeletingLeadId(lead._id)
    try {
      const response = await fetch(`/api/leads/${lead._id}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to delete lead")
      toast.success("Lead deleted successfully.")
      await loadLeads()
    } catch (err) {
      toast.error(err.message || "Failed to delete lead")
    } finally {
      setDeletingLeadId(null)
    }
  }

  // ─── Shared field styles ────────────────────────────────────────────
  const inputCls = "h-10 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-zinc-300"

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">

        {/* ── Add Lead Dialog ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex justify-end mb-3">
            <DialogTrigger asChild>
              <Button
                onClick={() => setOpen(true)}
                className="mb-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                 Add Lead
              </Button>
            </DialogTrigger>
          </div>
          {/* <div className="flex justify-end">
                      <DialogTrigger asChild>
                        <Button className="mb-2" onClick={() => setOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                    </div> */}

          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl dark:border-zinc-700 dark:bg-popover [&::-webkit-scrollbar]:hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Add Lead</DialogTitle>
            </DialogHeader>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
              <div>
                <h2 className="text-base font-bold text-foreground">Add New Lead</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below to capture a new lead</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                New Lead
              </span>
            </div>

            {/* Scrollable Form */}
            <div className="overflow-y-auto" style={{ maxHeight: "72vh", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">

                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Full Name <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input name="name" type="text" value={formData.name} onChange={onFieldChange} placeholder="Rahul Sharma" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Email Address </Label>
                    <Input name="email" type="email" value={formData.email} onChange={onFieldChange} placeholder="rahul@company.com" className={inputCls} />
                  </div>
                </div>

                {/* Row 2: Phone + Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Phone <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input name="phone" type="tel" value={formData.phone} onChange={onFieldChange} placeholder="+91 98765 43210" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Budget <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm select-none">₹</span>
                      <Input name="budget" type="text" value={formData.budget} onChange={onFieldChange} placeholder="e.g. 50,000" className={`${inputCls} pl-7`} />
                    </div>
                  </div>
                </div>

                {/* Row 3: Services + Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Services Required <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input name="services" type="text" value={formData.services} onChange={onFieldChange} placeholder="Web Dev, UI/UX, SEO" required className={inputCls} />
                    {serviceListPreview.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {serviceListPreview.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Status <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <select
                      name="status"
                      value={formData.status ?? "active"}
                      onChange={onFieldChange}
                      required
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {leadStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Lead Source <span className="text-red-500 normal-case font-normal">*</span></Label>
                  <Input
                    name="source"
                    list="lead-source-suggestions"
                    value={formData.source}
                    onChange={onFieldChange}
                    placeholder="Instagram, Website, Referral..."
                    required
                    className={inputCls}
                  />
                  <datalist id="lead-source-suggestions">
                    {sourceSuggestions.map((source) => (
                      <option key={source} value={source} />
                    ))}
                  </datalist>
                </div>

                {/* Next Follow-up Date */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Next Follow-up Date <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <Input
                    name="nextFollowUpDate"
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={onFieldChange}
                    className={inputCls}
                  />
                </div>

                {/* Requirement */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Requirement <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <textarea
                    name="requirement"
                    value={formData.requirement}
                    onChange={onFieldChange}
                    rows={3}
                    placeholder="Describe the lead's project needs, goals, or any relevant details..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Feedback */}
                {message && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <p className="text-sm text-emerald-700 font-medium">{message}</p>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1 pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-10 rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-all dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-700/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 h-10 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold transition-all shadow-sm disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/20 dark:text-zinc-100"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Lead
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Leads Table ── */}
        <Card className="overflow-hidden rounded-2xl border border-border/70 shadow-sm dark:border-zinc-700">
          <CardHeader className="border-b border-border/70 px-6 py-5 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Leads</CardTitle>
                <CardDescription className="mt-0.5 text-sm text-muted-foreground">All captured leads in your pipeline</CardDescription>
              </div>
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {leads.length} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLeads ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted dark:bg-zinc-800">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">No leads yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first lead to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40 dark:border-zinc-700 dark:bg-zinc-900/10">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added Date</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Follow-up</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70 dark:divide-white/15">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="align-top transition-colors hover:bg-muted/30 dark:hover:bg-zinc-700/10">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{lead.budget ? `₹${lead.budget}` : "No budget"}</p>
                          {lead.convertedToClient && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              ✓ Converted
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="break-all text-sm text-foreground">{lead.email || "N/A"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{lead.phone}</p>
                        </td>
                        <td className="px-4 py-4 max-w-45">
                          <div className="flex flex-wrap gap-1">
                            {(lead.services || []).map((s, i) => (
                              <span key={i} className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                                {s}
                              </span>
                            ))}
                          </div>
                          {lead.requirement && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{lead.requirement}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            {lead.source}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          <p className="mt-0.5 text-[11px] text-muted-foreground/80">{new Date(lead.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                          {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const statusOption = leadStatusOptions.find((option) => option.value === lead.status) || leadStatusOptions[0]
                            return (
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusOption.className}`}>
                                {statusOption.label}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-zinc-700/10">
                                <MoreVertical className="size-4" />
                                <span className="sr-only">Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl border border-border bg-popover p-1 shadow-lg dark:border-zinc-700">
                              <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted" onClick={() => openLeadDetails(lead)}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted" onClick={() => openEditModal(lead)}>
                                Edit lead
                              </DropdownMenuItem>
                              {!lead.convertedToClient ? (
                                <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted" onClick={() => setShowConvertModal(lead._id)}>
                                  Convert to client
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled className="rounded-lg px-3 py-2 text-sm text-muted-foreground">Converted</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="my-1 bg-border" />
                              <DropdownMenuItem
                                variant="destructive"
                                className="rounded-lg text-sm cursor-pointer px-3 py-2 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteLead(lead)}
                                disabled={deletingLeadId === lead._id}
                              >
                                {deletingLeadId === lead._id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Convert to Client Modal ── */}
        {showConvertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-popover rounded-2xl border border-border shadow-2xl overflow-hidden dark:border-zinc-700 dark:bg-popover">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <h3 className="text-base font-bold text-foreground">Convert Lead to Client</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Create a user account and set project details</p>
                </div>
                <button
                  onClick={() => { setShowConvertModal(null); setError("") }}
                  className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-700/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Email <span className="text-red-500 normal-case font-normal">*</span></Label>
                  <Input
                    type="email"
                    className={inputCls}
                    placeholder="Enter client email"
                    value={convertDates[showConvertModal]?.email ?? leads.find((lead) => lead._id === showConvertModal)?.email ?? ""}
                    onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], email: e.target.value } })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Password <span className="text-red-500 normal-case font-normal">*</span> <span className="text-gray-400 normal-case font-normal">(min 8 chars)</span></Label>
                  <Input
                    type="password"
                    placeholder="Enter password for client login"
                    value={convertDates[showConvertModal]?.password || ""}
                    className={inputCls}
                    onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], password: e.target.value } })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Valid From <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input
                      type="date"
                      className={inputCls}
                      value={convertDates[showConvertModal]?.from || ""}
                      onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], from: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Valid To <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input
                      type="date"
                      className={inputCls}
                      value={convertDates[showConvertModal]?.to || ""}
                      onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], to: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Project Name <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <Input
                    placeholder="Enter project name"
                    className={inputCls}
                    value={convertDates[showConvertModal]?.projectName || ""}
                    onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], projectName: e.target.value } })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Project Description <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <textarea
                    placeholder="Enter project description"
                    value={convertDates[showConvertModal]?.projectDescription || ""}
                    onChange={(e) => setConvertDates({ ...convertDates, [showConvertModal]: { ...convertDates[showConvertModal], projectDescription: e.target.value } })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-700/10"
                    onClick={() => { setShowConvertModal(null); setError("") }}
                    disabled={convertingLeadId === showConvertModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold transition-all shadow-sm disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/20 dark:text-zinc-100"
                    onClick={() => handleConvertToClient(showConvertModal)}
                    disabled={convertingLeadId === showConvertModal}
                  >
                    {convertingLeadId === showConvertModal ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Converting...
                      </span>
                    ) : "Convert & Create"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Lead Modal ── */}
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-popover rounded-2xl border border-border shadow-2xl overflow-hidden dark:border-zinc-700 dark:bg-popover">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <h3 className="text-base font-bold text-foreground">Edit Lead</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Update the details for this lead</p>
                </div>
                <button
                  onClick={() => { setEditingLead(null); setEditError("") }}
                  className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-700/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Name <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input name="name" value={editForm.name} onChange={onEditFieldChange} required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Email <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                    <Input name="email" type="email" value={editForm.email} onChange={onEditFieldChange} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Phone <span className="text-red-500 normal-case font-normal">*</span></Label>
                    <Input name="phone" value={editForm.phone} onChange={onEditFieldChange} required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Budget <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                    <Input name="budget" value={editForm.budget} onChange={onEditFieldChange} placeholder="Optional" className={inputCls} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Services <span className="text-gray-400 normal-case font-normal">(comma separated)</span> <span className="text-red-500 normal-case font-normal">*</span></Label>
                  <Input name="services" value={editForm.services} onChange={onEditFieldChange} placeholder="Web Development, UI/UX Design" required className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Status <span className="text-red-500 normal-case font-normal">*</span></Label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={onEditFieldChange}
                    required
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {leadStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Next Follow-up Date <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <Input name="nextFollowUpDate" type="date" value={editForm.nextFollowUpDate} onChange={onEditFieldChange} className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Requirement <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                  <textarea
                    name="requirement"
                    value={editForm.requirement}
                    onChange={onEditFieldChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-border/60 focus:border-gray-400 transition-all resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    placeholder="Optional details"
                  />
                </div>

                {editError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-600">{editError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-700/10"
                    onClick={() => { setEditingLead(null); setEditError("") }}
                    disabled={isUpdatingLead}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold transition-all shadow-sm disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/20 dark:text-zinc-100"
                    onClick={handleUpdateLead}
                    disabled={isUpdatingLead}
                  >
                    {isUpdatingLead ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-popover rounded-2xl border border-border shadow-2xl overflow-hidden dark:border-zinc-700 dark:bg-popover">
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <h3 className="text-base font-bold text-foreground">Lead Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Full record for {viewingLead.name}</p>
                </div>
                <button
                  onClick={closeLeadDetails}
                  className="rounded-lg border border-border/70 bg-background p-1 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground dark:border-zinc-700 dark:bg-popover dark:text-zinc-300 dark:hover:bg-zinc-700/10 dark:hover:text-zinc-100"
                  aria-label="Close lead details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                    <p className="text-sm text-foreground">{viewingLead.name || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground break-all">{viewingLead.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{viewingLead.phone || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                    <p className="text-sm text-foreground">{viewingLead.budget ? `₹${viewingLead.budget}` : "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                    <p className="text-sm text-foreground">{viewingLead.source || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                    <p className="text-sm text-foreground capitalize">{String(viewingLead.status || "active")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created At</p>
                    <p className="text-sm text-foreground">{new Date(viewingLead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                    <p className="text-sm text-foreground">{new Date(viewingLead.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Services</p>
                  <p className="text-sm text-foreground">{(viewingLead.services || []).join(", ") || "N/A"}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Requirement</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewingLead.requirement || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
