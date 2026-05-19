"use client"

import { useEffect, useState } from "react"
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
import { StatCards } from "./component/stats-card"
import { toast } from "sonner"
import {
  Clock5,
  CreditCard,
  X,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client")
  const [source, setSource] = useState("manual-admin")
  const [finalBudget, setFinalBudget] = useState("")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [age, setAge] = useState("")
  const [region, setRegion] = useState("")
  const [validFrom, setValidFrom] = useState("")
  const [validTo, setValidTo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [stats, setStats] = useState({ totalClients: 0, convertedFromLeads: 0, activeClients: 0 })
  const [editingClient, setEditingClient] = useState<any>(null)
  const [viewingClient, setViewingClient] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  async function loadClients() {
    try {
      setLoadingClients(true)
      const response = await fetch("/api/clients", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load clients")
      setClients(data.clients || [])
      const total = (data.clients || []).length
      const converted = (data.clients || []).filter(
        (c) => String(c.source || "").toLowerCase() === "lead-conversion"
      ).length
      const active = (data.clients || []).filter((c) => c.status === "active").length
      setStats({ totalClients: total, convertedFromLeads: converted, activeClients: active })
    } catch (err: any) {
      toast.error(err.message || "Failed to load clients")
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (role === "client" && (!validFrom || !validTo)) {
      setError("Contract starting and ending dates are required for client users.")
      return
    }
    if (role === "client" && !age.trim()) {
      setError("Age is required for client users.")
      return
    }
    if (role === "client" && !region.trim()) {
      setError("Region is required for client users.")
      return
    }
    if (role === "client" && !finalBudget) {
      setError("Final budget is required for client users.")
      return
    }
    if (role === "client") {
      const fromDate = new Date(validFrom)
      const toDate = new Date(validTo)
      if (fromDate >= toDate) {
        setError("Contract ending date must be after starting date.")
        return
      }
    }
    setIsSubmitting(true)
    setMessage("")
    setError("")
    try {
      const payload: any = { name, email, password, role }
      if (role === "client") {
        payload.source = source
        payload.age = age ? Number(age) : undefined
        payload.region = region.trim()
        payload.finalBudget = finalBudget
        payload.projectName = projectName
        payload.projectDescription = projectDescription
        payload.phone = phone
        payload.validFrom = validFrom
        payload.validTo = validTo
      }
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create user")
      setMessage("User created successfully.")
      setName("")
      setEmail("")
      setPassword("")
      setRole("client")
      setSource("manual-admin")
      setFinalBudget("")
      setProjectName("")
      setProjectDescription("")
      setAge("")
      setRegion("")
      setValidFrom("")
      setValidTo("")
      setOpen(false)
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string | number) => {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      })
      if (!res.ok) throw new Error("Failed to delete user")
      setUsers((users) => users.filter((u) => (u._id || u.id) !== id))
      toast.success("User deleted successfully")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    }
  }

  const formatDateForInput = (value: any) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().split("T")[0]
  }

  const handleEditUser = (user: any) => {
    setEditingClient(user._id || user.id)
    setEditForm({
      linkedUser: user.linkedUser || null,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      age: user.age === 0 || user.age ? String(user.age) : "",
      region: user.region || "",
      services: Array.isArray(user.services) ? user.services.join(", ") : "",
      budget: user.budget || "",
      requirement: user.requirement || "",
      validFrom: formatDateForInput(user.validFrom),
      validTo: formatDateForInput(user.validTo),
      finalBudget: user.finalBudget || "",
      projectName: user.projectName || "",
      projectDescription: user.projectDescription || "",
      source: user.source || "manual-admin",
      status: user.status || (user.isActive ? "active" : "inactive"),
    })
  }

  const closeEdit = () => {
    setEditingClient(null)
    setEditForm({})
    setEditError("")
  }

  const openClientDetails = (client: any) => {
    setViewingClient(client)
  }

  const closeClientDetails = () => {
    setViewingClient(null)
  }

  const handleSaveEdit = async () => {
    if (!editForm?.name || !editForm?.email || !editForm?.phone || !editForm?.finalBudget) {
      setEditError("Name, email, phone, and final budget are required.")
      return
    }
    if (editForm.validFrom && editForm.validTo) {
      const fromDate = new Date(editForm.validFrom)
      const toDate = new Date(editForm.validTo)
      if (fromDate >= toDate) {
        setEditError("Contract ending date must be after starting date.")
        return
      }
    }
    setIsSaving(true)
    setEditError("")
    try {
      const response = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editingClient,
          linkedUserId: editForm.linkedUser || null,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          age: editForm.age,
          region: editForm.region,
          services: String(editForm.services || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          budget: editForm.budget,
          requirement: editForm.requirement,
          validFrom: editForm.validFrom,
          validTo: editForm.validTo,
          finalBudget: editForm.finalBudget,
          projectName: editForm.projectName,
          projectDescription: editForm.projectDescription,
          source: editForm.source,
          status: editForm.status,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update client")
      toast.success("Client updated successfully.")
      closeEdit()
      await loadClients()
    } catch (err: any) {
      setEditError(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (value: any) => {
    if (!value) return "—"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "—"
    return parsed.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  }

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region?.toLowerCase().includes(searchQuery.toLowerCase())
    const status = String(c.status || (c.isActive ? "active" : "inactive")).toLowerCase()
    const matchesStatus = statusFilter === "all" || status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = clients.filter((c) => {
    const s = String(c.status || (c.isActive ? "active" : "inactive")).toLowerCase()
    return s !== "active"
  }).length

  // Summary stat cards data
  const summaryStats = [
    {
      label: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/40",
    },
    {
      label: "Converted",
      value: stats.convertedFromLeads,
      icon: CreditCard,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      border: "border-violet-100 dark:border-violet-900/40",
    },
    {
      label: "Active",
      value: stats.activeClients,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/40",
    },
    {
      label: "Pending / Inactive",
      value: pendingCount,
      icon: Clock5,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/40",
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ─── Stat Cards from StatCards component ─── */}
      <div className="@container/main px-4 lg:px-6">
        <StatCards />
      </div>

      {/* ─── Quick Summary Strip ─── */}
      {/* <div className="px-4 lg:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 bg-card shadow-sm",
              s.border
            )}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* ─── Clients Table Card ─── */}
      <div className="px-4 lg:px-6">
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          {/* Card Header */}
          <CardHeader className="border-b border-border bg-muted/30 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Client Directory</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  All registered clients and their contract details
                </CardDescription>
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={loadClients}
                  disabled={loadingClients}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loadingClients && "animate-spin")} />
                  Refresh
                </Button>

                {/* Add client */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    {/* <Button size="sm" className="h-8 gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Add Client
                    </Button> */}
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs">Full Name *</Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs">Email *</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="password" className="text-xs">Password *</Label>
                          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-xs">Phone</Label>
                          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="role" className="text-xs">Role</Label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {role === "client" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="source" className="text-xs">Source</Label>
                          <Input
                            id="source"
                            list="client-source-suggestions"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="Instagram, Website, Referral..."
                          />
                          <datalist id="client-source-suggestions">
                            {sourceSuggestions.map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </div>
                      )}

                      {role === "client" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="age" className="text-xs">Age *</Label>
                              <Input
                                id="age"
                                type="number"
                                min="1"
                                max="120"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="28"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="region" className="text-xs">Region *</Label>
                              <Input
                                id="region"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="UAE, Dubai"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="finalBudget" className="text-xs">Final Budget *</Label>
                              <Input id="finalBudget" value={finalBudget} onChange={(e) => setFinalBudget(e.target.value)} placeholder="₹10,000" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="projectName" className="text-xs">Project Name</Label>
                              <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="validFrom" className="text-xs">Contract From *</Label>
                              <Input id="validFrom" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="validTo" className="text-xs">Contract To *</Label>
                              <Input id="validTo" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="projectDescription" className="text-xs">Project Description</Label>
                            <textarea
                              id="projectDescription"
                              value={projectDescription}
                              onChange={(e) => setProjectDescription(e.target.value)}
                              rows={3}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Brief project description…"
                            />
                          </div>
                        </>
                      )}

                      {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
                          {error}
                        </p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                          {isSubmitting ? "Creating…" : "Create Client"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingClients ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading clients…</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No clients found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-primary underline underline-offset-2"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Client
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contact
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Age / Region
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Project
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Services
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Budget
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contract
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Source
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="whitespace-nowrap py-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((user, idx) => {
                      const sourceValue = String(user.source || "manual-admin").trim()
                      const isLeadSource = sourceValue.toLowerCase() === "lead-conversion"
                      const isManualSource = sourceValue.toLowerCase() === "manual-admin"
                      const sourceLabel = isLeadSource ? "From Lead" : isManualSource ? "Manual" : sourceValue

                      const rawStatus = String(
                        user.status || (user.isActive ? "active" : "inactive")
                      ).toLowerCase()
                      const isActive = rawStatus === "active"

                      return (
                        <tr
                          key={user._id || user.id}
                          className="group hover:bg-muted/30 transition-colors duration-150"
                        >
                          {/* Client name + avatar */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-white text-xs font-semibold uppercase select-none">
                                {(user.name || "?")[0]}
                              </div>
                              <span className="font-medium text-foreground whitespace-nowrap">
                                {user.name}
                              </span>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 align-middle">
                            <p className="text-sm text-foreground whitespace-nowrap">{user.email}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {user.phone || "—"}
                            </p>
                          </td>

                          {/* Age / Region */}
                          <td className="py-3.5 px-4 align-middle">
                            <p className="text-sm text-foreground whitespace-nowrap">{user.age || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                              {user.region || "—"}
                            </p>
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-4 align-middle max-w-45">
                            {user.projectName ? (
                              <>
                                <p className="text-sm font-medium text-foreground truncate">
                                  {user.projectName}
                                </p>
                                {user.projectDescription && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {user.projectDescription}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Services */}
                          <td className="py-3.5 px-4 align-middle">
                            {(user.services || []).length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-40">
                                {(user.services || []).slice(0, 3).map((s: string, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {(user.services || []).length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{(user.services || []).length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Budget */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <p className="text-sm font-semibold text-foreground">
                              {user.finalBudget || "—"}
                            </p>
                            {user.budget && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Initial: {user.budget}
                              </p>
                            )}
                          </td>

                          {/* Contract validity */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <div className="text-xs space-y-0.5">
                              <p className="text-foreground">{formatDate(user.validFrom)}</p>
                              <p className="text-muted-foreground text-[10px]">to</p>
                              <p className="text-foreground">{formatDate(user.validTo)}</p>
                            </div>
                          </td>

                          {/* Source */}
                          <td className="py-3.5 px-4 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                                isLeadSource
                                  ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400"
                                  : isManualSource
                                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400"
                              )}
                            >
                              {sourceLabel}
                            </span>
                          </td>

                          {/* ✅ Status — green for active, red for inactive */}
                          <td className="py-3.5 px-4 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap",
                                isActive
                                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  isActive ? "bg-green-500" : "bg-red-500"
                                )}
                              />
                              {rawStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 align-middle text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => openClientDetails(user)}
                                  className="cursor-pointer gap-2 text-sm"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                  className="cursor-pointer gap-2 text-sm"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user._id || user.id)}
                                  className="cursor-pointer gap-2 text-sm text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem> */}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer row count */}
            {!loadingClients && filteredClients.length > 0 && (
              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">{filteredClients.length}</span> of{" "}
                  <span className="font-medium text-foreground">{clients.length}</span> clients
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Edit Dialog ─── */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            {/* Dialog Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Edit Client</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Update client details below</p>
              </div>
              <button
                onClick={closeEdit}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 [&_label]:text-foreground">
              {/* Basic Info */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-xs">Name *</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-xs">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-xs">Phone *</Label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-age" className="text-xs">Age</Label>
                    <Input
                      id="edit-age"
                      type="number"
                      min="1"
                      max="120"
                      value={editForm.age || ""}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-region" className="text-xs">Region</Label>
                    <Input
                      id="edit-region"
                      value={editForm.region || ""}
                      onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      placeholder="UAE, Dubai"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-status" className="text-xs">Status</Label>
                    <select
                      id="edit-status"
                      value={editForm.status || "active"}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-source" className="text-xs">Source</Label>
                  <Input
                    id="edit-source"
                    list="client-edit-source-suggestions"
                    value={editForm.source || ""}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    placeholder="Instagram, Website, Referral..."
                  />
                  <datalist id="client-edit-source-suggestions">
                    {sourceSuggestions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
              </section>

              {/* Project Info */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Project Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-project-name" className="text-xs">Project Name</Label>
                    <Input
                      id="edit-project-name"
                      value={editForm.projectName || ""}
                      onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                      placeholder="E-commerce Platform"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-project-description" className="text-xs">Project Description</Label>
                    <textarea
                      id="edit-project-description"
                      value={editForm.projectDescription || ""}
                      onChange={(e) => setEditForm({ ...editForm, projectDescription: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Brief project description…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-services" className="text-xs">Services (comma separated)</Label>
                    <Input
                      id="edit-services"
                      value={editForm.services || ""}
                      onChange={(e) => setEditForm({ ...editForm, services: e.target.value })}
                      placeholder="Web Development, Mobile App, SEO"
                    />
                  </div>
                </div>
              </section>

              {/* Budget & Contract */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Budget & Contract
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-budget" className="text-xs">Initial Budget</Label>
                    <Input
                      id="edit-budget"
                      value={editForm.budget || ""}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      placeholder="₹10,000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-final-budget" className="text-xs">Final Budget *</Label>
                    <Input
                      id="edit-final-budget"
                      value={editForm.finalBudget || ""}
                      onChange={(e) => setEditForm({ ...editForm, finalBudget: e.target.value })}
                      placeholder="₹15,000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-valid-from" className="text-xs">Contract From</Label>
                    <Input
                      id="edit-valid-from"
                      type="date"
                      value={editForm.validFrom || ""}
                      onChange={(e) => setEditForm({ ...editForm, validFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-valid-to" className="text-xs">Contract To</Label>
                    <Input
                      id="edit-valid-to"
                      type="date"
                      value={editForm.validTo || ""}
                      onChange={(e) => setEditForm({ ...editForm, validTo: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Notes
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-requirement" className="text-xs">Requirements / Notes</Label>
                  <textarea
                    id="edit-requirement"
                    value={editForm.requirement || ""}
                    onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Additional requirements or notes…"
                  />
                </div>
              </section>

              {/* Error */}
              {editError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={closeEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Client Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Full record for {viewingClient.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-border/70 bg-background text-foreground/80 hover:bg-muted hover:text-foreground"
                onClick={closeClientDetails}
                aria-label="Close client details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 text-sm text-foreground break-all">{viewingClient.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Age / Region</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.age || "N/A"} / {viewingClient.region || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Final Budget</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.finalBudget || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Initial Budget</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.budget || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Name</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.projectName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-sm text-foreground capitalize">{String(viewingClient.status || (viewingClient.isActive ? "active" : "inactive"))}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contract Start</p>
                <p className="mt-1 text-sm text-foreground">{formatDate(viewingClient.validFrom)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contract End</p>
                <p className="mt-1 text-sm text-foreground">{formatDate(viewingClient.validTo)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                <p className="mt-1 text-sm text-foreground">{viewingClient.source || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Created At</p>
                <p className="mt-1 text-sm text-foreground">{formatDate(viewingClient.createdAt)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Services</p>
                <p className="mt-1 text-sm text-foreground">{(viewingClient.services || []).join(", ") || "N/A"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Description</p>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{viewingClient.projectDescription || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}