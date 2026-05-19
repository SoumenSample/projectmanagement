// "use client";

// import { useEffect, useMemo, useState } from "react";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// function createEmptyTask() {
//   return {
//     title: "",
//     description: "",
//     subtasks: [""],
//   };
// }

// function flattenUsers(users = [], role) {
//   return users.filter((user) => user.role === role);
// }

// function buildFormFromProject(project) {
//   return {
//     title: project?.title || "",
//     description: project?.description || "",
//     clientId: project?.client?._id || project?.client?.id || project?.client || "",
//     deadline: project?.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : "",
//     priority: project?.priority || "medium",
//     status: project?.status || "planning",
//     tags: Array.isArray(project?.tags) ? project.tags.join(", ") : "",
//     tasks: [createEmptyTask()],
//   };
// }

// export default function ProjectCreatePanel({
//   users = [],
//   initialProject = null,
//   onSaved,
//   onCancel,
//   mode = "create",
//   showTaskOutline = true,
// }) {
//   const employees = useMemo(() => flattenUsers(users, "employee"), [users]);
//   const clients = useMemo(() => flattenUsers(users, "client"), [users]);

//   const [form, setForm] = useState(() => buildFormFromProject(initialProject));
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(() =>
//     Array.isArray(initialProject?.assignedEmployees)
//       ? initialProject.assignedEmployees.map((employee) => employee?._id || employee?.id || employee).filter(Boolean)
//       : []
//   );

//   useEffect(() => {
//     setForm(buildFormFromProject(initialProject));
//     setSelectedEmployeeIds(
//       Array.isArray(initialProject?.assignedEmployees)
//         ? initialProject.assignedEmployees.map((employee) => employee?._id || employee?.id || employee).filter(Boolean)
//         : []
//     );
//     setMessage("");
//     setError("");
//   }, [initialProject]);

//   function updateTask(index, key, value) {
//     setForm((current) => ({
//       ...current,
//       tasks: current.tasks.map((task, taskIndex) => (taskIndex === index ? { ...task, [key]: value } : task)),
//     }));
//   }

//   function updateSubtask(taskIndex, subtaskIndex, value) {
//     setForm((current) => ({
//       ...current,
//       tasks: current.tasks.map((task, index) => {
//         if (index !== taskIndex) return task;

//         return {
//           ...task,
//           subtasks: task.subtasks.map((subtask, currentIndex) => (currentIndex === subtaskIndex ? value : subtask)),
//         };
//       }),
//     }));
//   }

//   function toggleEmployee(employeeId) {
//     setSelectedEmployeeIds((current) =>
//       current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId]
//     );
//   }

//   async function handleSubmit(event) {
//     event.preventDefault();

//     setSubmitting(true);
//     setMessage("");
//     setError("");

//     try {
//       const payload = {
//         title: form.title,
//         description: form.description,
//         clientId: form.clientId || null,
//         assignedEmployeeIds: selectedEmployeeIds,
//         deadline: form.deadline,
//         priority: form.priority,
//         status: form.status,
//         tags: form.tags
//           .split(",")
//           .map((tag) => tag.trim())
//           .filter(Boolean),
//         ...(mode === "create"
//           ? {
//               tasks: form.tasks
//                 .filter((task) => task.title.trim())
//                 .map((task) => ({
//                   title: task.title,
//                   description: task.description,
//                   subtasks: task.subtasks
//                     .map((subtask) => subtask.trim())
//                     .filter(Boolean)
//                     .map((subtask) => ({ title: subtask })),
//                 })),
//             }
//           : {}),
//       };

//       const response = await fetch(mode === "edit" ? `/api/projects/${initialProject?._id}` : "/api/projects", {
//         method: mode === "edit" ? "PATCH" : "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || (mode === "edit" ? "Failed to update project" : "Failed to create project"));
//       }

//       if (mode === "create") {
//         setForm(buildFormFromProject(null));
//         setSelectedEmployeeIds([]);
//       }

//       setMessage(mode === "edit" ? "Project updated successfully." : "Project created successfully.");
//       onSaved?.(data.project);
//     } catch (submitError) {
//       setError(submitError.message || (mode === "edit" ? "Failed to update project" : "Failed to create project"));
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <Card className="border-cyan-400/20 bg-white text-black dark:bg-black dark:text-white shadow-sm">
//       <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
//         <div>
//           <CardTitle>{mode === "edit" ? "Edit Project" : "Create Project"}</CardTitle>
//           <CardDescription>
//             {mode === "edit"
//               ? "Update project details, assignees, status, priority, and deadline."
//               : "Define project metadata, choose one or more employees, and add the first task block."}
//           </CardDescription>
//         </div>

//         <Button type="button" variant="ghost" onClick={onCancel}>
//           Close
//         </Button>
//       </CardHeader>

//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-5 bg-transparent">
//           <div className="grid gap-4 md:grid-cols-2">
//             <input
//               value={form.title}
//               onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
//               placeholder="Project title"
//               className="h-11 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35"
//               required
//             />

//             <input
//               type="date"
//               value={form.deadline}
//               onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
//               className="h-11 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none"
//               required
//             />

//             <select
//               value={form.priority}
//               onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
//               className="h-11 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none"
//             >
//               <option value="low">Low</option>
//               <option value="medium">Medium</option>
//               <option value="high">High</option>
//             </select>

//             <select
//               value={form.status}
//               onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
//               className="h-11 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none"
//             >
//               <option value="planning">Planning</option>
//               <option value="in-progress">In progress</option>
//               <option value="at-risk">At risk</option>
//               <option value="completed">Completed</option>
//               <option value="paused">Paused</option>
//             </select>
//           </div>

//           <textarea
//             value={form.description}
//             onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
//             rows={4}
//             placeholder="Project description"
//             className="w-full rounded-md border border-cyan-500/20 bg-black/40 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35"
//           />

//           <div className="grid gap-4 md:grid-cols-2">
//             <select
//               value={form.clientId}
//               onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
//               className="h-11 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none"
//             >
//               <option value="">No client assigned</option>
//               {clients.map((client) => (
//                 <option key={client._id} value={client._id}>
//                   {client.name} ({client.email})
//                 </option>
//               ))}
//             </select>

//             <div className="rounded-md border border-cyan-500/20 bg-black/40 p-3">
//               <div className="mb-3 flex items-center justify-between gap-3">
//                 <p className="text-sm text-cyan-100/80">Assign employees</p>
//                 <p className="text-xs text-cyan-100/45">{selectedEmployeeIds.length} selected</p>
//               </div>

//               <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
//                 {employees.length ? (
//                   employees.map((employee) => {
//                     const checked = selectedEmployeeIds.includes(employee._id);

//                     return (
//                       <label
//                         key={employee._id}
//                         className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
//                           checked
//                             ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-50"
//                             : "border-cyan-500/10 bg-black/20 text-cyan-100/75 hover:bg-black/30"
//                         }`}
//                       >
//                         <span>
//                           <span className="block font-medium">{employee.name}</span>
//                           <span className="block text-xs text-cyan-100/45">{employee.email}</span>
//                         </span>

//                         <input
//                           type="checkbox"
//                           checked={checked}
//                           onChange={() => toggleEmployee(employee._id)}
//                           className="h-4 w-4 rounded border-cyan-400/40 bg-black/40 text-cyan-400"
//                         />
//                       </label>
//                     );
//                   })
//                 ) : (
//                   <p className="text-sm text-cyan-100/55">No employees available.</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           <input
//             value={form.tags}
//             onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
//             placeholder="Tags: Research, Design, Launch"
//             className="h-11 w-full rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/35"
//           />

//           {showTaskOutline ? (
//             <div className="space-y-4 rounded-2xl border border-gray-500/10 text-black p-4">
//               <div className="flex items-center justify-between">
//                 <h4 className="text-sm font-semibold text-cyan-50">Task outline</h4>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setForm((current) => ({ ...current, tasks: [...current.tasks, createEmptyTask()] }))}
//                 >
//                   Add task
//                 </Button>
//               </div>

//               <div className="space-y-4">
//                 {form.tasks.map((task, taskIndex) => (
//                   <div key={taskIndex} className="space-y-3 rounded-xl border border-cyan-500/10 bg-black/35 p-3">
//                     <div className="grid gap-3 md:grid-cols-[1fr_auto]">
//                       <input
//                         value={task.title}
//                         onChange={(event) => updateTask(taskIndex, "title", event.target.value)}
//                         placeholder={`Task ${taskIndex + 1}`}
//                         className="h-10 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/30"
//                       />

//                       <Button
//                         type="button"
//                         variant="ghost"
//                         onClick={() =>
//                           setForm((current) => ({
//                             ...current,
//                             tasks: current.tasks.filter((_, index) => index !== taskIndex),
//                           }))
//                         }
//                         disabled={form.tasks.length === 1}
//                       >
//                         Remove
//                       </Button>
//                     </div>

//                     <textarea
//                       value={task.description}
//                       onChange={(event) => updateTask(taskIndex, "description", event.target.value)}
//                       rows={2}
//                       placeholder="Task description"
//                       className="w-full rounded-md border border-cyan-500/20 bg-black/40 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/30"
//                     />

//                     <div className="space-y-2 pl-1">
//                       <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">Subtasks</div>
//                       {task.subtasks.map((subtask, subtaskIndex) => (
//                         <div key={subtaskIndex} className="grid gap-2 md:grid-cols-[1fr_auto]">
//                           <input
//                             value={subtask}
//                             onChange={(event) => updateSubtask(taskIndex, subtaskIndex, event.target.value)}
//                             placeholder={`Subtask ${subtaskIndex + 1}`}
//                             className="h-10 rounded-md border border-cyan-500/20 bg-black/40 px-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/30"
//                           />
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             onClick={() =>
//                               setForm((current) => ({
//                                 ...current,
//                                 tasks: current.tasks.map((item, index) => {
//                                   if (index !== taskIndex) return item;

//                                   return {
//                                     ...item,
//                                     subtasks: item.subtasks.filter((_, currentIndex) => currentIndex !== subtaskIndex),
//                                   };
//                                 }),
//                               }))
//                             }
//                             disabled={task.subtasks.length === 1}
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       ))}

