import { requireRole } from "@/lib/auth";
import ClientDashboardPanel from "@/components/projects/ClientDashboardPanel";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import { buildProjectVisibilityQuery } from "@/lib/project-utils";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await requireRole("client");

  await connectToDatabase();
  const query = buildProjectVisibilityQuery(session.user) || {};

  const projects = await Project.find(query)
    .sort({ deadline: 1, updatedAt: -1 })
    .populate("client", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role")
    .lean();
  // Serialize DB objects to plain values so they can be passed to client components
  function serializeId(value) {
    try {
      if (!value) return value;
      if (typeof value === "string") return value;
      if (typeof value.toString === "function") return value.toString();
      return value;
    } catch {
      return value;
    }
  }

  function serializeUser(user) {
    if (!user) return null;
    return {
      _id: serializeId(user._id || user.id || user),
      name: user.name || null,
      email: user.email || null,
      role: user.role || null,
    };
  }

  function serializeTask(task) {
    if (!task) return null;
    return {
      _id: serializeId(task._id || task.id),
      title: task.title,
      description: task.description || "",
      isDone: Boolean(task.isDone),
      doneBy: serializeId(task.doneBy),
      doneAt: task.doneAt ? new Date(task.doneAt).toISOString() : null,
      subtasks: (task.subtasks || []).map((s) => ({
        _id: serializeId(s._id || s.id),
        title: s.title,
        isDone: Boolean(s.isDone),
        doneBy: serializeId(s.doneBy),
        doneAt: s.doneAt ? new Date(s.doneAt).toISOString() : null,
      })),
    };
  }

  function serializeProject(p) {
    if (!p) return p;
    return {
      ...p,
      _id: serializeId(p._id),
      title: p.title,
      description: p.description || "",
      client: typeof p.client === "object" ? serializeUser(p.client) : serializeId(p.client),
      assignedEmployees: (p.assignedEmployees || []).map((e) =>
        typeof e === "object" ? serializeUser(e) : serializeId(e)
      ),
      tags: p.tags || [],
      startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
      deadline: p.deadline ? new Date(p.deadline).toISOString() : null,
      priority: p.priority,
      status: p.status,
      progress: p.progress || 0,
      tasks: (p.tasks || []).map(serializeTask),
      createdBy: typeof p.createdBy === "object" ? serializeUser(p.createdBy) : serializeId(p.createdBy),
      updatedBy: typeof p.updatedBy === "object" ? serializeUser(p.updatedBy) : serializeId(p.updatedBy),
      lastActivityAt: p.lastActivityAt ? new Date(p.lastActivityAt).toISOString() : null,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    };
  }

  const projectsForClient = projects.map(serializeProject);

  return (
    <div className="space-y-6">
      <ClientDashboardPanel projects={projectsForClient} sessionUserId={session.user.id} />
    </div>
  );
}
