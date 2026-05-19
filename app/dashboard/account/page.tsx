import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AccountEditor } from "@/components/account/account-editor"
import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { Mail, MapPin, ShieldCheck, UserRound } from "lucide-react"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await requireAuth()

  await connectToDatabase()

  const userModel = User as any
  const userEmail = session.user.email

  if (!userEmail) {
    redirect("/dashboard")
  }

  const userRecord = await userModel.findOne({ email: userEmail })
    .select("name email role phone region source isActive createdAt updatedAt")
    .lean()

  if (!userRecord) {
    redirect("/dashboard")
  }

  const canEdit = userRecord.role === "admin"
  const displayName = userRecord.name || session.user.name || "Account"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.15))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={canEdit ? "default" : "secondary"} className="rounded-full px-3 py-1">
                  {canEdit ? "Admin account" : "Read only account"}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                  {userRecord.role}
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{displayName}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Open your account details here. Everyone can view this page, but only admins can edit profile data.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/8 dark:bg-muted/40 p-4 sm:grid-cols-2 lg:min-w-90">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <UserRound className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 dark:bg-muted/40 p-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="truncate text-sm font-medium text-foreground">{userRecord.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 dark:bg-muted/40 p-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize text-foreground">{userRecord.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 dark:bg-muted/40 p-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Region</p>
                  <p className="text-sm font-medium text-foreground">{userRecord.region || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Snapshot</CardTitle>
              <CardDescription>Quick readout of the current account record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{userRecord.phone || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{userRecord.source || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${userRecord.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {userRecord.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>

          <AccountEditor
            user={{
              _id: String(userRecord._id),
              name: userRecord.name || "",
              email: userRecord.email || "",
              role: userRecord.role || "client",
              phone: userRecord.phone || "",
              region: userRecord.region || "",
              source: userRecord.source || "",
              isActive: Boolean(userRecord.isActive),
            }}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  )
}