"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Trophy, 
  Code2, 
  Clock, 
  TrendingUp, 
  FileCode, 
  Calendar,
  Target,
  Award,
  Loader2
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { contestApi, submissionApi, Contest, Submission } from "@/lib/api"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [contests, setContests] = useState<Contest[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    try {
      const [contestsData, subsData] = await Promise.all([
        contestApi.list().catch(() => ({ results: [] })),
        submissionApi.list().catch(() => ({ results: [] })),
      ])
      setContests(contestsData.results)
      setSubmissions(subsData.results)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) return null

  const acceptedCount = submissions.filter(s => s.status === "accepted").length
  const upcomingContests = contests.filter(c => new Date(c.start_time) > new Date())

  const statCards = [
    { label: t("dashboard.stats.solved"), value: String(acceptedCount), icon: Target },
    { label: t("dashboard.stats.rating"), value: "—", icon: TrendingUp },
    { label: t("dashboard.stats.rank"), value: "—", icon: Trophy },
    { label: t("dashboard.stats.submissions"), value: String(submissions.length), icon: FileCode },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("dashboard.welcome")}, {user.username}!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Submissions */}
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileCode className="h-5 w-5" />
                  {t("dashboard.recent.title")}
                </CardTitle>
                <CardDescription>{t("dashboard.recent.emptyDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <EmptyState
                    icon={FileCode}
                    title={t("dashboard.recent.empty")}
                    description={t("dashboard.recent.emptyDesc")}
                  >
                    <Link href="/contests">
                      <Button>{t("nav.contests")}</Button>
                    </Link>
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium text-foreground text-sm">Question #{sub.question}</p>
                          <p className="text-xs text-muted-foreground">{sub.language} • {new Date(sub.submitted_at).toLocaleString()}</p>
                        </div>
                        <Badge variant={
                          sub.status === "accepted" ? "default" :
                          sub.status === "rejected" ? "destructive" :
                          "secondary"
                        }>
                          {sub.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Contests */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  {t("dashboard.upcoming.title")}
                </CardTitle>
                <CardDescription>{t("dashboard.upcoming.emptyDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingContests.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={t("dashboard.upcoming.empty")}
                    description={t("dashboard.upcoming.emptyDesc")}
                    className="py-8"
                  >
                    <Link href="/contests">
                      <Button variant="outline" size="sm">{t("common.viewAll")}</Button>
                    </Link>
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {upcomingContests.slice(0, 3).map((contest) => (
                      <Link key={contest.id} href={`/contests/${contest.id}`}>
                        <div className="p-3 rounded-lg border border-border hover:bg-secondary transition-colors">
                          <p className="font-medium text-foreground text-sm">{contest.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(contest.start_time).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5" />
                {t("dashboard.quickActions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/contests">
                  <Button variant="outline" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    {t("dashboard.action.contests")}
                  </Button>
                </Link>
                <Link href="/contests">
                  <Button variant="outline" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    {t("dashboard.action.practice")}
                  </Button>
                </Link>
                <Link href="/results">
                  <Button variant="outline" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("dashboard.action.leaderboard")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
