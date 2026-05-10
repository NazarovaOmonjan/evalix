"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft,
  FileCode,
  Upload,
  Play,
  Code2,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { questionApi, submissionApi, Question } from "@/lib/api"
import { toast } from "sonner"
import type { ApiError } from "@/lib/api"

const languages = [
  { value: "cpp", label: "C++ (GCC 11.2)" },
  { value: "python", label: "Python 3.10" },
  { value: "java", label: "Java 17" },
  { value: "javascript", label: "JavaScript (Node.js 18)" },
  { value: "typescript", label: "TypeScript 5.0" },
  { value: "go", label: "Go 1.20" },
  { value: "rust", label: "Rust 1.70" },
  { value: "csharp", label: "C# (.NET 7)" },
]

export default function SubmitPage() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("")
  const [selectedQuestion, setSelectedQuestion] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const { t } = useLanguage()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const contestId = Number(params.id)

  useEffect(() => {
    if (!contestId) return
    questionApi.list({ contest: contestId })
      .then(data => setQuestions(data.results))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [contestId])

  const handleSubmit = async () => {
    if (!selectedQuestion || !code || !language) {
      toast.error("Please fill in all fields.")
      return
    }

    setSubmitting(true)
    try {
      await submissionApi.create({
        question: Number(selectedQuestion),
        content: code,
        language,
      })
      toast.success("Submission sent successfully! It will be reviewed by a judge.")
      setSuccess(true)
      setCode("")
      setSelectedQuestion("")
      setLanguage("")
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || "Submission failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href={`/contests/${contestId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t("submit.title")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("contest.submitSolution")}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              <span>Submission sent successfully! It will be reviewed by a judge.</span>
            </div>
          )}

          {/* Submission Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileCode className="h-5 w-5" />
                {t("submit.title")}
              </CardTitle>
              <CardDescription>
                {t("contest.submitSolution")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Problem and Language Selection */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="problem" className="text-foreground">{t("submit.problem")}</Label>
                  <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={t("submit.problem")} />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((q, idx) => (
                        <SelectItem key={q.id} value={String(q.id)}>
                          {String.fromCharCode(65 + idx)} - {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-foreground">{t("submit.language")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={t("submit.language")} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Code Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code" className="text-foreground">{t("submit.code")}</Label>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" disabled>
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <Textarea
                  id="code"
                  placeholder={t("submit.placeholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-input border-border font-mono min-h-[400px] resize-y"
                />
              </div>

              {/* Info Alert */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t("contest.rules")}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>stdin / stdout</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="gap-2 flex-1" onClick={handleSubmit} disabled={submitting || !user}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {t("submit.button")}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => { setCode(""); setSuccess(false); setError(""); }}>
                  <Code2 className="h-4 w-4" />
                  {t("submit.reset")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
