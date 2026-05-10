"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { authApi, setTokens, clearTokens, UserProfile, ApiError } from "./api"

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function setAuthCookie() {
  document.cookie = "evalix_logged_in=true; path=/; max-age=604800; SameSite=Lax"
}

function clearAuthCookie() {
  document.cookie = "evalix_logged_in=; path=/; max-age=0"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authApi.me()
      setUser(profile)
      setAuthCookie()
    } catch {
      setUser(null)
      clearTokens()
      clearAuthCookie()
    }
  }, [])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      clearAuthCookie()
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    setTokens(res.access, res.refresh)
    setUser(res.user)
    setAuthCookie()
  }

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    role?: string;
  }) => {
    const res = await authApi.register(data)
    setTokens(res.access, res.refresh)
    setUser(res.user)
    setAuthCookie()
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore errors on logout
    }
    clearTokens()
    clearAuthCookie()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
