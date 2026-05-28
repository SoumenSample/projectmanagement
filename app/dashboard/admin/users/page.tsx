// "use client"


// import { useEffect, useMemo, useState } from "react"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Label } from "@/components/ui/label"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { StatCards } from "./component/stats-card"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { MoreVertical, Pencil, Trash2, User, Mail, Lock, Phone, Briefcase, Calendar, DollarSign, Tag, Info, ChevronRight, UserPlus } from "lucide-react"

// interface User {
//   _id?: string
//   id?: number
//   name: string
//   email: string
//   avatar?: string
//   role: string
//   plan?: string
//   billing?: string
//   status?: string
//   phone?: string
//   employeeRole?: string
//   jobLocation?: string
//   source?: string
//   isActive?: boolean
//   clientProfile?: any
//   joinedDate?: string
//   lastLogin?: string
// }

// interface UserFormValues {
//   name: string
//   email: string
//   role: string
//   plan: string
//   billing: string
//   status: string
// }

// // ─── Reusable field wrapper ───────────────────────────────────────────────────
// function FieldGroup({
//   label,
//   icon: Icon,
//   children,
//   hint,
// }: {
//   label: string
//   icon?: React.ElementType
//   children: React.ReactNode
//   hint?: string
// }) {
//   return (
//     <div className="space-y-1.5">
//       <div className="flex items-center gap-1.5">
//         {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
//         <Label className="text-xs font-medium text-foreground/80 uppercase tracking-wide">
//           {label}
//         </Label>
//       </div>
//       {children}
//       {hint && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
//     </div>
//   )
// }

// // ─── Shared input class ───────────────────────────────────────────────────────
// const inputCls =
//   "h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"

// const selectCls =
//   "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-all outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50 cursor-pointer dark:bg-background"

// export default function UsersPage() {
//   const [open, setOpen] = useState(false)
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [role, setRole] = useState("client")
//   const [finalBudget, setFinalBudget] = useState("")
//   const [projectName, setProjectName] = useState("")
//   const [projectDescription, setProjectDescription] = useState("")
//   const [phone, setPhone] = useState("")
//   const [age, setAge] = useState("")
//   const [region, setRegion] = useState("")
//   const [source, setSource] = useState("")
//   const [validFrom, setValidFrom] = useState("")
//   const [validTo, setValidTo] = useState("")
//   const [clientStatus, setClientStatus] = useState("active")
//   const [employeeRole, setEmployeeRole] = useState("Staff")
//   const [jobLocation, setJobLocation] = useState("office")
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [message, setMessage] = useState("")

//   const [users, setUsers] = useState<User[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState("")
//   const [editingUser, setEditingUser] = useState<User | null>(null)
//   const [userEditForm, setUserEditForm] = useState<any>({})
//   const [isUserSaving, setIsUserSaving] = useState(false)
//   const [userEditError, setUserEditError] = useState("")
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
//   const [userToDelete, setUserToDelete] = useState<User | null>(null)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [userTypeFilter, setUserTypeFilter] = useState("all")
//   const userStatusStyles = {
//     active: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
//     inactive: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
//   }

//   useEffect(() => {
//     async function fetchUsers() {
//       setLoading(true)
//       setError("")
//       try {
//         const res = await fetch("/api/users", { cache: "no-store" })
//         const data = await res.json()
//         if (!res.ok) throw new Error(data.error || "Failed to load users")
//         setUsers(data.users || [])
//         console.log("Fetched users:", data.users)
//       } catch (err: any) {
//         setError(err.message)
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchUsers()
//   }, [])

