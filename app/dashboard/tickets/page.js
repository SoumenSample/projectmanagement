// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import io from "socket.io-client";

// export const dynamic = "force-dynamic";

// const priorityStyles = {
//   high: { label: "HIGH", tone: "border-red-400/40 bg-red-400/10 text-red-200" },
//   medium: { label: "MEDIUM", tone: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
//   low: { label: "LOW", tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
// };

// const statusStyles = {
//   open: "border-cyan-400/30 bg-cyan-400/10 text-black dark:text-white",
//   "in-progress": "border-amber-400/30 bg-amber-400/10 text-amber-100",
//   closed: "border-zinc-400/30 bg-zinc-400/10 text-zinc-100",
// };

// const roleNotes = {
//   admin: "Monitor the queue, assign work, and close tickets when the issue is resolved.",
//   employee: "Take ownership of open requests, update progress, and collaborate with clients.",
//   client: "Create support requests and follow updates on your own tickets.",
// };

// function formatUser(user) {
//   if (!user) return "Unassigned";
//   return user.name || user.email || "Unknown user";
// }

// function formatDate(value) {
//   if (!value) return "";
//   return new Date(value).toLocaleString([], {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });
// }

// function normalizeTicket(ticket) {
//   return {
//     ...ticket,
//     _id: ticket._id?.toString?.() ?? ticket._id,
//     createdBy: ticket.createdBy || null,
//     assignedTo: ticket.assignedTo || null,
//   };
// }

// export default function TicketsPage() {
//   const [session, setSession] = useState(null);
//   const [tickets, setTickets] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [selectedId, setSelectedId] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [notice, setNotice] = useState("");
//   const [showCreateTicket, setShowCreateTicket] = useState(false);
//   const socketRef = useRef(null);

//   const [createForm, setCreateForm] = useState({
//     title: "",
//     description: "",
//     priority: "medium",
//     assignedTo: "",
//   });

//   const [replyForm, setReplyForm] = useState({
//     message: "",
//     file: null,
//   });

//   const [ticketForm, setTicketForm] = useState({
//     status: "",
//     priority: "",
//     assignedTo: "",
//   });

//   const selectedTicket = useMemo(
//     () => tickets.find((ticket) => ticket._id === selectedId) || null,
//     [tickets, selectedId]
//   );

//   useEffect(() => {
//     loadEverything();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (selectedTicket) {
//       setTicketForm({
//         status: selectedTicket.status || "open",
//         priority: selectedTicket.priority || "medium",
//         assignedTo: selectedTicket.assignedTo?._id || "",
//       });
//     }
//   }, [selectedTicket]);

//   useEffect(() => {
//     const userId = session?.user?.id;
//     if (!userId) return;

//     const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
//     const socket = io(socketUrl, { transports: ["websocket", "polling"] });
//     socketRef.current = socket;

//     socket.emit("join", userId);

//     socket.on("ticket-updated", (payload) => {
//       if (!payload?.ticket) return;

//       const incoming = normalizeTicket(payload.ticket);

//       setTickets((current) => {
//         const exists = current.some((ticket) => ticket._id === incoming._id);

//         if (!exists) {
//           return [incoming, ...current];
//         }

//         return current.map((ticket) => (ticket._id === incoming._id ? incoming : ticket));
//       });

//       setNotice(payload.changeType === "created" ? "New ticket arrived." : "Ticket updated in realtime.");
//     });

//     socket.on("notification", (payload) => {
//       if (payload?.type === "ticket") {
//         setNotice(payload.text || "Ticket update");
//       }
//     });

//     return () => {
//       socket.off("ticket-updated");
//       socket.off("notification");
//       socket.disconnect();

//       if (socketRef.current === socket) {
//         socketRef.current = null;
//       }
//     };
//   }, [session?.user?.id]);

//   async function loadEverything() {
//     setLoading(true);
//     setError("");

//     try {
//       const [sessionRes, ticketRes, usersRes] = await Promise.all([
//         fetch("/api/auth/session", { cache: "no-store" }),
//         fetch("/api/tickets", { cache: "no-store" }),
//         fetch("/api/users/list", { credentials: "include", cache: "no-store" }),
//       ]);

//       const sessionData = await sessionRes.json();
//       const ticketData = await ticketRes.json();
//       const usersData = await usersRes.json();

//       if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to load session");
//       if (!ticketRes.ok) throw new Error(ticketData.error || "Failed to load tickets");

//       setSession(sessionData);
//       setTickets((ticketData.tickets || []).map(normalizeTicket));
//       setUsers((usersData.users || []).filter((user) => user.role === "employee" || user.role === "client" || user.role === "admin"));

//       if (!selectedId && ticketData.tickets?.length) {
//         setSelectedId(normalizeTicket(ticketData.tickets[0])._id);
//       }
//     } catch (err) {
//       setError(err.message || "Failed to load ticket workspace");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function createTicket(event) {
//     event.preventDefault();
//     setActionLoading(true);
//     setError("");
//     setNotice("");

//     try {
//       const response = await fetch("/api/tickets", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(createForm),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to create ticket");
//       }

