"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Phone, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { settingsApi, SiteSettings } from "@/lib/api"

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingsApi.get()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-8">
            <Mail className="h-8 w-8 text-primary" />
            Contact Us
          </h1>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {settings?.contact_email && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{settings.contact_email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {settings?.contact_phone && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{settings.contact_phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {settings?.contact_address && (
                <Card className="bg-card border-border md:col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-foreground">{settings.contact_address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!settings?.contact_email && !settings?.contact_phone && !settings?.contact_address && (
                <Card className="bg-card border-border md:col-span-2">
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-muted-foreground">No contact information available yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
