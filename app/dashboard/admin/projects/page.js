import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import ProjectManagementWorkspace from "@/components/projects/ProjectManagementWorkspace";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const session = await requireRole("admin");

  await connectToDatabase();
  const users = await User.find({}, { passwordHash: 0 }).sort({ name: 1 }).lean();
  const serializableUsers = JSON.parse(JSON.stringify(users));

  return <ProjectManagementWorkspace role="admin" sessionUserId={session.user.id} users={serializableUsers} canEditTasks />;
}