//       const nextTicket = normalizeTicket(data.ticket);
//       setTickets((current) => [nextTicket, ...current.filter((ticket) => ticket._id !== nextTicket._id)]);
//       setSelectedId(nextTicket._id);
//       setCreateForm({ title: "", description: "", priority: "medium", assignedTo: "" });
//       setShowCreateTicket(false);
//       setNotice("Ticket created successfully.");
//     } catch (err) {
//       setError(err.message || "Failed to create ticket");
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function updateTicket(payload) {
//     if (!selectedTicket) return;

//     setActionLoading(true);
//     setError("");
//     setNotice("");

//     try {
//       const response = await fetch(`/api/tickets/${selectedTicket._id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to update ticket");
//       }

//       const nextTicket = normalizeTicket(data.ticket);
//       setTickets((current) => current.map((ticket) => (ticket._id === nextTicket._id ? nextTicket : ticket)));
//       setSelectedId(nextTicket._id);
//       setNotice("Ticket updated.");
//       setReplyForm((current) => ({ ...current, message: "", file: null }));
//     } catch (err) {
//       setError(err.message || "Failed to update ticket");
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function sendReply(event) {
//     event.preventDefault();

//     if (!replyForm.message.trim() && !replyForm.file) return;

//     setActionLoading(true);
//     setError("");
//     setNotice("");

//     try {
//       let fileUrl = "";

//       if (replyForm.file) {
//         const formData = new FormData();
//         formData.append("file", replyForm.file);

//         const uploadResponse = await fetch("/api/upload", {
//           method: "POST",
//           body: formData,
//         });

//         const uploadData = await uploadResponse.json();
//         if (!uploadResponse.ok) {
//           throw new Error(uploadData.error || "Failed to upload file");
//         }

//         fileUrl = uploadData.url;
//       }

//       await updateTicket({ message: replyForm.message, file: fileUrl || undefined });
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   const role = session?.user?.role || "client";
//   const isAdmin = role === "admin";
//   const isEmployee = role === "employee";
//   const isClient = role === "client";
//   const canCreate = true;
//   const canManageSelected = Boolean(selectedTicket) && (isAdmin || isEmployee);
//   const wrapperClassName = isClient
//     ? "grid gap-4 xl:grid-cols-[0.3fr_0.7fr]"
//     : "grid gap-4 xl:grid-cols-[1.05fr_1.35fr_minmax(20rem,1fr)]";

//   return (
//     <div className={wrapperClassName}>
//       {!isClient && (
//       <section className="min-w-0 rounded-xl border border-cyan-500/20 bg-card p-5 shadow-[0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-xl text-card-foreground">
//         <div className="mb-4">
//           <p className="text-xs uppercase tracking-[0.2em] text-black dark:text-white/80">Ticket system</p>
//           <h2 className="mt-1 text-2xl font-bold text-black dark:text-white">Support workspace</h2>
//           <p className="mt-2 text-sm text-black/70 dark:text-white/70">{roleNotes[role]}</p>
//         </div>

//         <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
//           <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
//             <div className="text-xs uppercase tracking-[0.18em] text-black/60 dark:text-white/60">Open</div>
//             <div className="mt-1 text-lg font-semibold text-black dark:text-white">{tickets.filter((ticket) => ticket.status === "open").length}</div>
//           </div>
//           <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
//             <div className="text-xs uppercase tracking-[0.18em] text-black/60 dark:text-white/60">In progress</div>
//             <div className="mt-1 text-lg font-semibold text-black dark:text-white">{tickets.filter((ticket) => ticket.status === "in-progress").length}</div>
//           </div>
//           <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
//             <div className="text-xs uppercase tracking-[0.18em] text-black/60 dark:text-white/60">Closed</div>
//             <div className="mt-1 text-lg font-semibold text-black dark:text-white">{tickets.filter((ticket) => ticket.status === "closed").length}</div>
//           </div>
//           <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
//             <div className="text-xs uppercase tracking-[0.18em] text-black/60 dark:text-white/60">High priority</div>
//             <div className="mt-1 text-lg font-semibold text-black dark:text-white">{tickets.filter((ticket) => ticket.priority === "high").length}</div>
//           </div>
//         </div>

//         {/* {isAdmin && (
//           <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/90">
//             Admin can assign, reassign, and close any ticket. Use this view to balance the queue.
//           </div>
//         )} */}

//         {canCreate && (
//           <form onSubmit={createTicket} className="space-y-3 rounded-lg border border-cyan-500/15 bg-card/80 p-4 text-card-foreground">
//             <div>
//               <label className="mb-1 block text-sm bg-transparent text-black/80 dark:text-white/80">Create ticket</label>
//               <input
//                 className="h-10 w-full rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none placeholder:text-card-foreground/50"
//                 placeholder="Short title"
//                 value={createForm.title}
//                 onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
//                 required
//               />
//             </div>

//             <div>
//               <textarea
//                 className="min-h-28 w-full rounded-md border border-cyan-500/20 bg-card/60 px-3 py-2 text-sm text-card-foreground outline-none placeholder:text-card-foreground/50"
//                 placeholder="Describe the issue, request, or blocker's context."
//                 value={createForm.description}
//                 onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <select
//                 className="h-10 rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none"
//                 value={createForm.priority}
//                 onChange={(event) => setCreateForm((current) => ({ ...current, priority: event.target.value }))}
//               >
//                 <option value="low">Low priority</option>
//                 <option value="medium">Medium priority</option>
//                 <option value="high">High priority</option>
//               </select>

//               {isAdmin ? (
//                 <select
//                   className="h-10 rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none"
//                   value={createForm.assignedTo}
//                   onChange={(event) => setCreateForm((current) => ({ ...current, assignedTo: event.target.value }))}
//                 >
//                   <option value="">Unassigned</option>
//                   {users.filter((user) => user.role === "employee").map((user) => (
//                     <option key={user._id} value={user._id}>
//                       {user.name} ({user.email})
//                     </option>
//                   ))}
//                 </select>
//               ) : (
//                 <div className="flex min-h-10 items-center rounded-md border border-cyan-500/20 bg-card/40 px-3 py-2 text-xs leading-tight text-card-foreground/60 wrap-break-word">
//                   {isEmployee ? "Created by employee, auto-owned by you" : "Client-created tickets start in the open queue"}
//                 </div>
//               )}
//             </div>

//             <button
//               type="submit"
//               disabled={actionLoading}
//               className="inline-flex h-10 w-full items-center justify-center rounded-md bg-transparent border-2 border-gray-500 px-4 text-sm font-semibold text-black dark:text-white transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {actionLoading ? "Working..." : "Create ticket"}
//             </button>
//           </form>
//         )}
//       </section>
//       )}

//       <section className="min-w-0 rounded-xl border border-cyan-500/20 bg-card p-5 shadow-[0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-xl text-card-foreground">
//         <div className="mb-4 flex items-center justify-between gap-3">
//           <div>
//             <p className="text-xs uppercase tracking-[0.2em] text-black dark:text-white/80">Queue</p>
//             <h3 className="text-xl font-semibold text-black dark:text-white">Tickets</h3>
//           </div>
//           <div className="flex items-center gap-2">
//             {isClient && (
//               <button
//                 type="button"
//                 onClick={() => setShowCreateTicket((current) => !current)}
//                 className="rounded-md border border-cyan-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-black dark:text-white/90 transition hover:bg-cyan-500/10"
//               >
//                 {showCreateTicket ? "Close" : "Create ticket"}
//               </button>
//             )}
//             <button
//               type="button"
//               onClick={loadEverything}
//               className="rounded-md border border-cyan-500/25 px-3 py-2 text-xs uppercase tracking-[0.18em] text-black dark:text-white/80 transition hover:bg-cyan-500/10"
//             >
//               Refresh
//             </button>
//           </div>
//         </div>

//         {isClient && showCreateTicket && (
//           <form onSubmit={createTicket} className="mb-4 space-y-3 rounded-lg border border-cyan-500/15 bg-card/80 p-4 text-card-foreground">
//             <div>
//               <label className="mb-1 block text-sm text-black/80 dark:text-white/80">Create ticket</label>
//               <input
//                 className="h-10 w-full rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none placeholder:text-card-foreground/50"
//                 placeholder="Short title"
//                 value={createForm.title}
//                 onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
//                 required
//               />
//             </div>

//             <div>
//               <textarea
//                 className="min-h-28 w-full rounded-md border border-cyan-500/20 bg-card/60 px-3 py-2 text-sm text-card-foreground outline-none placeholder:text-card-foreground/50"
//                 placeholder="Describe the issue, request, or blocker's context."
//                 value={createForm.description}
//                 onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
//                 required
//               />
//             </div>

//             <div className="flex h-10 items-center rounded-md border border-cyan-500/20 bg-card/40 px-3 text-sm text-card-foreground/60">
//               Priority is set by support after review.
//             </div>

//             <button
//               type="submit"
//               disabled={actionLoading}
//               className="inline-flex h-10 w-full items-center justify-center rounded-md bg-cyan-400 px-4 text-sm font-semibold text-black dark:text-white transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {actionLoading ? "Working..." : "Create ticket"}
//             </button>
//           </form>
//         )}

//         {loading ? (
//           <div className="rounded-lg border border-dashed border-cyan-500/20 p-6 text-sm text-black/60 dark:text-white/60">Loading ticket data...</div>
//         ) : tickets.length === 0 ? (
//           <div className="rounded-lg border border-dashed border-cyan-500/20 p-6 text-sm text-black/60 dark:text-white/60">No tickets match your access level yet.</div>
//         ) : (
//           <div className="space-y-3">
//             {tickets.map((ticket) => {
//               const priority = priorityStyles[ticket.priority] || priorityStyles.medium;
//               const selected = ticket._id === selectedId;

//               return (
//                 <button
//                   key={ticket._id}
//                   type="button"
//                   onClick={() => setSelectedId(ticket._id)}
//                   className={`w-full min-w-0 rounded-xl border p-4 text-left transition ${selected ? "border-cyan-300/60 bg-cyan-500/10" : "border-cyan-500/15 bg-card/80 hover:border-cyan-400/30 hover:bg-cyan-500/5"} text-card-foreground`}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0 flex-1">
//                       <div className="wrap-break-word text-sm font-semibold text-black dark:text-white">{ticket.title}</div>
//                       <div className="mt-1 wrap-break-word text-xs text-black/60 dark:text-white/60">{ticket.description}</div>
//                     </div>
//                     <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black dark:text-white ${priority.tone}`}>
//                       {priority.label}
//                     </span>
//                   </div>

//                   <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-black/65 dark:text-white/65">
//                     <span className={`rounded-full border px-2 py-1 uppercase text-black dark:text-white tracking-[0.16em] ${statusStyles[ticket.status] || statusStyles.open}`}>
//                       {ticket.status}
//                     </span>
//                     <span className="wrap-break-word">Created by {formatUser(ticket.createdBy)}</span>
//                     <span className="wrap-break-word">Assigned to {formatUser(ticket.assignedTo)}</span>
//                     <span>{ticket.messages?.length || 0} messages</span>
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </section>

//       <section className="min-w-0 rounded-xl border border-cyan-500/20 bg-card p-5 shadow-[0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-xl text-card-foreground">
//         {selectedTicket ? (
//           <div className="flex h-full flex-col">
//             <div className="border-b border-cyan-500/15 pb-4">
//               <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
//                 <div className="min-w-0 flex-1">
//                   <p className="text-xs uppercase tracking-[0.2em] text-black dark:text-white/80">Selected ticket</p>
//                   <h3 className="mt-1 wrap-break-word text-2xl font-bold text-black dark:text-white">{selectedTicket.title}</h3>
//                   <p className="mt-2 wrap-break-word text-sm text-black/70 dark:text-white/70">{selectedTicket.description}</p>
//                 </div>
//                 <div className="shrink-0 space-y-2 text-left text-xs text-black/70 dark:text-white/70 md:text-right">
//                   <div className={`inline-flex rounded-full border px-2 py-1 uppercase tracking-[0.18em] text-black dark:text-white ${statusStyles[selectedTicket.status] || statusStyles.open}`}>{selectedTicket.status}</div>
//                   <div className={`inline-flex rounded-full border px-2 py-1 uppercase tracking-[0.18em] ${(priorityStyles[selectedTicket.priority] || priorityStyles.medium).tone}`}>
//                     {(priorityStyles[selectedTicket.priority] || priorityStyles.medium).label}
//                   </div>
//                   <div>Created {formatDate(selectedTicket.createdAt)}</div>
//                 </div>
//               </div>

//               <div className="mt-4 grid gap-3 text-sm text-black/70 dark:text-white/70 lg:grid-cols-2 xl:grid-cols-3">
//                 <div className="rounded-lg border border-cyan-500/15 bg-card/80 p-3 text-card-foreground">
//                   <div className="text-xs uppercase tracking-[0.16em] text-black/60 dark:text-white/60">Created by</div>
//                   <div className="mt-1 wrap-break-word font-medium text-black dark:text-white">{formatUser(selectedTicket.createdBy)}</div>
//                 </div>
//                 <div className="rounded-lg border border-cyan-500/15 bg-card/80 p-3 text-card-foreground">
//                   <div className="text-xs uppercase tracking-[0.16em] text-black/60 dark:text-white/60">Assigned to</div>
//                   <div className="mt-1 wrap-break-word font-medium text-black dark:text-white">{formatUser(selectedTicket.assignedTo)}</div>
//                 </div>
//                 <div className="rounded-lg border border-cyan-500/15 bg-card/80 p-3 text-card-foreground">
//                   <div className="text-xs uppercase tracking-[0.16em] text-black/60 dark:text-white/60">Updated</div>
//                   <div className="mt-1 wrap-break-word font-medium text-black dark:text-white">{formatDate(selectedTicket.updatedAt)}</div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex-1 space-y-3 overflow-y-auto py-4">
//               {(selectedTicket.messages || []).length === 0 ? (
//                 <div className="rounded-lg border border-dashed border-cyan-500/20 p-6 text-sm text-black/60 dark:text-white/60">No messages yet. Add the first update or assignment note.</div>
//               ) : (
//                 selectedTicket.messages.map((message, index) => {
//                   const isOwn = message.sender?._id === session?.user?.id;

//                   return (
//                     <div
//                       key={`${message._id || index}`}
//                       className={`max-w-[86%] min-w-0 rounded-xl border p-4 ${isOwn ? "ml-auto border-cyan-400/30 bg-cyan-500/10" : "border-cyan-500/15 bg-card/80"} text-card-foreground`}
//                     >
//                       <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-black/60 dark:text-white/60">
//                         <span className="wrap-break-word">{formatUser(message.sender)}</span>
//                         <span className="wrap-break-word">{formatDate(message.createdAt)}</span>
//                       </div>
//                       <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-black dark:text-white">{message.text || "File attachment only"}</p>
//                       {message.file && (
//                         <a className="mt-3 inline-flex rounded-md border border-cyan-400/20 px-2 py-1 text-xs text-black dark:text-white transition hover:bg-cyan-500/10" href={message.file} target="_blank" rel="noreferrer">
//                           View attachment
//                         </a>
//                       )}
//                     </div>
//                   );
//                 })
//               )}
//             </div>

//             <div className="border-t border-cyan-500/15 pt-4">
//               {canManageSelected && (
//                 <div className="mb-4 grid gap-3 md:grid-cols-3">
//                   <select
//                     className="h-10 rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none"
//                     value={ticketForm.status}
//                     onChange={(event) => setTicketForm((current) => ({ ...current, status: event.target.value }))}
//                   >
//                     <option value="open">Open</option>
//                     <option value="in-progress">In progress</option>
//                     <option value="closed">Closed</option>
//                   </select>

//                   <select
//                     className="h-10 rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none"
//                     value={ticketForm.priority}
//                     onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value }))}
//                   >
//                     <option value="low">Low priority</option>
//                     <option value="medium">Medium priority</option>
//                     <option value="high">High priority</option>
//                   </select>

//                   <select
//                     className="h-10 rounded-md border border-cyan-500/20 bg-card/60 px-3 text-sm text-card-foreground outline-none"
//                     value={ticketForm.assignedTo}
//                     onChange={(event) => setTicketForm((current) => ({ ...current, assignedTo: event.target.value }))}
//                   >
//                     <option value="">Unassigned</option>
//                     {users.filter((user) => user.role === "employee").map((user) => (
//                       <option key={user._id} value={user._id}>
//                         {user.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}

//               <form onSubmit={sendReply} className="space-y-3">
//                 <textarea
//                   className="min-h-24 w-full rounded-md border border-cyan-500/20 bg-card/60 px-3 py-2 text-sm text-card-foreground outline-none placeholder:text-card-foreground/50"
//                   placeholder={isClientOrEmployee(role) ? "Write an update to the ticket..." : "Add an internal note or client reply..."}
//                   value={replyForm.message}
//                   onChange={(event) => setReplyForm((current) => ({ ...current, message: event.target.value }))}
//                 />

//                 <div className="flex flex-wrap items-center gap-3">
//                   <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-cyan-500/20 px-3 text-sm text-black/80 dark:text-white/80 transition hover:bg-cyan-500/10">
//                     Attach file
//                     <input
//                       className="hidden"
//                       type="file"
//                       onChange={(event) => setReplyForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
//                     />
//                   </label>

//                   {replyForm.file && <span className="text-sm text-black/60 dark:text-white/60">{replyForm.file.name}</span>}

//                   {canManageSelected && (
//                     <button
//                       type="button"
//                       onClick={() => updateTicket(ticketForm)}
//                       disabled={actionLoading}
//                       className="inline-flex h-10 items-center justify-center rounded-md border border-cyan-400/30 px-4 text-sm font-semibold text-black dark:text-white transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
//                     >
//                       Save ticket
//                     </button>
//                   )}

//                   <button
//                     type="submit"
//                     disabled={actionLoading || (!replyForm.message.trim() && !replyForm.file)}
//                     className="inline-flex h-10 items-center justify-center rounded-md bg-transparent border-2 border-gray-500 px-4 text-sm font-semibold text-black dark:text-white transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
//                   >
//                     {actionLoading ? "Working..." : "Send message"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         ) : (
//           <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-cyan-500/20 p-8 text-sm text-black/60 dark:text-white/60">
//             Select a ticket to inspect details, change ownership, and track progress.
//           </div>
//         )}
//       </section>

//       {(error || notice) && (
//         <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-cyan-500/20 bg-card/90 px-4 py-3 text-sm text-card-foreground shadow-2xl backdrop-blur-xl">
//           {error || notice}
//         </div>
//       )}
//     </div>
//   );
// }

// function isClientOrEmployee(role) {
//   return role === "client" || role === "employee";
// }



"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";

export const dynamic = "force-dynamic";

const priorityStyles = {
  high:   { label: "HIGH",   tone: "border-red-300   bg-red-50   text-red-700   dark:border-red-800   dark:bg-red-950/40   dark:text-red-400"   },
  medium: { label: "MEDIUM", tone: "border-amber-300  bg-amber-50  text-amber-700  dark:border-amber-800  dark:bg-amber-950/40  dark:text-amber-400"  },
  low:    { label: "LOW",    tone: "border-green-300  bg-green-50  text-green-700  dark:border-green-800  dark:bg-green-950/40  dark:text-green-400"  },
};

const statusStyles = {
  "open":        "border-gray-300   bg-gray-100   text-gray-700   dark:border-white/20  dark:bg-white/10  dark:text-gray-300",
  "in-progress": "border-amber-300  bg-amber-50   text-amber-700  dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  "closed":      "border-gray-200   bg-gray-50    text-gray-500   dark:border-white/10  dark:bg-white/5   dark:text-gray-500",
};

const roleNotes = {
  admin:    "Monitor the queue, assign work, and close tickets when the issue is resolved.",
  employee: "Take ownership of open requests, update progress, and collaborate with clients.",
  client:   "Create support requests and follow updates on your own tickets.",
};

function formatUser(user) {
  if (!user) return "Unassigned";
  return user.name || user.email || "Unknown user";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function normalizeTicket(ticket) {
  return {
    ...ticket,
    _id: ticket._id?.toString?.() ?? ticket._id,
    createdBy: ticket.createdBy || null,
    assignedTo: ticket.assignedTo || null,
  };
}

function resolveProjectTitle(project, projects = []) {
  if (!project) return "—";

  if (typeof project === "string") {
    return projects.find((item) => (item._id || item.id) === project)?.title || "—";
  }

  return project.title || project.name || "—";
}

function isClientOrEmployee(role) {
  return role === "client" || role === "employee";
}

/* ── Shared input class ── */
const inputCls = `h-10 w-full rounded-lg border border-gray-200 dark:border-white/10
  bg-gray-50 dark:bg-white/5 px-3 text-sm
  text-gray-900 dark:text-white dark:bg-white
  placeholder:text-gray-400 dark:placeholder:text-white/30
  outline-none focus:border-gray-400 dark:focus:border-white/30
  focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10 transition-all`;

const textareaCls = `w-full rounded-lg border border-gray-200 dark:border-white/10
  bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm
  text-gray-900 dark:text-white
  placeholder:text-gray-400 dark:placeholder:text-white/30
  outline-none focus:border-gray-400 dark:focus:border-white/30
  focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10 transition-all resize-none`;

const sectionCls = `min-w-0 rounded-2xl border border-gray-200 dark:border-white/10
  bg-white dark:bg-zinc-900 p-5 shadow-sm`;

function CreateTicketForm({
  forClient = false,
  actionLoading,
  createForm,
  projects,
  users,
  isAdmin,
  isEmployee,
  onSubmit,
  onChange,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {forClient ? "New support request" : "Create ticket"}
      </p>

      <input
        className={inputCls}
        placeholder="Short, descriptive title"
        value={createForm.title}
        onChange={(e) => onChange((current) => ({ ...current, title: e.target.value }))}
        required
      />

      <select
        className={inputCls}
        value={createForm.project}
        onChange={(e) => onChange((current) => ({ ...current, project: e.target.value }))}
        required
      >
        {projects.length === 0 && (
          <option value="" className="text-black">No accessible projects</option>
        )}
        {projects.map((project) => (
          <option key={project._id} value={project._id} className="text-black">
            {project.title}
          </option>
        ))}
      </select>

      <textarea
        className={`${textareaCls} min-h-24`}
        placeholder="Describe the issue, request, or context…"
        value={createForm.description}
        onChange={(e) => onChange((current) => ({ ...current, description: e.target.value }))}
        required
      />

      {!forClient ? (
        <div className="grid grid-cols-2 gap-3">
          <select
            className={inputCls}
            value={createForm.priority}
            onChange={(e) => onChange((current) => ({ ...current, priority: e.target.value }))}
          >
            <option value="low" className="text-black">🟢 Low priority</option>
            <option value="medium" className="text-black">🟡 Medium priority</option>
            <option value="high" className="text-black">🔴 High priority</option>
          </select>

          {isAdmin ? (
            <select
              className={inputCls}
              value={createForm.assignedTo}
              onChange={(e) => onChange((current) => ({ ...current, assignedTo: e.target.value }))}
            >
              <option value="" className="text-black">Unassigned</option>
              {users.filter((u) => u.role === "employee").map((u) => (
                <option className="text-black" key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          ) : (
            <div className="flex h-10 items-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-xs text-gray-500 dark:text-gray-400">
              {isEmployee ? "Auto-owned by you" : "Assigned after review"}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-10 items-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-xs text-gray-500 dark:text-gray-400">
          Priority is set by support after review.
        </div>
      )}

      <button
        type="submit"
        disabled={actionLoading || !projects.length || !createForm.project}
        className="flex h-10 w-full items-center justify-center rounded-lg
          bg-gray-900 text-white dark:bg-white dark:text-black
          text-sm font-semibold hover:opacity-90 transition-opacity
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLoading ? "Creating…" : "Create ticket"}
      </button>
    </form>
  );
}

export default function TicketsPage() {
  const [session, setSession] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const socketRef = useRef(null);

  const [createForm, setCreateForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", project: "" });
  const [replyForm, setReplyForm] = useState({ message: "", file: null });
  const [ticketForm, setTicketForm] = useState({ status: "", priority: "", assignedTo: "" });

  const selectedTicket = useMemo(
    () => tickets.find((t) => t._id === selectedId) || null,
    [tickets, selectedId]
  );

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setTicketForm({
        status: selectedTicket.status || "open",
        priority: selectedTicket.priority || "medium",
        assignedTo: selectedTicket.assignedTo?._id || "",
      });
    }
  }, [selectedTicket]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        userId,
      },
    });
    socketRef.current = socket;
    socket.emit("join", { userId });

    socket.on("ticket-updated", (payload) => {
      if (!payload?.ticket) return;
      const incoming = normalizeTicket(payload.ticket);
      setTickets((cur) => {
        const exists = cur.some((t) => t._id === incoming._id);
        return exists ? cur.map((t) => (t._id === incoming._id ? incoming : t)) : [incoming, ...cur];
      });
      setNotice(payload.changeType === "created" ? "New ticket arrived." : "Ticket updated in realtime.");
    });

    socket.on("notification", (payload) => {
      if (payload?.type === "ticket") setNotice(payload.text || "Ticket update");
    });

    return () => {
      socket.off("ticket-updated");
      socket.off("notification");
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [session?.user?.id]);

  async function loadEverything() {
    setLoading(true);
    setError("");
    try {
      const [sessionRes, ticketRes, usersRes, projectsRes] = await Promise.all([
        fetch("/api/auth/session", { cache: "no-store" }),
        fetch("/api/tickets", { cache: "no-store" }),
        fetch("/api/users/list", { credentials: "include", cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
      ]);
      const sessionData = await sessionRes.json();
      const ticketData  = await ticketRes.json();
      const usersData   = await usersRes.json();
      const projectsData = await projectsRes.json();

      if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to load session");
      if (!ticketRes.ok)  throw new Error(ticketData.error  || "Failed to load tickets");
      if (!projectsRes.ok) throw new Error(projectsData.error || "Failed to load projects");

      setSession(sessionData);
      setTickets((ticketData.tickets || []).map(normalizeTicket));
      setUsers((usersData.users || []).filter((u) => ["employee","client","admin"].includes(u.role)));
      setProjects(projectsData.projects || []);

      const accessibleProjects = projectsData.projects || [];
      setCreateForm((current) => {
        if (current.project && accessibleProjects.some((project) => project._id === current.project)) {
          return current;
        }

        return {
          ...current,
          project: accessibleProjects[0]?._id || "",
        };
      });

      if (!selectedId && ticketData.tickets?.length) {
        setSelectedId(normalizeTicket(ticketData.tickets[0])._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load ticket workspace");
    } finally {
      setLoading(false);
    }
  }

  async function createTicket(event) {
    event.preventDefault();
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      const res  = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");
      const next = normalizeTicket({
        ...data.ticket,
        project: data.ticket?.project || projects.find((project) => (project._id || project.id) === createForm.project) || createForm.project,
      });
      setTickets((cur) => [next, ...cur.filter((t) => t._id !== next._id)]);
      setSelectedId(next._id);
      setCreateForm((current) => ({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        project: current.project,
      }));
      setShowCreateTicket(false);
      setNotice("Ticket created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setActionLoading(false);
    }
  }

  async function updateTicket(payload) {
    if (!selectedTicket) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      const res  = await fetch(`/api/tickets/${selectedTicket._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ticket");
      const next = normalizeTicket(data.ticket);
      setTickets((cur) => cur.map((t) => (t._id === next._id ? next : t)));
      setSelectedId(next._id);
      setNotice("Ticket updated.");
      setReplyForm((cur) => ({ ...cur, message: "", file: null }));
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    } finally {
      setActionLoading(false);
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!replyForm.message.trim() && !replyForm.file) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      let fileUrl = "";
      if (replyForm.file) {
        const formData = new FormData();
        formData.append("file", replyForm.file);
        const uploadRes  = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload file");
        fileUrl = uploadData.url;
      }
      await updateTicket({ message: replyForm.message, file: fileUrl || undefined });
    } finally {
      setActionLoading(false);
    }
  }

  const role             = session?.user?.role || "client";
  const isAdmin          = role === "admin";
  const isEmployee       = role === "employee";
  const isClient         = role === "client";
  const canManageSelected = Boolean(selectedTicket) && (isAdmin || isEmployee);
  const wrapperCls       = "grid gap-4 xl:grid-cols-[0.3fr_0.7fr]";
  const selectedTicketProjectTitle = resolveProjectTitle(selectedTicket?.project, projects);

  return (
    <div className={wrapperCls}>

      {/* ── MIDDLE PANEL (ticket queue) ── */}
      <section className={sectionCls}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Queue</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tickets</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateTicket(true)}
              className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              + Create ticket
            </button>
            <button
              type="button"
              onClick={loadEverything}
              className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-400 dark:text-gray-600">
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-400 dark:text-gray-600">
            No tickets match your access level yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {tickets.map((ticket) => {
              const priority = priorityStyles[ticket.priority] || priorityStyles.medium;
              const selected = ticket._id === selectedId;

              return (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => setSelectedId(ticket._id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all
                    ${selected
                      ? "border-gray-400 dark:border-white/30 bg-gray-100 dark:bg-white/10 shadow-sm"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{ticket.title}</div>
                      <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{ticket.description}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${priority.tone}`}>
                      {priority.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[ticket.status] || statusStyles.open}`}>
                      {ticket.status}
                    </span>
                    <span>{resolveProjectTitle(ticket.project, projects) !== "—" ? resolveProjectTitle(ticket.project, projects) : "No project"}</span>
                    <span>By {formatUser(ticket.createdBy)}</span>
                    <span>→ {formatUser(ticket.assignedTo)}</span>
                    <span className="ml-auto">{ticket.messages?.length || 0} msg</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RIGHT PANEL (ticket detail) ── */}
      <section className={sectionCls}>
        {selectedTicket ? (
          <div className="flex h-full flex-col gap-4">

            {/* Header */}
            <div className="border-b border-gray-100 dark:border-white/10 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Selected ticket</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white leading-snug">{selectedTicket.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{selectedTicket.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[selectedTicket.status] || statusStyles.open}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${(priorityStyles[selectedTicket.priority] || priorityStyles.medium).tone}`}>
                    {(priorityStyles[selectedTicket.priority] || priorityStyles.medium).label}
                  </span>
                </div>
              </div>

              {/* Meta grid */}
              <div className="mt-4 grid gap-2 lg:grid-cols-3">
                {[
                  { label: "Project",    val: selectedTicketProjectTitle },
                  { label: "Created by", val: formatUser(selectedTicket.createdBy) },
                  { label: "Assigned to", val: formatUser(selectedTicket.assignedTo) },
                  { label: "Updated",    val: formatDate(selectedTicket.updatedAt) },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</div>
                    <div className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">{val || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
              {(selectedTicket.messages || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                  No messages yet. Add the first update or reply.
                </div>
              ) : (
                selectedTicket.messages.map((msg, index) => {
                  const isOwn = msg.sender?._id === session?.user?.id;
                  return (
                    <div
                      key={msg._id || index}
                      className={`max-w-[88%] rounded-xl border p-3.5
                        ${isOwn
                          ? "ml-auto border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-gray-400 dark:text-gray-500 mb-2">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{formatUser(msg.sender)}</span>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">{msg.text || "File attachment only"}</p>
                      {msg.file && (
                        <a
                          href={msg.file}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          View attachment
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-3">
              {canManageSelected && (
                <div className="grid gap-2 md:grid-cols-3">
                  <select className={inputCls} value={ticketForm.status}
                    onChange={(e) => setTicketForm((c) => ({ ...c, status: e.target.value }))}>
                    <option value="open" className="text-black">Open</option>
                    <option value="in-progress" className="text-black">In progress</option>
                    <option value="closed" className="text-black">Closed</option>
                  </select>

                  <select className={inputCls} value={ticketForm.priority}
                    onChange={(e) => setTicketForm((c) => ({ ...c, priority: e.target.value }))}>
                    <option value="low" className="text-black">🟢 Low priority</option>
                    <option value="medium" className="text-black">🟡 Medium priority</option>
                    <option value="high" className="text-black">🔴 High priority</option>
                  </select>

                  <select className={inputCls} value={ticketForm.assignedTo}
                    onChange={(e) => setTicketForm((c) => ({ ...c, assignedTo: e.target.value }))}>
                    <option value="" className="text-black">Unassigned</option>
                    {users.filter((u) => u.role === "employee").map((u) => (
                      <option key={u._id} value={u._id} className="text-black">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={sendReply} className="space-y-3">
                <textarea
                  className={`${textareaCls} min-h-20`}
                  placeholder={isClientOrEmployee(role) ? "Write an update…" : "Add a note or client reply…"}
                  value={replyForm.message}
                  onChange={(e) => setReplyForm((c) => ({ ...c, message: e.target.value }))}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    Attach file
                    <input className="hidden" type="file" onChange={(e) => setReplyForm((c) => ({ ...c, file: e.target.files?.[0] || null }))} />
                  </label>

                  {replyForm.file && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-35">{replyForm.file.name}</span>
                  )}

                  <div className="flex gap-2 ml-auto">
                    {canManageSelected && (
                      <button
                        type="button"
                        onClick={() => updateTicket(ticketForm)}
                        disabled={actionLoading}
                        className="h-9 px-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save ticket
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading || (!replyForm.message.trim() && !replyForm.file)}
                      className="h-9 px-4 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Sending…" : "Send message"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-400 dark:text-gray-600">
            Select a ticket to inspect details, change ownership, and track progress.
          </div>
        )}
      </section>

      {showCreateTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <button
            type="button"
            aria-label="Close create ticket"
            onClick={() => setShowCreateTicket(false)}
            className="absolute inset-0 h-full w-full cursor-pointer"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b0f14] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ticket system</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Support workspace</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{roleNotes[role]}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTicket(false)}
                className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider
                  text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Open",        val: tickets.filter((t) => t.status === "open").length },
                { label: "In Progress", val: tickets.filter((t) => t.status === "in-progress").length },
                { label: "Closed",      val: tickets.filter((t) => t.status === "closed").length },
                { label: "High Priority",val: tickets.filter((t) => t.priority === "high").length },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{val}</div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <CreateTicketForm
                forClient={isClient}
                actionLoading={actionLoading}
                createForm={createForm}
                projects={projects}
                users={users}
                isAdmin={isAdmin}
                isEmployee={isEmployee}
                onSubmit={createTicket}
                onChange={setCreateForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {(error || notice) && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm
          ${error
            ? "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400"
            : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300"
          }`}>
          <div className="flex items-center gap-2">
            {error ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {error || notice}
          </div>
        </div>
      )}
    </div>
  );
}