import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import ProjectActivity from "@/lib/models/ProjectActivity";
import { canAccessProject } from "@/lib/project-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const project = await Project.findById(id)
    .populate("client", "name email role")
    .populate("assignedEmployees", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!canAccessProject(project, session.user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const activities = await ProjectActivity.find({ project: project._id })
    .sort({ createdAt: -1 })
    .populate("actor", "name email role")
    .lean();

  return Response.json({ activities });
}