//   async function handleSubmit(event: React.FormEvent) {
//     event.preventDefault()
//     if (role === "client" && !age.trim()) {
//       setError("Age is required for client users.")
//       return
//     }
//     if (role === "client" && !region.trim()) {
//       setError("Region is required for client users.")
//       return
//     }
//     if (role === "client" && (!validFrom || !validTo)) {
//       setError("Contract starting and ending dates are required for client users.")
//       return
//     }
//     if (role === "client" && !finalBudget) {
//       setError("Final budget is required for client users.")
//       return
//     }
//     if (role === "client") {
//       const fromDate = new Date(validFrom)
//       const toDate = new Date(validTo)
//       if (fromDate >= toDate) {
//         setError("Contract ending date must be after starting date.")
//         return
//       }
//     }
//     if (role === "employee" && !employeeRole.trim()) {
//       setError("Employee role is required.")
//       return
//     }
//     if (role === "employee" && !jobLocation.trim()) {
//       setError("Job location is required.")
//       return
//     }
//     setIsSubmitting(true)
//     setMessage("")
//     setError("")
//     try {
//       const payload: any = { name, email, password, role }
//       if (role === "client") {
//         payload.age = age ? Number(age) : undefined
//         payload.region = region.trim()
//         payload.finalBudget = finalBudget
//         payload.projectName = projectName
//         payload.projectDescription = projectDescription
//         payload.validFrom = validFrom
//         payload.validTo = validTo
//         payload.source = source
//         payload.status = clientStatus
//       }
//       if (role === "employee") {
//         payload.employeeRole = employeeRole
//         payload.jobLocation = jobLocation
//       }
//       const response = await fetch("/api/users", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       })
//       const data = await response.json()
//       if (!response.ok) throw new Error(data.error || "Failed to create user")
//       setMessage("User created successfully.")
//       setName(""); setEmail(""); setPassword(""); setRole("client")
//       setFinalBudget(""); setProjectName(""); setProjectDescription("")
//       setPhone(""); setAge(""); setRegion(""); setValidFrom(""); setValidTo(""); setSource(""); setClientStatus("active"); setEmployeeRole("Staff"); setJobLocation("office")
//       setOpen(false)
//       // Refetch users after successful creation
//       const res = await fetch("/api/users", { cache: "no-store" })
//       const updatedData = await res.json()
//       if (res.ok && updatedData.users) {
//         setUsers(updatedData.users)
//       }
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleOpenDeleteConfirm = (user: User) => {
//     setUserToDelete(user)
//     setDeleteConfirmOpen(true)
//   }

//   const handleConfirmDelete = async () => {
//     if (!userToDelete) return
//     try {
//       setIsDeleting(true)
//       const res = await fetch("/api/users", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: userToDelete._id || userToDelete.id }),
//       })
//       if (!res.ok) throw new Error("Failed to delete user")
//       setUsers(users => users.filter(u => (u._id || u.id) !== (userToDelete._id || userToDelete.id)))
//       setDeleteConfirmOpen(false)
//       setUserToDelete(null)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleEditUser = (user: User) => {
//     setEditingUser(user)
//     setUserEditForm({
//       name: user.name || "",
//       email: user.email || "",
//       phone: user.phone || "",
//       employeeRole: user.employeeRole || "Staff",
//       jobLocation: user.jobLocation || "office",
//       source: user.source || "manual-admin",
//       status: user.status || (user.isActive ? "active" : "inactive"),
//     })
//     setUserEditError("")
//   }

//   const closeUserEdit = () => {
//     setEditingUser(null)
//     setUserEditForm({})
//     setUserEditError("")
//   }

//   const handleSaveUserEdit = async () => {
//     if (!userEditForm.name || !userEditForm.email) {
//       setUserEditError("Name and email are required.")
//       return
//     }
//     setIsUserSaving(true)
//     setUserEditError("")
//     try {
//       const nextJobLocation = String(userEditForm.jobLocation || "").trim().toLowerCase()
//       const response = await fetch("/api/users", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: editingUser?._id || editingUser?.id,
//           name: userEditForm.name,
//           email: userEditForm.email,
//           phone: userEditForm.phone,
//           employeeRole: userEditForm.employeeRole,
//           jobLocation: userEditForm.jobLocation,
//           source: userEditForm.source,
//           status: userEditForm.status,
//         }),
//       })
//       const data = await response.json()
//       if (!response.ok) throw new Error(data.error || "Failed to update user")
//       setUsers((currentUsers) =>
//         currentUsers.map((currentUser) =>
//           (currentUser._id || currentUser.id) === (editingUser?._id || editingUser?.id)
//             ? {
//                 ...currentUser,
//                 ...data.user,
//                 jobLocation: nextJobLocation || data.user?.jobLocation || currentUser.jobLocation,
//               }
//             : currentUser
//         )
//       )
//       const refreshedUsersResponse = await fetch("/api/users", { cache: "no-store" })
//       const refreshedUsersData = await refreshedUsersResponse.json()
//       if (refreshedUsersResponse.ok && Array.isArray(refreshedUsersData.users)) {
//         setUsers(refreshedUsersData.users)
//       } else {
//         setUsers((currentUsers) =>
//           currentUsers.map((currentUser) =>
//             (currentUser._id || currentUser.id) === (editingUser?._id || editingUser?.id)
//               ? { ...currentUser, ...data.user }
//               : currentUser
//           )
//         )
//       }
//       setMessage("User updated successfully.")
//       closeUserEdit()
//     } catch (err: any) {
//       setUserEditError(err.message || "Failed to save changes")
//     } finally {
//       setIsUserSaving(false)
//     }
//   }

//   const filteredUsers = useMemo(() => {
//     if (userTypeFilter === "all") return users

//     return users.filter((user) => {
//       const normalizedRole = String(user.role || "").trim().toLowerCase()
//       return normalizedRole === userTypeFilter
//     })
//   }, [users, userTypeFilter])

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="@container/main px-4 lg:px-6">
//         <StatCards />
//       </div>
//       <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">

//         {/* ─── IMPROVED ADD USER DIALOG ─────────────────────────────────── */}
//         <Dialog open={open} onOpenChange={setOpen}>
//           <div className="flex justify-end">
//             <DialogTrigger asChild>
//               <Button className="mb-2" onClick={() => setOpen(true)}>
//                 <UserPlus className="h-4 w-4 mr-2" />
//                 Add User
//               </Button>
//             </DialogTrigger>
//           </div>

//           <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl">
//             <DialogHeader className="sr-only">
//               <DialogTitle>Create User</DialogTitle>
//             </DialogHeader>

//             {/* ── Header strip ── */}
//             <div className="relative flex items-center gap-4 px-6 pt-6 pb-5 border-b border-border/60 bg-muted/20">
//               {/* Icon bubble */}
//               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
//                 <UserPlus className="h-5 w-5 text-primary" />
//               </div>
//               {/* <div>
//                 <h2 className="text-base font-semibold text-foreground leading-tight">Create New User</h2>
//                 <p className="text-xs text-muted-foreground mt-0.5">
//                   Only <span className="font-medium text-foreground/70">client</span> and{" "}
//                   <span className="font-medium text-foreground/70">employee</span> roles can be created.
//                 </p>
//               </div> */}

//               {/* Role pill toggle */}
//               <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/70 bg-background p-1">
//                 {["client", "employee"].map((r) => (
//                   <button
//                     key={r}
//                     type="button"
//                     onClick={() => setRole(r)}
//                     className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
//                       role === r
//                         ? "bg-primary text-primary-foreground shadow-sm"
//                         : "text-muted-foreground hover:text-foreground"
//                     }`}
//                   >
//                     {r}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* ── Scrollable body ── */}
//             <div className="overflow-y-auto max-h-[calc(92vh-80px)] px-6 py-5 space-y-6 scrollbar-hide">
//               <form onSubmit={handleSubmit} className="space-y-6">

//                 {/* ── Section: Account Info ── */}
//                 <div className="space-y-4">
//                   <div className="flex items-center gap-2">
//                     <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
//                     <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account Info</span>
//                     <div className="flex-1 h-px bg-border/50" />
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <FieldGroup label="Full Name" icon={User}>
//                       <Input
//                         className={inputCls}
//                         placeholder="e.g. Soumen"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         required
//                       />
//                     </FieldGroup>

//                     <FieldGroup label="Email Address" icon={Mail}>
//                       <Input
//                         className={inputCls}
//                         type="email"
//                         placeholder="user@example.com"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         required
//                       />
//                     </FieldGroup>

//                     <FieldGroup label="Password" icon={Lock} hint="Minimum 8 characters">
//                       <Input
//                         className={inputCls}
//                         type="password"
//                         placeholder="••••••••"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                       />
//                     </FieldGroup>
//                   </div>
//                 </div>

//                 {/* ── Section: Client Details (conditional) ── */}
//                 {role === "client" && (
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-2">
//                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
//                       <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client Details</span>
//                       <div className="flex-1 h-px bg-border/50" />
//                     </div>

//                     {/* Contract dates row */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <FieldGroup label="Contract Start" icon={Calendar}>
//                         <Input
//                           className={inputCls}
//                           type="date"
//                           value={validFrom}
//                           onChange={(e) => setValidFrom(e.target.value)}
//                           required
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Contract End" icon={Calendar}>
//                         <Input
//                           className={inputCls}
//                           type="date"
//                           value={validTo}
//                           onChange={(e) => setValidTo(e.target.value)}
//                           required
//                         />
//                       </FieldGroup>
//                     </div>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <FieldGroup label="Final Budget" icon={DollarSign}>
//                         <Input
//                           className={inputCls}
//                           placeholder="₹ 0.00"
//                           value={finalBudget}
//                           onChange={(e) => setFinalBudget(e.target.value)}
//                           required
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Phone" icon={Phone}>
//                         <Input
//                           className={inputCls}
//                           placeholder="+91 00000 00000"
//                           value={phone}
//                           onChange={(e) => setPhone(e.target.value)}
//                           required
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Project Name" icon={Briefcase}>
//                         <Input
//                           className={inputCls}
//                           placeholder="Optional"
//                           value={projectName}
//                           onChange={(e) => setProjectName(e.target.value)}
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Source" icon={Tag}>
//                         <Input
//                           className={inputCls}
//                           placeholder="Referral, Ads, Instagram…"
//                           value={source}
//                           onChange={(e) => setSource(e.target.value)}
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Age" icon={Calendar}>
//                         <Input
//                           className={inputCls}
//                           type="number"
//                           min="1"
//                           max="120"
//                           placeholder="28"
//                           value={age}
//                           onChange={(e) => setAge(e.target.value)}
//                           required={role === "client"}
//                         />
//                       </FieldGroup>

//                       <FieldGroup label="Region" icon={Info}>
//                         <Input
//                           className={inputCls}
//                           placeholder="UAE, Dubai"
//                           value={region}
//                           onChange={(e) => setRegion(e.target.value)}
//                           required={role === "client"}
//                         />
//                       </FieldGroup>
//                     </div>

//                     {/* Status — full-width pills */}
//                     <div className="space-y-1.5">
//                       <div className="flex items-center gap-1.5">
//                         <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
//                         <Label className="text-xs font-medium text-foreground/80 uppercase tracking-wide">Status</Label>
//                       </div>
//                       <div className="flex gap-2">
//                         {["active", "inactive"].map((s) => (
//                           <button
//                             key={s}
//                             type="button"
//                             onClick={() => setClientStatus(s)}
//                             className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
//                               clientStatus === s
//                                 ? s === "active"
//                                   ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
//                                   : "border-red-400/50 bg-red-500/10 text-red-700 dark:text-red-300"
//                                 : "border-border text-muted-foreground hover:bg-muted/40"
//                             }`}
//                           >
//                             {s}
//                           </button>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Project Description */}
//                     <FieldGroup label="Project Description" icon={Info}>
//                       <textarea
//                         value={projectDescription}
//                         onChange={(e) => setProjectDescription(e.target.value)}
//                         placeholder="Describe the project scope, goals, deliverables…"
//                         rows={3}
//                         className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
//                       />
//                     </FieldGroup>
//                   </div>
//                 )}

//                 {/* ── Section: Employee Details (conditional) ── */}
//                 {role === "employee" && (
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-2">
//                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
//                       <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employee Details</span>
//                       <div className="flex-1 h-px bg-border/50" />
//                     </div>

//                     <FieldGroup label="Employee Role" icon={Briefcase}>
//                       <select
//                         className={selectCls}
//                         value={employeeRole}
//                         onChange={(e) => setEmployeeRole(e.target.value)}
//                         required
//                       >
//                         <option value="Manager">Manager</option>
//                         <option value="HR">HR</option>
//                         <option value="Customer Agent">Customer Agent</option>
//                         <option value="Staff">Staff</option>
//                       </select>
//                     </FieldGroup>

//                     <FieldGroup label="Job Location" icon={Info} hint="Choose where this employee works from">
//                       <select
//                         className={selectCls}
//                         value={jobLocation}
//                         onChange={(e) => setJobLocation(e.target.value)}
//                         required
//                       >
//                         <option value="office">Office</option>
//                         <option value="remote">Remote</option>
//                       </select>
//                     </FieldGroup>
//                   </div>
//                 )}

//                 {/* ── Alerts ── */}
//                 {message && (
//                   <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 px-4 py-3">
//                     <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
//                     <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
//                   </div>
//                 )}

//                 {error && (
//                   <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3">
//                     <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</span>
//                     <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
//                   </div>
//                 )}

//                 {/* ── Submit ── */}
//                 <div className="pt-1 pb-2">
//                   <Button
//                     type="submit"
//                     className="w-full h-10 text-sm font-semibold rounded-xl gap-2"
//                     disabled={isSubmitting}
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
//                         Creating user…
//                       </>
//                     ) : (
//                       <>
//                         <UserPlus className="h-4 w-4" />
//                         Create {role === "client" ? "Client" : "Employee"}
//                         <ChevronRight className="h-4 w-4 ml-auto opacity-60" />
//                       </>
//                     )}
//                   </Button>
//                 </div>

//               </form>
//             </div>
//           </DialogContent>
//         </Dialog>

//         {/* ─── USERS TABLE (unchanged) ─────────────────────────────────── */}
//         <Card className="border border-border bg-card text-card-foreground shadow-sm">
//           <CardHeader>
//             <CardTitle>Users</CardTitle>
//             <CardDescription>Manage users, roles, and status.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <p className="text-gray-400">Loading users...</p>
//             ) : (
//               <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
//                 <div className="flex justify-end border-b border-border/60 px-3 py-3">
//                   <div className="space-y-2">
//                     {/* <Label htmlFor="user-type-filter" className="text-sm font-medium">
//                       Filter by type
//                     </Label> */}
//                     <select
//                       id="user-type-filter"
//                       value={userTypeFilter}
//                       onChange={(event) => setUserTypeFilter(event.target.value)}
//                       className="h-9 w-45 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-background"
//                     >
//                       <option value="all">All users</option>
//                       <option value="client">Client</option>
//                       <option value="employee">Employee</option>
//                     </select>
//                   </div>
//                 </div>
//                 <table className="w-full text-left text-sm">
//                   <thead>
//                     <tr className="border-b border-border/70 bg-muted/30 text-foreground/80">
//                       <th className="py-3 pl-3">Name</th>
//                       <th className="py-3">Email</th>
//                       <th className="py-3">Role</th>
//                       <th className="py-3">Employee Role</th>
//                       <th className="py-3">Job Location</th>
//                       <th className="py-3">Source</th>
//                       <th className="py-3">Status</th>
//                       <th className="py-3 pr-3 text-right">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredUsers.map((user) => (
//                       <tr
//                         key={user._id || user.id}
//                         className="border-b border-border/60 align-top hover:bg-muted/40 transition-colors"
//                       >
//                         <td className="py-3 pl-3">{user.name}</td>
//                         <td className="py-3">{user.email}</td>
//                         <td className="py-3 uppercase">{user.role}</td>
//                         <td className="py-3">{user.role === "employee" ? (user.employeeRole || "-") : "-"}</td>
//                         <td className="py-3 capitalize">
//                           {user.role === "employee"
//                             ? (user.jobLocation || "office") === "office"
//                               ? "Office"
//                               : "Remote"
//                             : "-"}
//                         </td>
//                         <td className="py-3">
//                           {(() => {
//                             const sourceValue = String(user.source || "manual-admin").trim()
//                             const isLeadSource = sourceValue.toLowerCase() === "lead-conversion"
//                             const isManualSource = sourceValue.toLowerCase() === "manual-admin"
//                             const sourceLabel = isLeadSource ? "From Lead" : isManualSource ? "Manual" : sourceValue
//                             return (
//                               <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
//                                 isLeadSource
//                                   ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
//                                   : isManualSource
//                                     ? "border-blue-200 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
//                                     : "border-slate-200 bg-slate-500/10 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300"
//                               }`}>
//                                 {sourceLabel || "Manual"}
//                               </span>
//                             )
//                           })()}
//                         </td>
//                         <td className="py-3">
//                           {(() => {
//                             const status = String(user.status || (user.isActive ? "active" : "inactive")).toLowerCase()
//                             const statusClass = userStatusStyles[status] || userStatusStyles.inactive
//                             return (
//                               <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>
//                                 {status}
//                               </span>
//                             )
//                           })()}
//                         </td>
//                         <td className="py-3 pr-3 text-right">
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
//                                 <MoreVertical className="h-4 w-4" />
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="end" className="w-36 border-border bg-popover text-popover-foreground">
//                               <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer gap-2">
//                                 <Pencil className="h-4 w-4" />
//                                 Edit
//                               </DropdownMenuItem>
//                               <DropdownMenuItem onClick={() => handleOpenDeleteConfirm(user)} className="cursor-pointer gap-2 text-red-500 focus:text-red-500">
//                                 <Trash2 className="h-4 w-4" />
//                                 Delete
//                               </DropdownMenuItem>
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {filteredUsers.length === 0 && (
//                   <p className="text-gray-400 mt-3">No users found</p>
//                 )}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* ─── EDIT USER MODAL (unchanged) ─────────────────────────────── */}
//       {editingUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border bg-card text-card-foreground shadow-2xl">
//             <CardHeader>
//               <CardTitle>Edit User</CardTitle>
//               <CardDescription>Update the selected user details.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label>Name</Label>
//                   <Input value={userEditForm.name || ""} onChange={(e) => setUserEditForm({ ...userEditForm, name: e.target.value })} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Email</Label>
//                   <Input type="email" value={userEditForm.email || ""} onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Phone</Label>
//                   <Input value={userEditForm.phone || ""} onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })} />
//                 </div>
//                 {editingUser.role === "employee" && (
//                   <div className="space-y-2">
//                     <Label>Employee Role</Label>
//                     <select
//                       className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-background"
//                       value={userEditForm.employeeRole || "Staff"}
//                       onChange={(e) => setUserEditForm({ ...userEditForm, employeeRole: e.target.value })}
//                     >
//                       <option value="Manager">Manager</option>
//                       <option value="HR">HR</option>
//                       <option value="Customer Agent">Customer Agent</option>
//                       <option value="Staff">Staff</option>
//                     </select>
//                   </div>
//                 )}
//                 {editingUser.role === "employee" && (
//                   <div className="space-y-2">
//                     <Label>Job Location</Label>
//                     <select
//                       className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-background"
//                       value={userEditForm.jobLocation || "office"}
//                       onChange={(e) => setUserEditForm({ ...userEditForm, jobLocation: e.target.value })}
//                     >
//                       <option value="office">Office</option>
//                       <option value="remote">Remote</option>
//                     </select>
//                   </div>
//                 )}
//                 <div className="space-y-2">
//                   <Label>Status</Label>
//                   <select
//                     className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-background"
//                     value={userEditForm.status || "active"}
//                     onChange={(e) => setUserEditForm({ ...userEditForm, status: e.target.value })}
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label>Source</Label>
//                 <Input value={userEditForm.source || ""} onChange={(e) => setUserEditForm({ ...userEditForm, source: e.target.value })} />
//               </div>
//               {userEditError && <p className="text-sm text-red-400">{userEditError}</p>}
//               <div className="flex gap-2 pt-2">
//                 <Button variant="outline" className="flex-1" onClick={closeUserEdit} disabled={isUserSaving}>
//                   Cancel
//                 </Button>
//                 <Button className="flex-1" onClick={handleSaveUserEdit} disabled={isUserSaving}>
//                   {isUserSaving ? "Saving..." : "Save Changes"}
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
//         <DialogContent className="max-w-sm">
//           <DialogHeader>
//             <DialogTitle>Delete User</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Are you sure you want to delete <span className="font-semibold text-foreground">{userToDelete?.name}</span>? This action cannot be undone.
//             </p>
//             <div className="flex gap-3 justify-end">
//               <Button
//                 variant="outline"
//                 onClick={() => setDeleteConfirmOpen(false)}
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 variant="destructive"
//                 onClick={handleConfirmDelete}
//                 disabled={isDeleting}
//               >
//                 {isDeleting ? "Deleting..." : "Delete"}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }


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
import { StatCards } from "./component/stats-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2, User, Mail, Lock, Phone, Briefcase, Calendar, DollarSign, Tag, Info, ChevronRight, UserPlus, MapPin } from "lucide-react"

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
  phone?: string
  employeeRole?: string
  jobLocation?: string
  homeLatitude?: number | null
  homeLongitude?: number | null
  source?: string
  isActive?: boolean
  clientProfile?: any
  joinedDate?: string
  lastLogin?: string
}

// ─── Reusable field wrapper ───────────────────────────────────────────────────
function FieldGroup({
  label,
  icon: Icon,
  children,
  hint,
}: {
  label: string
  icon?: React.ElementType
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
        <Label className="text-xs font-medium text-foreground/80 uppercase tracking-wide">
          {label}
        </Label>
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
    </div>
  )
}

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-all outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50 cursor-pointer dark:bg-background"

const userStatusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  inactive: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
}

async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch("/api/users", { cache: "no-store" })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to load users")
  return data.users || []
}