//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() =>
//                           setForm((current) => ({
//                             ...current,
//                             tasks: current.tasks.map((item, index) => {
//                               if (index !== taskIndex) return item;

//                               return {
//                                 ...item,
//                                 subtasks: [...item.subtasks, ""],
//                               };
//                             }),
//                           }))
//                         }
//                       >
//                         Add subtask
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ) : null}

//           {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
//           {error ? <p className="text-sm text-rose-300">{error}</p> : null}

//           <div className="flex flex-wrap gap-2">
//             <Button type="submit" className="flex-1" disabled={submitting}>
//               {submitting ? (mode === "edit" ? "Saving project..." : "Creating project...") : mode === "edit" ? "Save project" : "Create project"}
//             </Button>
//             <Button type="button" variant="outline" onClick={onCancel}>
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }



"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function createEmptyTask() {
  return { title: "", description: "", subtasks: [""] };
}

function flattenUsers(users = [], role) {
  if (role === "assignable") {
    // For assignable people, include both employees and admins
    return users.filter((user) => ["employee", "admin"].includes(user.role));
  }
  return users.filter((user) => user.role === role);
}

function buildFormFromProject(project) {
  return {
    title: project?.title || "",
    description: project?.description || "",
    clientId: project?.client?._id || project?.client?.id || project?.client || "",
    deadline: project?.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : "",
    priority: project?.priority || "medium",
    status: project?.status || "planning",
    tags: Array.isArray(project?.tags) ? project.tags.join(", ") : "",
    tasks: [createEmptyTask()],
  };
}

