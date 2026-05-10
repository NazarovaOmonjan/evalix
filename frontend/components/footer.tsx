"use client"

import Link from "next/link"
import { Code2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Evalix</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("home.hero.subtitle")}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("nav.contests")}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/contests" className="text-sm text-muted-foreground hover:text-foreground">{t("nav.contests")}</Link></li>
              <li><Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">{t("nav.results")}</Link></li>
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">{t("nav.dashboard")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footer.about")}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t("footer.about")}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t("footer.contact")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footer.terms")}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t("footer.privacy")}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Evalix. {t("footer.rights")}.
          </p>
        </div>
      </div>
    </footer>
  )
}
