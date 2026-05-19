"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AccountUser = {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  region?: string
  source?: string
  isActive?: boolean
}

type AccountEditorProps = {
  user: AccountUser
  canEdit: boolean
}

export function AccountEditor({ user, canEdit }: AccountEditorProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    region: user.region || "",
    source: user.source || "",
    isActive: user.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canEdit) {
      return
    }

    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          region: formData.region,
          source: formData.source,
          isActive: formData.isActive,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update account details.")
      }

      setMessage("Account details updated.")
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update account details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">Account Details</CardTitle>
          <Badge variant={canEdit ? "default" : "secondary"} className="rounded-full">
            {canEdit ? "Admin editable" : "Read only"}
          </Badge>
        </div>
        <CardDescription>
          {canEdit
            ? "Update your profile information. Changes are saved through the admin user API."
            : "This profile can be viewed by everyone, but only admins can change details."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              value={formData.name}
              onChange={(event) => handleChange("name", event.target.value)}
              disabled={!canEdit}
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={!canEdit}
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-phone">Phone</Label>
              <Input
                id="account-phone"
                value={formData.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                disabled={!canEdit}
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="account-region">Region</Label>
              <Input
                id="account-region"
                value={formData.region}
                onChange={(event) => handleChange("region", event.target.value)}
                disabled={!canEdit}
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-source">Source</Label>
              <Input
                id="account-source"
                value={formData.source}
                onChange={(event) => handleChange("source", event.target.value)}
                disabled={!canEdit}
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-status">Status</Label>
            <Input
              id="account-status"
              value={formData.isActive ? "Active" : "Inactive"}
              onChange={() => handleChange("isActive", !formData.isActive)}
              disabled={!canEdit}
              readOnly
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}