export default function UsersPage() {
  // ── Create-user form state ──────────────────────────────────────────────────
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [age, setAge] = useState("")
  const [region, setRegion] = useState("")
  const [source, setSource] = useState("")
  const [validFrom, setValidFrom] = useState("")
  const [validTo, setValidTo] = useState("")
  const [clientStatus, setClientStatus] = useState("active")
  const [employeeRole, setEmployeeRole] = useState("Staff")
  const [jobLocation, setJobLocation] = useState("office")
  const [homeLatitude, setHomeLatitude] = useState("")
  const [homeLongitude, setHomeLongitude] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  // ── Users list state ────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userEditForm, setUserEditForm] = useState<any>({})
  const [isUserSaving, setIsUserSaving] = useState(false)
  const [userEditError, setUserEditError] = useState("")
  const [fetchingHomeLocation, setFetchingHomeLocation] = useState(false)

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    fetchAllUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Create user ─────────────────────────────────────────────────────────────
  function resetCreateForm() {
    setName(""); setEmail(""); setPassword(""); setRole("client")
    setProjectName(""); setProjectDescription("")
    setPhone(""); setAge(""); setRegion(""); setValidFrom(""); setValidTo("")
    setSource(""); setClientStatus("active"); setEmployeeRole("Staff"); setJobLocation("office"); setHomeLatitude(""); setHomeLongitude("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (role === "client") {
      if (!age.trim()) { setError("Age is required for client users."); return }
      if (!region.trim()) { setError("Region is required for client users."); return }
      if (!validFrom || !validTo) { setError("Contract dates are required for client users."); return }
      if (new Date(validFrom) >= new Date(validTo)) { setError("Contract ending date must be after starting date."); return }
    }
    if (role === "employee") {
      if (!employeeRole.trim()) { setError("Employee role is required."); return }
      if (!jobLocation.trim()) { setError("Job location is required."); return }
      if (!homeLatitude.trim() || !homeLongitude.trim()) { setError("Home latitude and longitude are required for employees."); return }
    }

    setIsSubmitting(true)
    setMessage("")
    try {
      const payload: any = { name, email, password, role }
      if (role === "client") {
        payload.age = age ? Number(age) : undefined
        payload.region = region.trim()
        payload.projectName = projectName
        payload.projectDescription = projectDescription
        payload.validFrom = validFrom
        payload.validTo = validTo
        payload.source = source
        payload.status = clientStatus
        payload.phone = phone
      }
      if (role === "employee") {
        payload.employeeRole = employeeRole
        payload.jobLocation = jobLocation
        payload.homeLatitude = homeLatitude
        payload.homeLongitude = homeLongitude
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create user")

      setMessage("User created successfully.")
      resetCreateForm()
      setOpen(false)
      // Refetch to get the freshly created user with all fields
      setUsers(await fetchAllUsers())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete user ─────────────────────────────────────────────────────────────
  const handleOpenDeleteConfirm = (user: User) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete._id || userToDelete.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete user")
      }
      setUsers((prev) =>
        prev.filter((u) => (u._id || u.id) !== (userToDelete._id || userToDelete.id))
      )
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUseCurrentLocation = async (mode: "create" | "edit") => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.")
      return
    }

    setFetchingHomeLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const nextLatitude = String(position.coords.latitude)
      const nextLongitude = String(position.coords.longitude)

      if (mode === "create") {
        setHomeLatitude(nextLatitude)
        setHomeLongitude(nextLongitude)
      } else {
        setUserEditForm((current: any) => ({
          ...current,
          homeLatitude: nextLatitude,
          homeLongitude: nextLongitude,
        }))
      }
    } catch (locationError: any) {
      const message = locationError instanceof Error ? locationError.message : "Unable to fetch location."
      if (mode === "create") {
        setError(message)
      } else {
        setUserEditError(message)
      }
    } finally {
      setFetchingHomeLocation(false)
    }
  }

  // ── Edit user ────────────────────────────────────────────────────────────────
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    // FIX: initialise jobLocation from the actual user record; fall back to
    // "office" only when the field is truly absent (null / undefined / "")
    const resolvedJobLocation =
      user.jobLocation && ["office", "remote"].includes(user.jobLocation.toLowerCase())
        ? user.jobLocation.toLowerCase()
        : "office"

    const resolvedStatus =
      typeof user.status === "string"
        ? user.status
        : user.isActive
          ? "active"
          : "inactive"

    setUserEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      employeeRole: user.employeeRole || "Staff",
      jobLocation: resolvedJobLocation,
      homeLatitude: user.homeLatitude === null || user.homeLatitude === undefined ? "" : String(user.homeLatitude),
      homeLongitude: user.homeLongitude === null || user.homeLongitude === undefined ? "" : String(user.homeLongitude),
      source: user.source || "manual-admin",
      status: resolvedStatus,
    })
    setUserEditError("")
  }

  const closeUserEdit = () => {
    setEditingUser(null)
    setUserEditForm({})
    setUserEditError("")
  }

  const handleSaveUserEdit = async () => {
    if (!userEditForm.name || !userEditForm.email) {
      setUserEditError("Name and email are required.")
      return
    }
    setIsUserSaving(true)
    setUserEditError("")
    try {
      // FIX: build the payload conditionally so we never send employee-only
      // fields (jobLocation, employeeRole) for client users, which previously
      // caused them to be written to the wrong document on the backend.
      const isEmployee = editingUser?.role === "employee"

      if (isEmployee) {
        if (!String(userEditForm.homeLatitude ?? "").trim() || !String(userEditForm.homeLongitude ?? "").trim()) {
          setUserEditError("Home latitude and longitude are required for employees.")
          return
        }
      }

      const patchPayload: any = {
        userId: editingUser?._id || editingUser?.id,
        name: userEditForm.name,
        email: userEditForm.email,
        phone: userEditForm.phone,
        source: userEditForm.source,
        status: userEditForm.status,
      }

      if (isEmployee) {
        // Always send explicit strings so the backend receives a valid value
        patchPayload.jobLocation = String(userEditForm.jobLocation || "office").trim().toLowerCase()
        patchPayload.employeeRole = userEditForm.employeeRole
        patchPayload.homeLatitude = String(userEditForm.homeLatitude || "").trim()
        patchPayload.homeLongitude = String(userEditForm.homeLongitude || "").trim()
      }

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update user")

      // Refetch the full list so the table shows the freshly-saved values
      // (avoids stale-closure / partial-merge issues with local state)
      setUsers(await fetchAllUsers())
      setMessage("User updated successfully.")
      closeUserEdit()
    } catch (err: any) {
      setUserEditError(err.message || "Failed to save changes")
    } finally {
      setIsUserSaving(false)
    }
  }

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (userTypeFilter === "all") return users
    return users.filter(
      (user) => String(user.role || "").trim().toLowerCase() === userTypeFilter
    )
  }, [users, userTypeFilter])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards />
      </div>
      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">

        {/* ─── ADD USER DIALOG ──────────────────────────────────────────────── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex justify-end">
            <DialogTrigger asChild>
              <Button className="mb-2" onClick={() => setOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          </div>

          <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>

            {/* Header strip */}
            <div className="relative flex items-center gap-4 px-6 pt-6 pb-5 border-b border-border/60 bg-muted/20">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>

              {/* Role pill toggle */}
              <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/70 bg-background p-1">
                {["client", "employee", "vendor"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                      role === r
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "vendor" ? "Partner/Vendor" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto max-h-[calc(92vh-80px)] px-6 py-5 space-y-6 scrollbar-hide">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1 – Account Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account Info</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Full Name" icon={User}>
                      <Input className={inputCls} placeholder="e.g. Soumen" value={name} onChange={(e) => setName(e.target.value)} required />
                    </FieldGroup>
                    <FieldGroup label="Email Address" icon={Mail}>
                      <Input className={inputCls} type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </FieldGroup>
                    <FieldGroup label="Password" icon={Lock} hint="Minimum 8 characters">
                      <Input className={inputCls} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </FieldGroup>
                  </div>
                </div>

                {/* Section 2 – Client Details */}
                {role === "client" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client Details</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldGroup label="Contract Start" icon={Calendar}>
                        <Input className={inputCls} type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
                      </FieldGroup>
                      <FieldGroup label="Contract End" icon={Calendar}>
                        <Input className={inputCls} type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} required />
                      </FieldGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldGroup label="Phone" icon={Phone}>
                        <Input className={inputCls} placeholder="+91 00000 00000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      </FieldGroup>
                      <FieldGroup label="Project Name" icon={Briefcase}>
                        <Input className={inputCls} placeholder="Optional" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Source" icon={Tag}>
                        <Input className={inputCls} placeholder="Referral, Ads, Instagram…" value={source} onChange={(e) => setSource(e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Age" icon={Calendar}>
                        <Input className={inputCls} type="number" min="1" max="120" placeholder="28" value={age} onChange={(e) => setAge(e.target.value)} required={role === "client"} />
                      </FieldGroup>
                      <FieldGroup label="Region" icon={Info}>
                        <Input className={inputCls} placeholder="UAE, Dubai" value={region} onChange={(e) => setRegion(e.target.value)} required={role === "client"} />
                      </FieldGroup>
                    </div>

                    {/* Status pills */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <Label className="text-xs font-medium text-foreground/80 uppercase tracking-wide">Status</Label>
                      </div>
                      <div className="flex gap-2">
                        {["active", "inactive"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setClientStatus(s)}
                            className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                              clientStatus === s
                                ? s === "active"
                                  ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-red-400/50 bg-red-500/10 text-red-700 dark:text-red-300"
                                : "border-border text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FieldGroup label="Project Description" icon={Info}>
                      <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe the project scope, goals, deliverables…"
                        rows={3}
                        className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
                      />
                    </FieldGroup>
                  </div>
                )}

                {/* Section 2 – Employee Details */}
                {role === "employee" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employee Details</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <FieldGroup label="Employee Role" icon={Briefcase}>
                      <select className={selectCls} value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)} required>
                        <option value="Manager">Manager</option>
                        <option value="HR">HR</option>
                        <option value="Customer Agent">Customer Agent</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </FieldGroup>

                    <FieldGroup label="Job Location" icon={Info} hint="Choose where this employee works from">
                      <select className={selectCls} value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} required>
                        <option value="office">Office</option>
                        <option value="remote">Remote</option>
                      </select>
                    </FieldGroup>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldGroup label="Home Latitude" icon={MapPin} hint="Used for remote attendance within 3km">
                        <Input className={inputCls} type="number" step="any" placeholder="e.g. 25.2048" value={homeLatitude} onChange={(e) => setHomeLatitude(e.target.value)} required />
                      </FieldGroup>
                      <FieldGroup label="Home Longitude" icon={MapPin} hint="Used for remote attendance within 3km">
                        <Input className={inputCls} type="number" step="any" placeholder="e.g. 55.2708" value={homeLongitude} onChange={(e) => setHomeLongitude(e.target.value)} required />
                      </FieldGroup>
                    </div>

                    <div className="flex justify-start">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleUseCurrentLocation("create")} disabled={fetchingHomeLocation}>
                        {fetchingHomeLocation ? "Fetching location..." : "Use current location"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {message && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 px-4 py-3">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-1 pb-2">
                  <Button type="submit" className="w-full h-10 text-sm font-semibold rounded-xl gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                        Creating user…
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create {role === "client" ? "Client" : role === "employee" ? "Employee" : "Partner/Vendor"}
                        <ChevronRight className="h-4 w-4 ml-auto opacity-60" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── USERS TABLE ──────────────────────────────────────────────────── */}
        <Card className="border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage users, roles, and status.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400">Loading users...</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
                <div className="flex justify-end border-b border-border/60 px-3 py-3">
                  <select
                    id="user-type-filter"
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="h-9 w-45 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-background"
                  >
                    <option value="all">All users</option>
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="vendor">Partner/Vendor</option>
                  </select>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-foreground/80">
                      <th className="py-3 pl-3">Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Employee Role</th>
                      <th className="py-3">Job Location</th>
                      <th className="py-3">Source</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 pr-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id || user.id}
                        className="border-b border-border/60 align-top hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-3 pl-3">{user.name}</td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3 uppercase">{user.role}</td>
                        <td className="py-3">{user.role === "employee" ? (user.employeeRole || "-") : "-"}</td>
                        <td className="py-3 capitalize">
                          {user.role === "employee"
                            ? String(user.jobLocation || "office").toLowerCase() === "remote"
                              ? "Remote"
                              : "Office"
                            : "-"}
                        </td>
                        <td className="py-3">
                          {(() => {
                            const sourceValue = String(user.source || "manual-admin").trim()
                            const isLeadSource = sourceValue.toLowerCase() === "lead-conversion"
                            const isManualSource = sourceValue.toLowerCase() === "manual-admin"
                            const sourceLabel = isLeadSource ? "From Lead" : isManualSource ? "Manual" : sourceValue
                            return (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                isLeadSource
                                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : isManualSource
                                    ? "border-blue-200 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                                    : "border-slate-200 bg-slate-500/10 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300"
                              }`}>
                                {sourceLabel || "Manual"}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="py-3">
                          {(() => {
                            const status = String(user.status || (user.isActive ? "active" : "inactive")).toLowerCase()
                            const statusClass = userStatusStyles[status] || userStatusStyles.inactive
                            return (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>
                                {status}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 border-border bg-popover text-popover-foreground">
                              <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDeleteConfirm(user)} className="cursor-pointer gap-2 text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-gray-400 mt-3 px-3 pb-3">No users found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── EDIT USER MODAL ──────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border bg-card text-card-foreground shadow-2xl">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update the selected user details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={userEditForm.name || ""} onChange={(e) => setUserEditForm({ ...userEditForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={userEditForm.email || ""} onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={userEditForm.phone || ""} onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })} />
                </div>

                {/* Employee-only fields — hidden for client users */}
                {editingUser.role === "employee" && (
                  <>
                    <div className="space-y-2">
                      <Label>Employee Role</Label>
                      <select
                        className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-background"
                        value={userEditForm.employeeRole || "Staff"}
                        onChange={(e) => setUserEditForm({ ...userEditForm, employeeRole: e.target.value })}
                      >
                        <option value="Manager">Manager</option>
                        <option value="HR">HR</option>
                        <option value="Customer Agent">Customer Agent</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Job Location</Label>
                      {/* FIX: controlled value uses userEditForm.jobLocation which is
                          always "office" | "remote" — never undefined after handleEditUser */}
                      <select
                        className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-background"
                        value={userEditForm.jobLocation}
                        onChange={(e) =>
                          setUserEditForm({ ...userEditForm, jobLocation: e.target.value })
                        }
                      >
                        <option value="office">Office</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Home Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={userEditForm.homeLatitude ?? ""}
                        onChange={(e) => setUserEditForm({ ...userEditForm, homeLatitude: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Home Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={userEditForm.homeLongitude ?? ""}
                        onChange={(e) => setUserEditForm({ ...userEditForm, homeLongitude: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center justify-start">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleUseCurrentLocation("edit")} disabled={fetchingHomeLocation}>
                        {fetchingHomeLocation ? "Fetching location..." : "Use current location"}
                      </Button>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-background"
                    value={userEditForm.status || "active"}
                    onChange={(e) => setUserEditForm({ ...userEditForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={userEditForm.source || ""} onChange={(e) => setUserEditForm({ ...userEditForm, source: e.target.value })} />
              </div>

              {userEditError && <p className="text-sm text-red-400">{userEditError}</p>}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={closeUserEdit} disabled={isUserSaving}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveUserEdit} disabled={isUserSaving}>
                  {isUserSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── DELETE CONFIRM DIALOG ────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{userToDelete?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}