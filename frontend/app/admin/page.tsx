"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Settings,
  Plus,
  Trophy,
  FileCode,
  Users,
  BarChart3,
  Shield,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { contestApi, questionApi, adminApi, Contest, Question, AdminUser } from "@/lib/api"
import { toast } from "sonner"
import type { ApiError } from "@/lib/api"

export default function AdminPage() {
  const [contestTitle, setContestTitle] = useState("")
  const [contestDescription, setContestDescription] = useState("")
  const [contestStartTime, setContestStartTime] = useState("")
  const [contestEndTime, setContestEndTime] = useState("")
  const [contestStatus, setContestStatus] = useState("draft")

  const [problemTitle, setProblemTitle] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [problemDifficulty, setProblemDifficulty] = useState("medium")
  const [problemPoints, setProblemPoints] = useState("100")
  const [problemContest, setProblemContest] = useState("")

  const [contests, setContests] = useState<Contest[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contestsData, usersData] = await Promise.all([
        contestApi.list().catch(() => ({ results: [] })),
        adminApi.listUsers().catch(() => ({ results: [] })),
      ])
      setContests(contestsData.results)
      setUsers(usersData.results)

      // Load questions for all contests
      if (contestsData.results.length > 0) {
        const qData = await questionApi.list().catch(() => ({ results: [] }))
        setQuestions(qData.results)
      }
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContest = async () => {
    if (!contestTitle || !contestStartTime || !contestEndTime) {
      toast.error("Please fill in title, start time, and end time.")
      return
    }
    try {
      await contestApi.create({
        title: contestTitle,
        description: contestDescription,
        start_time: new Date(contestStartTime).toISOString(),
        end_time: new Date(contestEndTime).toISOString(),
        status: contestStatus,
      })
      toast.success("Contest created successfully!")
      setContestTitle("")
      setContestDescription("")
      setContestStartTime("")
      setContestEndTime("")
      loadData()
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || "Failed to create contest.")
    }
  }

  const handleCreateProblem = async () => {
    if (!problemTitle || !problemContest) {
      toast.error("Please fill in title and select a contest.")
      return
    }
    try {
      await questionApi.create({
        contest: Number(problemContest),
        title: problemTitle,
        description: problemDescription,
        difficulty: problemDifficulty,
        max_score: Number(problemPoints) || 100,
      })
      toast.success("Problem created successfully!")
      setProblemTitle("")
      setProblemDescription("")
      loadData()
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || "Failed to create problem.")
    }
  }

  const handlePromoteUser = async (userId: number, role: string) => {
    try {
      await adminApi.promoteUser(userId, role)
      toast.success(`User role updated to ${role}`)
      loadData()
    } catch {
      toast.error("Failed to update user role.")
    }
  }

  const statCards = [
    { label: t("home.stats.users"), value: String(users.length), icon: Users, change: "" },
    { label: t("home.stats.contests"), value: String(contests.length), icon: Trophy, change: "" },
    { label: t("home.stats.problems"), value: String(questions.length), icon: FileCode, change: "" },
    { label: t("home.stats.submissions"), value: "—", icon: BarChart3, change: "" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                {t("admin.title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {t("admin.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </Badge>
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="contests" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="contests" className="gap-2">
                <Trophy className="h-4 w-4" />
                {t("admin.tabs.contests")}
              </TabsTrigger>
              <TabsTrigger value="problems" className="gap-2">
                <FileCode className="h-4 w-4" />
                {t("admin.tabs.problems")}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                {t("admin.tabs.users")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                {t("admin.tabs.settings")}
              </TabsTrigger>
            </TabsList>

            {/* Contests Tab */}
            <TabsContent value="contests" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-5 w-5" />
                    {t("admin.create")} {t("admin.tabs.contests")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("admin.contest.name")}</Label>
                      <Input
                        placeholder={t("admin.contest.name")}
                        value={contestTitle}
                        onChange={(e) => setContestTitle(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Status</Label>
                      <Select value={contestStatus} onValueChange={setContestStatus}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("admin.contest.description")}</Label>
                    <Textarea
                      placeholder={t("admin.contest.description")}
                      value={contestDescription}
                      onChange={(e) => setContestDescription(e.target.value)}
                      className="bg-input border-border min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("admin.contest.startTime")}</Label>
                      <Input
                        type="datetime-local"
                        value={contestStartTime}
                        onChange={(e) => setContestStartTime(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">End Time</Label>
                      <Input
                        type="datetime-local"
                        value={contestEndTime}
                        onChange={(e) => setContestEndTime(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  
                  <Button className="gap-2" onClick={handleCreateContest}>
                    <Plus className="h-4 w-4" />
                    {t("admin.create")}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Contests */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("admin.tabs.contests")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {contests.length === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      title={t("admin.empty")}
                      description={t("admin.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      {contests.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-foreground">{c.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(c.start_time).toLocaleDateString()} — {c.participant_count} participants
                            </p>
                          </div>
                          <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Problems Tab */}
            <TabsContent value="problems" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-5 w-5" />
                    {t("admin.create")} {t("admin.tabs.problems")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("admin.problem.title")}</Label>
                      <Input
                        placeholder={t("admin.problem.title")}
                        value={problemTitle}
                        onChange={(e) => setProblemTitle(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Contest</Label>
                      <Select value={problemContest} onValueChange={setProblemContest}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Select contest" />
                        </SelectTrigger>
                        <SelectContent>
                          {contests.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("admin.problem.description")}</Label>
                    <Textarea
                      placeholder={t("admin.problem.description")}
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      className="bg-input border-border min-h-[150px]"
                    />
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("admin.problem.difficulty")}</Label>
                      <Select value={problemDifficulty} onValueChange={setProblemDifficulty}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("admin.problem.points")}</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={problemPoints}
                        onChange={(e) => setProblemPoints(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  
                  <Button className="gap-2" onClick={handleCreateProblem}>
                    <Plus className="h-4 w-4" />
                    {t("admin.create")}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Problems */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("admin.tabs.problems")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <EmptyState
                      icon={FileCode}
                      title={t("admin.empty")}
                      description={t("admin.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      {questions.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-foreground">{q.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Contest #{q.contest} • {q.max_score} pts
                            </p>
                          </div>
                          <Badge variant="outline">{q.difficulty}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("admin.tabs.users")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title={t("admin.empty")}
                      description={t("admin.emptyDesc")}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-foreground">{u.username}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                            <Select
                              value={u.role}
                              onValueChange={(role) => handlePromoteUser(u.id, role)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="judge">Judge</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("admin.tabs.settings")}</CardTitle>
                  <CardDescription>{t("admin.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Platform Name</Label>
                    <Input defaultValue="Evalix" className="bg-input border-border" />
                  </div>
                  <Button disabled>{t("admin.save")}</Button>
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
