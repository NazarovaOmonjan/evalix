"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Trophy,
  Search,
  Medal,
  Users,
  TrendingUp,
  Crown,
  Star,
  Award,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { contestApi, Contest, LeaderboardEntry } from "@/lib/api"

export default function ResultsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContest, setSelectedContest] = useState("")
  const [contests, setContests] = useState<Contest[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    loadContests()
  }, [])

  useEffect(() => {
    if (selectedContest) {
      loadLeaderboard(Number(selectedContest))
    }
  }, [selectedContest])

  const loadContests = async () => {
    try {
      const data = await contestApi.list()
      setContests(data.results)
      if (data.results.length > 0) {
        setSelectedContest(String(data.results[0].id))
      }
    } catch {
      setContests([])
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async (contestId: number) => {
    try {
      const data = await contestApi.leaderboard(contestId)
      setLeaderboard(data)
    } catch {
      setLeaderboard([])
    }
  }

  const topRanks = [
    { rank: 1, icon: Crown, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { rank: 2, icon: Medal, color: "text-gray-400", bgColor: "bg-gray-400/10" },
    { rank: 3, icon: Award, color: "text-amber-600", bgColor: "bg-amber-600/10" },
  ]

  const top3 = leaderboard.slice(0, 3)

  const filteredLeaderboard = searchQuery
    ? leaderboard.filter(e => e.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : leaderboard

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                {t("results.title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {t("results.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedContest} onValueChange={setSelectedContest}>
                <SelectTrigger className="w-48 bg-input border-border">
                  <SelectValue placeholder={t("nav.contests")} />
                </SelectTrigger>
                <SelectContent>
                  {contests.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {topRanks.map((rank, idx) => {
              const Icon = rank.icon
              const entry = top3[idx]
              return (
                <Card key={rank.rank} className={`bg-card border-border ${rank.rank === 1 ? 'md:order-2' : rank.rank === 2 ? 'md:order-1' : 'md:order-3'}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${rank.bgColor} mb-4`}>
                        <Icon className={`h-8 w-8 ${rank.color}`} />
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">#{rank.rank}</div>
                      <div className="text-lg font-semibold text-foreground">
                        {entry ? entry.user.username : "---"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {entry ? `${entry.total_score} pts` : `0 ${t("contest.standings.score")}`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Search Bar */}
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

          {/* Leaderboard Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t("results.tabs.global")}</CardTitle>
              <CardDescription>{t("results.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLeaderboard.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t("results.empty")}
                  description={t("results.emptyDesc")}
                  className="py-12"
                />
              ) : (
                <div className="space-y-2">
                  {filteredLeaderboard.map((entry) => (
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
