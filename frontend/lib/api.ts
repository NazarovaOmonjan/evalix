const API_BASE = "/api";

// ─── Token Management ────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ─── Refresh Logic ───────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Core Fetch Wrapper ──────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token once
  if (res.status === 401 && token) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw { status: 401, detail: "Session expired" } as ApiError;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error: ApiError = {
      status: res.status,
      detail: body.detail || body.non_field_errors?.[0] || "Request failed",
      errors: body,
    };
    throw error;
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: "student" | "judge" | "admin";
  bio: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  access: string;
  refresh: string;
}

export const authApi = {
  register(data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    role?: string;
  }) {
    return apiFetch<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: { username: string; password: string }) {
    return apiFetch<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout() {
    const refresh = getRefreshToken();
    return apiFetch("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  },

  me() {
    return apiFetch<UserProfile>("/auth/me/");
  },

  updateProfile(data: Partial<Pick<UserProfile, "username" | "email" | "bio">>) {
    return apiFetch<UserProfile>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ─── Contest API ─────────────────────────────────────────────────────────────

export interface Contest {
  id: number;
  title: string;
  description: string;
  created_by: { id: number; username: string; role: string } | null;
  start_time: string;
  end_time: string;
  status: "draft" | "active" | "ended";
  participant_count: number;
  is_enrolled: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const contestApi = {
  list(params?: { page?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Contest>>(`/contests/${qs ? `?${qs}` : ""}`);
  },

  get(id: number) {
    return apiFetch<Contest>(`/contests/${id}/`);
  },

  create(data: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    status?: string;
  }) {
    return apiFetch<Contest>("/contests/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<Contest>) {
    return apiFetch<Contest>(`/contests/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: number) {
    return apiFetch(`/contests/${id}/`, { method: "DELETE" });
  },

  enroll(id: number) {
    return apiFetch<{ detail: string }>(`/contests/${id}/enroll/`, {
      method: "POST",
    });
  },

  leaderboard(id: number) {
    return apiFetch<LeaderboardEntry[]>(`/contests/${id}/leaderboard/`);
  },

  myResults(id: number) {
    return apiFetch<Submission[]>(`/contests/${id}/my_results/`);
  },
};

// ─── Question API ────────────────────────────────────────────────────────────

export interface Question {
  id: number;
  contest: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  max_score: number;
  time_limit_seconds: number;
  order: number;
  created_by: { id: number; username: string; role: string } | null;
  submission_count: number;
  created_at: string;
}

export const questionApi = {
  list(params?: { contest?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.contest) query.set("contest", String(params.contest));
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Question>>(`/questions/${qs ? `?${qs}` : ""}`);
  },

  get(id: number) {
    return apiFetch<Question>(`/questions/${id}/`);
  },

  create(data: {
    contest: number;
    title: string;
    description: string;
    difficulty?: string;
    max_score?: number;
    time_limit_seconds?: number;
    order?: number;
  }) {
    return apiFetch<Question>("/questions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<Question>) {
    return apiFetch<Question>(`/questions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: number) {
    return apiFetch(`/questions/${id}/`, { method: "DELETE" });
  },
};

// ─── Submission API ──────────────────────────────────────────────────────────

export interface Submission {
  id: number;
  question: number;
  student: { id: number; username: string; role: string };
  content: string;
  language: string;
  status: "pending" | "under_review" | "accepted" | "rejected" | "partial";
  submitted_at: string;
  updated_at: string;
  score_detail: ScoreDetail | null;
}

export interface ScoreDetail {
  id: number;
  judge: { id: number; username: string; role: string };
  points: number;
  feedback: string;
  scored_at: string;
  updated_at: string;
}

export const submissionApi = {
  list(params?: { contest?: number; question?: number; status?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.contest) query.set("contest", String(params.contest));
    if (params?.question) query.set("question", String(params.question));
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return apiFetch<PaginatedResponse<Submission>>(`/submissions/${qs ? `?${qs}` : ""}`);
  },

  get(id: number) {
    return apiFetch<Submission>(`/submissions/${id}/`);
  },

  create(data: { question: number; content: string; language: string }) {
    return apiFetch<Submission>("/submissions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: number, status: string) {
    return apiFetch<Submission>(`/submissions/${id}/update_status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// ─── Score API ───────────────────────────────────────────────────────────────

export const scoreApi = {
  create(data: { submission: number; points: number; feedback?: string }) {
    return apiFetch<ScoreDetail>("/scores/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: { points?: number; feedback?: string }) {
    return apiFetch<ScoreDetail>(`/scores/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ─── Judge API ───────────────────────────────────────────────────────────────

export interface JudgeDashboard {
  pending_count: number;
  submissions: Submission[];
}

export const judgeApi = {
  dashboard(contestId?: number) {
    const query = contestId ? `?contest=${contestId}` : "";
    return apiFetch<JudgeDashboard>(`/judge/dashboard/${query}`);
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string;
  is_active: boolean;
  created_at: string;
}

export const adminApi = {
  listUsers(page?: number) {
    const query = page ? `?page=${page}` : "";
    return apiFetch<PaginatedResponse<AdminUser>>(`/admin/users/${query}`);
  },

  getUser(id: number) {
    return apiFetch<AdminUser>(`/admin/users/${id}/`);
  },

  updateUser(id: number, data: Partial<AdminUser>) {
    return apiFetch<AdminUser>(`/admin/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteUser(id: number) {
    return apiFetch(`/admin/users/${id}/`, { method: "DELETE" });
  },

  promoteUser(id: number, role: string) {
    return apiFetch<AdminUser>(`/admin/users/${id}/promote/`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user: { id: number; username: string; role: string };
  total_score: number;
  questions_solved: number;
  last_submission_at: string | null;
}

// ─── Site Settings ───────────────────────────────────────────────────────────

export interface SiteSettings {
  site_name: string;
  about_text: string;
  terms_text: string;
  privacy_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  updated_at: string;
}

export const settingsApi = {
  get() {
    return apiFetch<SiteSettings>("/settings/");
  },

  update(data: Partial<SiteSettings>) {
    return apiFetch<SiteSettings>("/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
