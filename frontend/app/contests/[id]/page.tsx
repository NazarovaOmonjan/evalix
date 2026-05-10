"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  ArrowLeft,
  Users,
  FileCode,
  Trophy,
  Calendar,
  Timer,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { contestApi, questionApi, submissionApi, Contest, Question, Submission, LeaderboardEntry } from "@/lib/api"
import { toast } from "sonner"
import { useState, useEffect } from "react"

export default function ContestDetailPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const params = useParams()
  const contestId = Number(params.id)

  const [contest, setContest] = useState<Contest | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contestId) return
    loadData()
  }, [contestId])

  const loadData = async () => {
    try {
      const [contestData, questionsData] = await Promise.all([
        contestApi.get(contestId),
        questionApi.list({ contest: contestId }),
      ])
      setContest(contestData)
      setQuestions(questionsData.results)

      // Load submissions and leaderboard in parallel
      const [subsData, lbData] = await Promise.all([
        submissionApi.list({ contest: contestId }).catch(() => ({ results: [] })),
        contestApi.leaderboard(contestId).catch(() => []),
      ])
      setSubmissions(subsData.results)
      setLeaderboard(lbData)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    try {
      await contestApi.enroll(contestId)
      toast.success("Enrolled successfully!")
      loadData()
    } catch {
      toast.error("Failed to enroll.")
    }
  }

  if (loading) {
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

  if (!contest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Contest not found</p>
        </main>
        <Footer />
      </div>
    )
  }

  const duration = Math.round((new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime()) / 60000)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/contests" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {/* Contest Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary">ID: {contest.id}</Badge>
                <Badge variant={contest.status === "active" ? "default" : "outline"}>
                  {contest.status}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">{contest.title}</h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                {contest.description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {user && !contest.is_enrolled && contest.status !== "ended" && (
                <Button className="gap-2" onClick={handleEnroll}>
                  <Trophy className="h-4 w-4" />
                  {t("contests.register")}
                </Button>
              )}
              {contest.is_enrolled && (
                <Badge variant="outline" className="text-primary border-primary px-4 py-2">Enrolled</Badge>
              )}
              {contest.is_enrolled && contest.status === "active" && (
                <Link href={`/contests/${contest.id}/submit`}>
                  <Button variant="outline" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    {t("contest.submitSolution")}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Contest Info Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contests.starts")}</p>
                    <p className="font-semibold text-foreground">{new Date(contest.start_time).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contests.duration")}</p>
                    <p className="font-semibold text-foreground">{duration} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contest.problems")}</p>
                    <p className="font-semibold text-foreground">{questions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contests.participants")}</p>
                    <p className="font-semibold text-foreground">{contest.participant_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contest Content Tabs */}
          <Tabs defaultValue="problems" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="problems" className="gap-2">
                <FileCode className="h-4 w-4" />
                {t("contest.problems")}
              </TabsTrigger>
              <TabsTrigger value="submissions" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t("contest.submissions")}
              </TabsTrigger>
              <TabsTrigger value="standings" className="gap-2">
                <Trophy className="h-4 w-4" />
                {t("contest.standings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="problems">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("contest.problems")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <EmptyState
                      icon={FileCode}
                      title={t("contests.empty")}
                      description={t("contests.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-mono text-muted-foreground">{String.fromCharCode(65 + idx)}</span>
                            <div>
                              <p className="font-medium text-foreground">{q.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                                <span className="text-xs text-muted-foreground">{q.max_score} pts</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">{q.submission_count} submissions</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("contest.submissions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <EmptyState
                      icon={FileCode}
                      title={t("dashboard.recent.empty")}
                      description={t("dashboard.recent.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-foreground">Question #{sub.question}</p>
                            <p className="text-sm text-muted-foreground">{sub.language} • {new Date(sub.submitted_at).toLocaleString()}</p>
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
            </TabsContent>

            <TabsContent value="standings">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("contest.standings")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      title={t("contest.standings.empty")}
                      description={t("contest.standings.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <div key={entry.user.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-muted-foreground w-8">#{entry.rank}</span>
                            <span className="font-medium text-foreground">{entry.user.username}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{entry.total_score} pts</p>
                            <p className="text-xs text-muted-foreground">{entry.questions_solved} solved</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
