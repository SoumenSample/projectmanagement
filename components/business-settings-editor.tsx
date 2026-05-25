"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LocateFixed } from "lucide-react"

type BusinessSettings = {
  businessName: string
  logoUrl: string
  gstin: string
  phone: string
  email: string
  website: string
  address: string
  latitude: number | null
  longitude: number | null
  tagline: string
}

type BusinessSettingsFormData = {
  businessName: string
  logoUrl: string
  gstin: string
  phone: string
  email: string
  website: string
  address: string
  latitude: string
  longitude: string
  tagline: string
}

type BusinessSettingsEditorProps = {
  settings: BusinessSettings
  canEdit: boolean
}

export function BusinessSettingsEditor({ settings, canEdit }: BusinessSettingsEditorProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<BusinessSettingsFormData>({
    ...settings,
    latitude: settings.latitude === null || settings.latitude === undefined ? "" : String(settings.latitude),
    longitude: settings.longitude === null || settings.longitude === undefined ? "" : String(settings.longitude),
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleChange = (field: keyof BusinessSettingsFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !canEdit) {
      return
    }

    setUploading(true)
    setError("")
    setMessage("")

    try {
      const formDataPayload = new FormData()
      formDataPayload.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataPayload,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload logo.")
      }

      handleChange("logoUrl", payload.url)
      setMessage("Logo uploaded successfully.")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to upload logo.")
    } finally {
      event.target.value = ""
      setUploading(false)
    }
  }

  const handleFetchCurrentLocation = () => {
    if (!canEdit) {
      return
    }

    if (!navigator.geolocation) {
      setError("Location access is not supported in this browser.")
      return
    }

    setFetchingLocation(true)
    setError("")
    setMessage("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleChange("latitude", position.coords.latitude.toFixed(6))
        handleChange("longitude", position.coords.longitude.toFixed(6))
        setMessage("Current location fetched successfully.")
        setFetchingLocation(false)
      },
      () => {
        setError("Unable to fetch your location. Please allow location access and try again.")
        setFetchingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
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
      const response = await fetch("/api/business-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save business settings.")
      }

      setMessage("Business settings updated.")
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save business settings.")
    } finally {
      setSaving(false)
    }
  }

  const logoFallback = formData.businessName?.trim()?.[0]?.toUpperCase() || "B"

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">Business Settings</CardTitle>
          <Badge variant={canEdit ? "default" : "secondary"} className="rounded-full">
            {canEdit ? "Admin editable" : "Read only"}
          </Badge>
        </div>
        <CardDescription>
          Set the business identity that appears in the sidebar, invoices, and other shared surfaces.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt={formData.businessName || "Business logo"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">{logoFallback}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Brand preview</p>
                  <p className="text-sm text-muted-foreground">This is how the sidebar branding will appear.</p>
                </div>
              </div>
              <div className="grid gap-2 sm:min-w-56">
                <Label htmlFor="business-logo">Logo</Label>
                <Input id="business-logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={!canEdit || uploading} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Location coordinates</p>
                <p className="text-sm text-muted-foreground">Fetch the current device location or enter coordinates manually.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleFetchCurrentLocation} disabled={!canEdit || fetchingLocation}>
                <LocateFixed className="mr-2 h-4 w-4" />
                {fetchingLocation ? "Fetching..." : "Fetch location"}
              </Button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="business-latitude">Latitude</Label>
                <Input
                  id="business-latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={formData.latitude}
                  onChange={(event) => handleChange("latitude", event.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business-longitude">Longitude</Label>
                <Input
                  id="business-longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={formData.longitude}
                  onChange={(event) => handleChange("longitude", event.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g. 77.2090"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="business-gstin">GSTIN</Label>
              <Input
                id="business-gstin"
                value={formData.gstin}
                onChange={(event) => handleChange("gstin", event.target.value)}
                disabled={!canEdit}
                placeholder="Enter GSTIN"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-website">Website</Label>
              <Input
                id="business-website"
                value={formData.website}
                onChange={(event) => handleChange("website", event.target.value)}
                disabled={!canEdit}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="business-tagline">Tagline</Label>
            <Input
              id="business-tagline"
              value={formData.tagline}
              onChange={(event) => handleChange("tagline", event.target.value)}
              disabled={!canEdit}
              placeholder="Short brand line or description"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="business-address">Address</Label>
            <Textarea
              id="business-address"
              value={formData.address}
              onChange={(event) => handleChange("address", event.target.value)}
              disabled={!canEdit}
              rows={5}
              placeholder="Enter the business address"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Saving..." : "Save business settings"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}