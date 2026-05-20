import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BusinessSettingsEditor } from "@/components/business-settings-editor"
import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import BusinessSettings from "@/lib/models/BusinessSettings"
import { Building2, Globe, Phone, ShieldCheck } from "lucide-react"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const defaultSettings = {
  businessName: "Project Management",
  logoUrl: "",
  gstin: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
}

export default async function BusinessSettingsPage() {
  const session = await requireAuth()

  await connectToDatabase()

  const businessSettingsModel = BusinessSettings as any

  const settingsRecord = await businessSettingsModel.findOne({ scope: "global" })
    .select("businessName logoUrl gstin phone email website address tagline")
    .lean()

  if (!session?.user) {
    redirect("/login")
  }

  const sessionUser = session.user as { role?: string }
  const canEdit = sessionUser.role === "admin"
  const settings = {
    businessName: settingsRecord?.businessName || defaultSettings.businessName,
    logoUrl: settingsRecord?.logoUrl || defaultSettings.logoUrl,
    gstin: settingsRecord?.gstin || defaultSettings.gstin,
    phone: settingsRecord?.phone || defaultSettings.phone,
    email: settingsRecord?.email || defaultSettings.email,
    website: settingsRecord?.website || defaultSettings.website,
    address: settingsRecord?.address || defaultSettings.address,
    tagline: settingsRecord?.tagline || defaultSettings.tagline,
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.15))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={canEdit ? "default" : "secondary"} className="rounded-full px-3 py-1">
                  {canEdit ? "Admin editable" : "Read only"}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                  Business profile
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{settings.businessName}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Configure your company identity, tax information, and contact details.
                  These values drive the sidebar branding and future business documents.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/8 p-4 dark:bg-muted/40 sm:grid-cols-2 lg:min-w-90">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Business</p>
                  <p className="text-sm font-medium text-foreground">{settings.businessName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 p-3 dark:bg-muted/40">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">GSTIN</p>
                  <p className="text-sm font-medium text-foreground">{settings.gstin || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 p-3 dark:bg-muted/40">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{settings.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/10 p-3 dark:bg-muted/40">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Website</p>
                  <p className="truncate text-sm font-medium text-foreground">{settings.website || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Business Snapshot</CardTitle>
              <CardDescription>Quick summary of the stored company details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{settings.email || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Tagline</span>
                <span className="font-medium">{settings.tagline || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Address</span>
                <span className="max-w-[18rem] text-right font-medium">{settings.address || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Logo</span>
                <span className="font-medium">{settings.logoUrl ? "Uploaded" : "Not set"}</span>
              </div>
            </CardContent>
          </Card>

          <BusinessSettingsEditor settings={settings} canEdit={canEdit} />
        </div>
      </div>
    </div>
  )
}