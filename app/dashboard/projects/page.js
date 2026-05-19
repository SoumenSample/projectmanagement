import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProjectsRouterPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/dashboard/admin/projects");
  }

  if (session.user.role === "employee") {
    redirect("/dashboard/employee/projects");
  }

  redirect("/dashboard/client/projects");
}
