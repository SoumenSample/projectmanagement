import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard2 from "./dashboard2/page";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");

  return (
    <Dashboard2/>
    // <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Welcome, {session.user.name}</CardTitle>
    //       <CardDescription>Admin control panel for users, leads, clients, and billing.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <p className="text-sm text-muted-foreground">Signed in as {session.user.email}</p>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Project Timeline</CardTitle>
    //       <CardDescription>Plan projects, assign employees, and break work into task checkpoints.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <Link href="/dashboard/projects" className="text-sm font-medium underline-offset-4 hover:underline">
    //         Open Project Manager
    //       </Link>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Billing Studio</CardTitle>
    //       <CardDescription>Create bill and invoice templates for client accounts.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <Link href="/dashboard/admin/billing" className="text-sm font-medium underline-offset-4 hover:underline">
    //         Open Billing
    //       </Link>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Admin Control</CardTitle>
    //       <CardDescription>Create and manage client and employee accounts.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <Link href="/dashboard/admin/users" className="text-sm font-medium underline-offset-4 hover:underline">
    //         Open User Management
    //       </Link>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Access Model</CardTitle>
    //       <CardDescription>No public signup is enabled in this system.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <p className="text-sm text-muted-foreground">
    //         All accounts are provisioned by admin to keep role assignments controlled.
    //       </p>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Leads</CardTitle>
    //       <CardDescription>View quick enquiries and add leads manually.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <Link href="/dashboard/admin/leads" className="text-sm font-medium underline-offset-4 hover:underline">
    //         Open Leads
    //       </Link>
    //     </CardContent>
    //   </Card>

    //   <Card>
    //     <CardHeader>
    //       <CardTitle>Clients</CardTitle>
    //       <CardDescription>Manage clients, convert leads to clients, and track validity periods.</CardDescription>
    //     </CardHeader>
    //     <CardContent>
    //       <Link href="/dashboard/admin/clients" className="text-sm font-medium underline-offset-4 hover:underline">
    //         Open Clients
    //       </Link>
    //     </CardContent>
    //   </Card>
    // </div>

  );
}
