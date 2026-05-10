"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code2, Github, Mail, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useState, Suspense } from "react"
import { toast } from "sonner"
import type { ApiError } from "@/lib/api"

function LoginForm() {
  const { t } = useLanguage()
  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get("redirect") || "/dashboard"

  // Redirect if already logged in
  if (user) {
    router.replace(redirect)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields.")
      return
    }

    setLoading(true)
    try {
      await login(username, password)
      toast.success("Welcome back!")
      router.push(redirect)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Code2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">Evalix</span>
      </Link>
      
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground">{t("auth.login.title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("auth.login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full gap-2" disabled>
              <Github className="h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" className="w-full gap-2" disabled>
              <Mail className="h-4 w-4" />
              Google
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.login.or")}</span>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">{t("auth.login.email")}</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">{t("auth.login.password")}</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder={t("auth.login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("auth.login.submit")}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("auth.login.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
