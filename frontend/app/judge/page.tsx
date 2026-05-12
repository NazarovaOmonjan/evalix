"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Scale,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  FileCode,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { judgeApi, submissionApi, scoreApi, Submission } from "@/lib/api"
import { toast } from "sonner"
import type { ApiError } from "@/lib/api"

export default function JudgePanelPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [scoringId, setScoringId] = useState<number | null>(null)
  const [points, setPoints] = useState("")
  const [feedback, setFeedback] = useState("")
  const [scoreLoading, setScoreLoading] = useState(false)
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user && (user.role === "judge" || user.role === "admin")) {
      loadSubmissions()
    }
  }, [user, authLoading])

  // Only judge or admin can access
  if (!authLoading && (!user || (user.role !== "judge" && user.role !== "admin"))) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Access denied. Judge or Admin only.</p>
        </main>
        <Footer />
      </div>
    )
  }

  const loadSubmissions = async () => {
    try {
      const data = await judgeApi.dashboard()
      setSubmissions(data.submissions)
    } catch {
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleScore = async (submissionId: number) => {
    if (!points) {
      toast.error("Please enter points.")
      return
    }
    setScoreLoading(true)
    try {
      await scoreApi.create({
        submission: submissionId,
        points: Number(points),
        feedback,
      })
      toast.success("Submission scored successfully!")
      setScoringId(null)
      setPoints("")
      setFeedback("")
      loadSubmissions()
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || "Failed to score submission.")
    } finally {
      setScoreLoading(false)
    }
  }

  const handleMarkReview = async (submissionId: number) => {
    try {
      await submissionApi.updateStatus(submissionId, "under_review")
      toast.info("Submission marked as under review.")
      loadSubmissions()
    } catch {
      toast.error("Failed to update status.")
    }
  }

  const pending = submissions.filter(s => s.status === "pending")
  const underReview = submissions.filter(s => s.status === "under_review")
  const scored = submissions.filter(s => s.status === "accepted" || s.status === "rejected" || s.status === "partial")

  const statCards = [
    { label: t("judge.status.pending"), value: String(pending.length), icon: Clock, color: "text-warning" },
    { label: t("judge.status.accepted"), value: String(scored.filter(s => s.status === "accepted").length), icon: CheckCircle2, color: "text-success" },
    { label: t("judge.status.rejected"), value: String(scored.filter(s => s.status === "rejected").length), icon: XCircle, color: "text-destructive" },
    { label: t("judge.review"), value: String(underReview.length), icon: Eye, color: "text-info" },
  ]

  const SubmissionItem = ({ sub }: { sub: Submission }) => (
    <div className="p-4 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">
            {sub.student.username} — Question #{sub.question}
          </p>
          <p className="text-sm text-muted-foreground">
            {sub.language} • {new Date(sub.submitted_at).toLocaleString()}
          </p>
        </div>
        <Badge variant={
          sub.status === "accepted" ? "default" :
          sub.status === "under_review" ? "secondary" :
          sub.status === "rejected" ? "destructive" :
          "outline"
        }>
          {sub.status}
        </Badge>
      </div>
      
      {/* Code preview */}
      <pre className="p-3 rounded bg-secondary text-sm font-mono overflow-x-auto max-h-40 overflow-y-auto">
        {sub.content}
      </pre>

      {/* Score detail if exists */}
      {sub.score_detail && (
        <div className="p-3 rounded bg-primary/5 border border-primary/20 text-sm">
          <span className="font-medium">Score: {sub.score_detail.points}</span>
          {sub.score_detail.feedback && <p className="text-muted-foreground mt-1">{sub.score_detail.feedback}</p>}
        </div>
      )}

      {/* Actions */}
      {(sub.status === "pending" || sub.status === "under_review") && (
        <div className="flex gap-2">
          {sub.status === "pending" && (
            <Button size="sm" variant="outline" onClick={() => handleMarkReview(sub.id)}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Mark Review
            </Button>
          )}
          {scoringId === sub.id ? (
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Points"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-24 bg-input border-border"
                />
                <Textarea
                  placeholder="Feedback (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-input border-border min-h-[60px]"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleScore(sub.id)} disabled={scoreLoading}>
                  {scoreLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Submit Score
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setScoringId(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => setScoringId(sub.id)}>
              <Scale className="h-3.5 w-3.5 mr-1" /> Score
            </Button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Scale className="h-8 w-8 text-primary" />
                {t("judge.title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {t("judge.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2" onClick={loadSubmissions}>
                <RefreshCw className="h-4 w-4" />
                {t("common.retry")}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filter Bar */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                {t("judge.status.pending")} ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="in-review" className="gap-2">
                <Eye className="h-4 w-4" />
                {t("judge.review")} ({underReview.length})
              </TabsTrigger>
              <TabsTrigger value="judged" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t("judge.status.accepted")} ({scored.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pending.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={Clock}
                      title={t("judge.empty")}
                      description={t("judge.emptyDesc")}
                      className="py-12"
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pending.map(sub => <SubmissionItem key={sub.id} sub={sub} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="in-review">
              {underReview.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={Eye}
                      title={t("judge.empty")}
                      description={t("judge.emptyDesc")}
                      className="py-12"
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {underReview.map(sub => <SubmissionItem key={sub.id} sub={sub} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="judged">
              {scored.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={CheckCircle2}
                      title={t("judge.empty")}
                      description={t("judge.emptyDesc")}
                      className="py-12"
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {scored.map(sub => <SubmissionItem key={sub.id} sub={sub} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
