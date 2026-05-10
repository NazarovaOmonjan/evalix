from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    AdminUserListView, AdminUserDetailView, AdminPromoteUserView,
    ContestViewSet,
    QuestionViewSet,
    SubmissionViewSet,
    ScoreViewSet,
    JudgeDashboardView,
)

router = DefaultRouter()
router.register(r"contests", ContestViewSet, basename="contest")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"submissions", SubmissionViewSet, basename="submission")
router.register(r"scores", ScoreViewSet, basename="score")

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/<int:pk>/promote/", AdminPromoteUserView.as_view(), name="admin-user-promote"),

    # ── Judge ─────────────────────────────────────────────────────────────────
    path("judge/dashboard/", JudgeDashboardView.as_view(), name="judge-dashboard"),

    # ── Resources (router) ────────────────────────────────────────────────────
    path("", include(router.urls)),
]
