"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Code2, Github, Mail, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { toast } from "sonner"
import type { ApiError } from "@/lib/api"

export default function RegisterPage() {
  const { t } = useLanguage()
  const { register, user } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [role, setRole] = useState("student")
  const [loading, setLoading] = useState(false)

  if (user) {
    router.replace("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !email.trim() || !password || !password2) {
      toast.error("Please fill in all fields.")
      return
    }

    if (password !== password2) {
      toast.error("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      await register({ username, email, password, password2, role })
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.errors && typeof apiErr.errors === "object") {
        const messages = Object.entries(apiErr.errors)
          .filter(([key]) => key !== "detail" && key !== "status")
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
        toast.error(messages.join("; ") || apiErr.detail || "Registration failed.")
      } else {
        toast.error(apiErr.detail || "Registration failed.")
      }
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
          <CardTitle className="text-2xl text-foreground">{t("auth.register.title")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("auth.register.subtitle")}
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
          
          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">{t("auth.register.username")}</Label>
              <Input 
                id="username" 
                placeholder={t("auth.register.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">{t("auth.register.email")}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t("auth.register.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">{t("auth.register.password")}</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder={t("auth.register.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">{t("auth.register.confirm")}</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder={t("auth.register.confirm")}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="bg-input border-border"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("auth.register.submit")}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.register.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
