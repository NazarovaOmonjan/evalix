from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Contest, ContestParticipant, Question, Submission, Score, LeaderboardEntry


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Evalix", {"fields": ("role", "bio")}),
    )


@admin.register(Contest)
class ContestAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "start_time", "end_time", "created_by"]
    list_filter = ["status"]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["title", "contest", "difficulty", "max_score", "order"]
    list_filter = ["difficulty", "contest"]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["student", "question", "status", "submitted_at"]
    list_filter = ["status"]


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ["submission", "judge", "points", "scored_at"]


admin.site.register(ContestParticipant)
admin.site.register(LeaderboardEntry)
