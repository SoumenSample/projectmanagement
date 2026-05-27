import Link from "next/link"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  { title: "Kanban", href: "/dashboard/vendor/kanban", description: "Track work across columns and keep tasks moving." },
  { title: "Projects", href: "/dashboard/vendor/projects", description: "Review project timelines, progress, and updates." },
  { title: "Tickets", href: "/dashboard/vendor/tickets", description: "Open support requests and follow queue status." },
  { title: "Schedule", href: "/dashboard/vendor/schedule", description: "Check upcoming events and assigned calendar items." },
  { title: "Messages", href: "/dashboard/vendor/messages", description: "Chat with the team and keep conversations in one place." },
  { title: "Contracts", href: "/dashboard/vendor/contracts", description: "Review contracts issued for your partner account." },
  { title: "Payments", href: "/dashboard/vendor/payment", description: "Review payment records tied to your account." },
]

export const dynamic = "force-dynamic"

export default async function VendorDashboardPage() {
  await requireRole("vendor")

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-linear-to-br from-background to-muted/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Partner/Vendor Workspace</CardTitle>
          <CardDescription>
            A dedicated dashboard for vendor collaboration, project tracking, tickets, schedule updates, messages, and payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-border/70 bg-background/80 p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{section.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
