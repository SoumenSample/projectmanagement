import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const session = await requireAuth();

  if (session.user.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "employee") {
    redirect("/dashboard/employee");
  }

  if (session.user.role === "vendor") {
    redirect("/dashboard/vendor");
  }

  redirect("/dashboard/client");
}
