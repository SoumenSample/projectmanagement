// import Link from "next/link";
// import { requireAuth } from "@/lib/auth";
// import LogoutButton from "@/components/dashboard/LogoutButton";

// export default async function DashboardLayout({ children }) {
//   const session = await requireAuth();

//   return (
//     <section className="min-h-screen bg-black pt-28 text-cyan-100">
//       <div className="mx-auto w-full max-w-6xl px-4 pb-12">
//         <div className="mb-6 flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 md:flex-row md:items-center md:justify-between">
//           <div>
//             <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Secure Dashboard</p>
//             <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
//             <p className="text-sm text-cyan-100/70">Role: {session.user.role}</p>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <Link href="/dashboard" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//               Home
//             </Link>
//             <Link href="/dashboard/projects" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//               Projects
//             </Link>
//             <Link href="/dashboard/messages" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//               Messages
//             </Link>
//             <Link href="/dashboard/tickets" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//               Tickets
//             </Link>
//             <Link href="/dashboard/marketplace" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//               Marketplace
//             </Link>
//             {session.user.role === "admin" ? (
//               <Link href="/dashboard/admin/billing" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//                 Billing
//               </Link>
//             ) : null}
//             {session.user.role === "client" ? (
//               <Link href="/dashboard/client/billing" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//                 Billing
//               </Link>
//             ) : null}
//             {session.user.role === "admin" ? (
//               <>
//                 <Link href="/dashboard/admin/users" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//                   Manage Users
//                 </Link>
//                 <Link href="/dashboard/admin/leads" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//                   Leads
//                 </Link>
//                 <Link href="/dashboard/admin/clients" className="rounded-md border border-cyan-500/30 px-3 py-2 text-sm hover:bg-cyan-500/10">
//                   Clients
//                 </Link>
//               </>
//             ) : null}
//             <LogoutButton />
//           </div>
//         </div>

//         {children}
//       </div>
//     </section>
//   );
// }


import { connectToDatabase } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BusinessSettings from "@/lib/models/BusinessSettings";

export default async function DashboardLayout({ children }) {
  const session = await requireAuth();
  await connectToDatabase();

  const businessSettings = await BusinessSettings.findOne({ scope: "global" })
    .select("businessName logoUrl")
    .lean();

  const businessBrand = {
    businessName: businessSettings?.businessName || "Project Management",
    logoUrl: businessSettings?.logoUrl || "/logo2.png",
  };
  const roleLabel =
    typeof session.user.role === "string"
      ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
      : "User";
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const dashboardTitle = userEmail
    ? `${roleLabel} Dashboard - ${userName} (${userEmail})`
    : `${roleLabel} Dashboard - ${userName}`;

  return (
    <section className="min-h-">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar
          variant="inset"
          role={session.user.role}
          user={{
            name: session.user.name || "User",
            email: session.user.email || "",
            avatar: "",
          }}
          business={businessBrand}
        />
        <SidebarInset>
          <SiteHeader
            title={dashboardTitle}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </section>
  );
}
