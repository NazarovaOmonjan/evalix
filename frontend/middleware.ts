import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/judge", "/admin"]

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for access token in cookies or rely on client-side check
  // Since we use localStorage for tokens (client-side), we can't check here directly.
  // Instead, we'll use a lightweight cookie approach.
  const hasToken = request.cookies.get("evalix_logged_in")?.value === "true"

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/judge/:path*", "/admin/:path*", "/login", "/register"],
}
