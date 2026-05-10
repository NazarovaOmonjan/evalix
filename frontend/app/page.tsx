"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  Code2, 
  Trophy, 
  Users, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  BookOpen
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function HomePage() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Zap,
      title: t("home.feature1.title"),
      description: t("home.feature1.desc")
    },
    {
      icon: BookOpen,
      title: t("home.feature2.title"),
      description: t("home.feature2.desc")
    },
    {
      icon: Trophy,
      title: t("home.feature3.title"),
      description: t("home.feature3.desc")
    },
    {
      icon: Users,
      title: t("home.feature4.title"),
      description: t("home.feature4.desc")
    }
  ]

  const stats = [
    { value: "0", label: t("home.stats.users") },
    { value: "0", label: t("home.stats.problems") },
    { value: "0", label: t("home.stats.submissions") },
    { value: "0", label: t("home.stats.contests") },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                {t("home.hero.title")}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
                {t("home.hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    {t("home.hero.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contests">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {t("home.hero.secondary")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                {t("home.features.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("home.features.subtitle")}
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-card border-y border-border">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-8 md:p-12 lg:p-16">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                    {t("home.cta.title")}
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    {t("home.cta.subtitle")}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[t("home.cta.button")].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto">{t("home.cta.button")}</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">{t("nav.signIn")}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
