"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  Trophy, 
  Search, 
  Calendar,
  Clock,
  Users,
  Filter,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { contestApi, Contest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function ContestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    loadContests()
  }, [])

  const loadContests = async () => {
    try {
      const data = await contestApi.list()
      setContests(data.results)
    } catch {
      // User might not be authenticated
      setContests([])
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (contestId: number) => {
    try {
      await contestApi.enroll(contestId)
      toast.success("Enrolled successfully!")
      loadContests()
    } catch {
      toast.error("Failed to enroll.")
    }
  }

  const now = new Date()
  const upcoming = contests.filter(c => new Date(c.start_time) > now)
  const ongoing = contests.filter(c => c.status === "active" || (new Date(c.start_time) <= now && new Date(c.end_time) > now))
  const past = contests.filter(c => c.status === "ended" || new Date(c.end_time) <= now)

  const filteredContests = (list: Contest[]) => {
    if (!searchQuery) return list
    return list.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const ContestCard = ({ contest }: { contest: Contest }) => (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/contests/${contest.id}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              {contest.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contest.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(contest.start_time).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {contest.participant_count}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={contest.status === "active" ? "default" : "secondary"}>
              {contest.status}
            </Badge>
            {user && !contest.is_enrolled && contest.status !== "ended" && (
              <Button size="sm" onClick={() => handleEnroll(contest.id)}>
                {t("contests.register")}
              </Button>
            )}
            {contest.is_enrolled && (
              <Badge variant="outline" className="text-primary border-primary">Enrolled</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderContestList = (list: Contest[], emptyIcon: typeof Calendar, emptyTitle: string) => {
    const filtered = filteredContests(list)
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={t("contests.empty")}
          description={t("contests.emptyDesc")}
        />
      )
    }
    return (
      <div className="space-y-4">
        {filtered.map(contest => <ContestCard key={contest.id} contest={contest} />)}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("contests.title")}</h1>
              <p className="mt-2 text-muted-foreground">
                {t("contests.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64 bg-input border-border"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {t("common.filter")}
              </Button>
            </div>
          </div>

          {/* Contest Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="upcoming" className="gap-2">
                <Calendar className="h-4 w-4" />
                {t("contests.tabs.upcoming")} ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="gap-2">
                <Clock className="h-4 w-4" />
                {t("contests.tabs.ongoing")} ({ongoing.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <Trophy className="h-4 w-4" />
                {t("contests.tabs.past")} ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5" />
                    {t("contests.tabs.upcoming")}
                  </CardTitle>
                  <CardDescription>
                    {t("contests.emptyDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderContestList(upcoming, Calendar, t("contests.empty"))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ongoing">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Clock className="h-5 w-5" />
                    {t("contests.tabs.ongoing")}
                  </CardTitle>
                  <CardDescription>
                    {t("contests.emptyDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderContestList(ongoing, Clock, t("contests.empty"))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="past">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Trophy className="h-5 w-5" />
                    {t("contests.tabs.past")}
                  </CardTitle>
                  <CardDescription>
                    {t("contests.emptyDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderContestList(past, Trophy, t("contests.empty"))}
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