export default function ProjectCreatePanel({
  users = [],
  role,
  sessionUserId,
  initialProject = null,
  onSaved,
  onCancel,
  mode = "create",
  showTaskOutline = true,
}) {
  const employees = useMemo(() => flattenUsers(users, "employee"), [users]);
  const assignableUsers = useMemo(() => flattenUsers(users, "assignable"), [users]);
  const clients = useMemo(() => flattenUsers(users, "client"), [users]);

  const [form, setForm] = useState(() => buildFormFromProject(initialProject));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(() => {
    // For create mode with employee role, auto-select current user
    if (mode === "create" && role === "employee" && sessionUserId) {
      return [sessionUserId];
    }
    // For edit mode, use existing assignments
    if (Array.isArray(initialProject?.assignedEmployees)) {
      return initialProject.assignedEmployees.map((e) => e?._id || e?.id || e).filter(Boolean);
    }
    return [];
  });

  useEffect(() => {
    setForm(buildFormFromProject(initialProject));
    setSelectedEmployeeIds(
      Array.isArray(initialProject?.assignedEmployees)
        ? initialProject.assignedEmployees.map((e) => e?._id || e?.id || e).filter(Boolean)
        : []
    );
    setMessage("");
    setError("");
  }, [initialProject]);

  function updateTask(index, key, value) {
    setForm((c) => ({ ...c, tasks: c.tasks.map((t, i) => (i === index ? { ...t, [key]: value } : t)) }));
  }

  function updateSubtask(taskIndex, subtaskIndex, value) {
    setForm((c) => ({
      ...c,
      tasks: c.tasks.map((t, i) => {
        if (i !== taskIndex) return t;
        return { ...t, subtasks: t.subtasks.map((s, si) => (si === subtaskIndex ? value : s)) };
      }),
    }));
  }

  function toggleEmployee(id) {
    setSelectedEmployeeIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description,
        clientId: form.clientId || null,
        assignedEmployeeIds: selectedEmployeeIds,
        deadline: form.deadline,
        priority: form.priority,
        status: form.status,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        ...(mode === "create"
          ? {
              tasks: form.tasks
                .filter((t) => t.title.trim())
                .map((t) => ({
                  title: t.title,
                  description: t.description,
                  subtasks: t.subtasks.map((s) => s.trim()).filter(Boolean).map((s) => ({ title: s })),
                })),
            }
          : {}),
      };

      const response = await fetch(
        mode === "edit" ? `/api/projects/${initialProject?._id}` : "/api/projects",
        { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (mode === "edit" ? "Failed to update project" : "Failed to create project"));

      if (mode === "create") { setForm(buildFormFromProject(null)); setSelectedEmployeeIds([]); }
      setMessage(mode === "edit" ? "Project updated successfully." : "Project created successfully.");
      onSaved?.(data.project);
    } catch (err) {
      setError(err.message || (mode === "edit" ? "Failed to update project" : "Failed to create project"));
    } finally {
      setSubmitting(false);
    }
  }

  const priorityColors = {
    low: "text-emerald-600 dark:text-emerald-400",
    medium: "text-amber-600 dark:text-amber-400",
    high: "text-rose-600 dark:text-rose-400",
  };

  return (
    <>
      <style>{`
        .pcf-root {
          --border: rgba(0,0,0,0.1);
          --input-bg: #f9fafb;
          --input-text: #111827;
          --input-placeholder: #9ca3af;
          --input-focus: #111827;
          --label-color: #6b7280;
          --section-bg: #f3f4f6;
          --section-border: rgba(0,0,0,0.07);
          --card-bg: #ffffff;
          --card-text: #111827;
          --emp-bg: #f9fafb;
          --emp-bg-checked: #f0fdf4;
          --emp-border-checked: #86efac;
          --tag-bg: #f3f4f6;
          --divider: rgba(0,0,0,0.06);
        }
        .dark .pcf-root {
          --border: rgba(255,255,255,0.1);
          --input-bg: rgba(255,255,255,0.05);
          --input-text: #f9fafb;
          --input-placeholder: #6b7280;
          --input-focus: #ffffff;
          --label-color: #9ca3af;
          --section-bg: rgba(255,255,255,0.03);
          --section-border: rgba(255,255,255,0.07);
          --card-bg: #0a0a0a;
          --card-text: #f9fafb;
          --emp-bg: rgba(255,255,255,0.04);
          --emp-bg-checked: rgba(134,239,172,0.08);
          --emp-border-checked: rgba(134,239,172,0.4);
          --tag-bg: rgba(255,255,255,0.06);
          --divider: rgba(255,255,255,0.06);
        }

        .pcf-root { color: var(--card-text); }

        /* Inputs & selects */
        .pcf-input, .pcf-select, .pcf-textarea {
          width: 100%;
          background: var(--input-bg);
          color: var(--input-text);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 0 0.875rem;
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          -webkit-appearance: none;
        }
        .pcf-input, .pcf-select { height: 2.75rem; }
        .pcf-textarea { padding: 0.625rem 0.875rem; resize: vertical; }
        .pcf-input::placeholder, .pcf-textarea::placeholder { color: var(--input-placeholder); }
        .pcf-input:focus, .pcf-select:focus, .pcf-textarea:focus {
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.07);
          background: var(--card-bg);
        }
        .dark .pcf-input:focus, .dark .pcf-select:focus, .dark .pcf-textarea:focus {
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
        }
        .pcf-select option { background: var(--card-bg); color: var(--card-text); }

        /* Field label */
        .pcf-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--label-color);
          margin-bottom: 0.35rem;
        }

        /* Section panels */
        .pcf-section {
          background: var(--section-bg);
          border: 1.5px solid var(--section-border);
          border-radius: 14px;
          padding: 1.125rem;
        }
        .pcf-section-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--label-color);
          margin-bottom: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pcf-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--divider);
        }

        /* Employee chip */
        .pcf-emp {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          padding: 0.6rem 0.875rem;
          background: var(--emp-bg);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          user-select: none;
        }
        .pcf-emp.checked {
          background: var(--emp-bg-checked);
          border-color: var(--emp-border-checked);
        }
        .pcf-emp-name { font-size: 0.84rem; font-weight: 500; color: var(--card-text); }
        .pcf-emp-email { font-size: 0.72rem; color: var(--label-color); }

        /* Custom checkbox */
        .pcf-checkbox {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--border);
          background: var(--input-bg);
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .pcf-checkbox:checked {
          background: #111;
          border-color: #111;
        }
        .dark .pcf-checkbox:checked { background: #fff; border-color: #fff; }
        .pcf-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4px; top: 1px;
          width: 6px; height: 10px;
          border: 2px solid #fff;
          border-top: none; border-left: none;
          transform: rotate(45deg);
        }
        .dark .pcf-checkbox:checked::after { border-color: #111; }

        /* Task card */
        .pcf-task {
          background: var(--card-bg);
          border: 1.5px solid var(--section-border);
          border-radius: 12px;
          padding: 1rem;
          transition: border-color 0.15s;
        }
        .pcf-task:hover { border-color: var(--border); }

        /* Status/priority badge row */
        .pcf-badge-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        /* Feedback messages */
        .pcf-msg-success {
          font-size: 0.83rem;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 8px;
          padding: 0.5rem 0.875rem;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .dark .pcf-msg-success {
          color: #6ee7b7;
          background: rgba(6,95,70,0.15);
          border-color: rgba(110,231,183,0.25);
        }
        .pcf-msg-error {
          font-size: 0.83rem;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 0.5rem 0.875rem;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .dark .pcf-msg-error {
          color: #fca5a5;
          background: rgba(127,29,29,0.15);
          border-color: rgba(252,165,165,0.25);
        }

        /* Scrollbar */
        .pcf-emp-list::-webkit-scrollbar { width: 4px; }
        .pcf-emp-list::-webkit-scrollbar-track { background: transparent; }
        .pcf-emp-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      `}</style>

      <Card className="pcf-root border-0 shadow-lg dark:shadow-black/40 rounded-2xl overflow-hidden"
        style={{ background: "var(--card-bg)", color: "var(--card-text)" }}>

        {/* Header */}
        <CardHeader className="pb-4 pt-6 px-6"
          style={{ borderBottom: "1.5px solid var(--divider)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: "var(--section-bg)", border: "1.5px solid var(--border)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--label-color)" }}>
                  {mode === "edit"
                    ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                    : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                  }
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight" style={{ color: "var(--card-text)" }}>
                  {mode === "edit" ? "Edit Project" : "Create Project"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5" style={{ color: "var(--label-color)" }}>
                  {mode === "edit"
                    ? "Update project details, assignees, status, priority, and deadline."
                    : "Define project metadata, assign employees, and add tasks."}
                </CardDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--label-color)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Basic Info ── */}
            <div className="space-y-4">
              {/* <div className="pcf-section-title">Basic Information</div> */}

              <div>
                <label className="pcf-label">Project Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                  placeholder="e.g. Website Redesign Q4"
                  className="pcf-input"
                  required
                />
              </div>

              <div>
                <label className="pcf-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  rows={3}
                  placeholder="What is this project about?"
                  className="pcf-textarea"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="pcf-label">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((c) => ({ ...c, deadline: e.target.value }))}
                    className="pcf-input"
                    required
                  />
                </div>

                <div>
                  <label className="pcf-label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((c) => ({ ...c, priority: e.target.value }))}
                    className="pcf-select"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                <div>
                  <label className="pcf-label">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                    className="pcf-select"
                  >
                    <option value="planning">📋 Planning</option>
                    <option value="in-progress">⚡ In Progress</option>
                    <option value="at-risk">⚠️ At Risk</option>
                    <option value="completed">✅ Completed</option>
                    <option value="paused">⏸️ Paused</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="pcf-label">Tags</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))}
                  placeholder="Research, Design, Launch  (comma-separated)"
                  className="pcf-input"
                />
              </div>
            </div>

            {/* ── People ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Client */}
              <div>
                <label className="pcf-label">Client</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((c) => ({ ...c, clientId: e.target.value }))}
                  className="pcf-select"
                >
                  <option value="">No client assigned</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employees */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="pcf-label" style={{ margin: 0 }}>Assign Employees</label>
                  {selectedEmployeeIds.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "var(--section-bg)", color: "var(--label-color)", border: "1.5px solid var(--border)" }}>
                      {selectedEmployeeIds.length} selected
                    </span>
                  )}
                </div>
                <div className="pcf-emp-list space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  {assignableUsers.length ? assignableUsers.map((emp) => {
                    const checked = selectedEmployeeIds.includes(emp._id);
                    return (
                      <label key={emp._id} className={`pcf-emp ${checked ? "checked" : ""}`}>
                        <div>
                          <div className="pcf-emp-name">{emp.name}</div>
                          <div className="pcf-emp-email">{emp.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          className="pcf-checkbox"
                          checked={checked}
                          onChange={() => toggleEmployee(emp._id)}
                        />
                      </label>
                    );
                  }) : (
                    <p className="text-sm py-3 text-center" style={{ color: "var(--label-color)" }}>No users available</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Task Outline ── */}
            {showTaskOutline && (
              <div className="pcf-section space-y-4">
                <div className="flex items-center justify-between">
                  <span className="pcf-section-title" style={{ marginBottom: 0 }}>Task Outline</span>
                  <button
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, tasks: [...c.tasks, createEmptyTask()] }))}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: "1.5px solid var(--border)", background: "var(--card-bg)", color: "var(--card-text)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Task
                  </button>
                </div>

                <div className="space-y-3">
                  {form.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="pcf-task space-y-3">
                      {/* Task header */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{ background: "var(--section-bg)", color: "var(--label-color)", border: "1.5px solid var(--border)" }}>
                          {taskIndex + 1}
                        </span>
                        <input
                          value={task.title}
                          onChange={(e) => updateTask(taskIndex, "title", e.target.value)}
                          placeholder={`Task title…`}
                          className="pcf-input flex-1"
                          style={{ height: "2.25rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm((c) => ({ ...c, tasks: c.tasks.filter((_, i) => i !== taskIndex) }))}
                          disabled={form.tasks.length === 1}
                          className="flex items-center justify-center w-8 h-9 rounded-lg transition-colors disabled:opacity-30"
                          style={{ border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "#ef4444" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>

                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(taskIndex, "description", e.target.value)}
                        rows={2}
                        placeholder="Task description (optional)"
                        className="pcf-textarea"
                      />

                      {/* Subtasks */}
                      <div className="pl-3 space-y-2" style={{ borderLeft: "2px solid var(--divider)" }}>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--label-color)" }}>
                          Subtasks
                        </div>

                        {task.subtasks.map((subtask, subtaskIndex) => (
                          <div key={subtaskIndex} className="flex items-center gap-2">
                            <input
                              value={subtask}
                              onChange={(e) => updateSubtask(taskIndex, subtaskIndex, e.target.value)}
                              placeholder={`Subtask ${subtaskIndex + 1}`}
                              className="pcf-input flex-1"
                              style={{ height: "2.25rem" }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setForm((c) => ({
                                  ...c,
                                  tasks: c.tasks.map((t, i) =>
                                    i !== taskIndex ? t : { ...t, subtasks: t.subtasks.filter((_, si) => si !== subtaskIndex) }
                                  ),
                                }))
                              }
                              disabled={task.subtasks.length === 1}
                              className="flex items-center justify-center w-8 h-9 rounded-lg disabled:opacity-30 transition-colors"
                              style={{ border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "#ef4444" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            setForm((c) => ({
                              ...c,
                              tasks: c.tasks.map((t, i) =>
                                i !== taskIndex ? t : { ...t, subtasks: [...t.subtasks, ""] }
                              ),
                            }))
                          }
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ border: "1.5px dashed var(--border)", background: "transparent", color: "var(--label-color)" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Add subtask
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {message && (
              <div className="pcf-msg-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {message}
              </div>
            )}
            {error && (
              <div className="pcf-msg-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--card-text)", color: "var(--card-bg)" }}
              >
                {submitting && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {submitting
                  ? (mode === "edit" ? "Saving…" : "Creating…")
                  : (mode === "edit" ? "Save Project" : "Create Project")}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="h-11 px-5 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--card-text)" }}
              >
                Cancel
              </button>
            </div>

          </form>
        </CardContent>
      </Card>
    </>
  );
}