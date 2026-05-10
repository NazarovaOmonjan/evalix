from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, Contest, ContestParticipant, Question,
    Submission, Score, LeaderboardEntry
)


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password2", "role", "bio"]
        read_only_fields = ["id"]
        extra_kwargs = {"email": {"required": True}}

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        # Prevent self-registration as admin
        if data.get("role") == User.Role.ADMIN:
            raise serializers.ValidationError({"role": "Cannot self-register as admin."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        refresh = RefreshToken.for_user(user)
        return {
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


# ─── User ─────────────────────────────────────────────────────────────────────

class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "bio", "created_at"]
        read_only_fields = ["id", "role", "created_at"]


class UserAdminSerializer(serializers.ModelSerializer):
    """Full user details for admin use."""
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "bio", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


# ─── Contest ──────────────────────────────────────────────────────────────────

class ContestSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Contest
        fields = [
            "id", "title", "description", "created_by",
            "start_time", "end_time", "status",
            "participant_count", "is_enrolled", "created_at"
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.participants.filter(id=request.user.id).exists()
        return False


class ContestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contest
        fields = ["id", "title", "description", "start_time", "end_time", "status"]
        read_only_fields = ["id"]

    def validate(self, data):
        if data.get("end_time") and data.get("start_time"):
            if data["end_time"] <= data["start_time"]:
                raise serializers.ValidationError("end_time must be after start_time.")
        return data

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


# ─── Question ─────────────────────────────────────────────────────────────────

class QuestionSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id", "contest", "title", "description", "difficulty",
            "max_score", "time_limit_seconds", "order",
            "created_by", "submission_count", "created_at"
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


# ─── Submission ───────────────────────────────────────────────────────────────

class SubmissionSerializer(serializers.ModelSerializer):
    student = UserPublicSerializer(read_only=True)
    score_detail = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id", "question", "student", "content", "language",
            "status", "submitted_at", "updated_at", "score_detail"
        ]
        read_only_fields = ["id", "student", "status", "submitted_at", "updated_at", "score_detail"]

    def get_score_detail(self, obj):
        if hasattr(obj, "score"):
            return ScoreReadSerializer(obj.score).data
        return None

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        submission = super().create(validated_data)
        # Ensure student is enrolled in the contest
        contest = submission.question.contest
        ContestParticipant.objects.get_or_create(contest=contest, user=submission.student)
        return submission

    def validate_question(self, question):
        request = self.context.get("request")
        if question.contest.status != "active":
            raise serializers.ValidationError("Submissions only allowed during active contests.")
        # One submission per question per student
        if request and Submission.objects.filter(
            question=question, student=request.user
        ).exclude(status=Submission.Status.REJECTED).exists():
            raise serializers.ValidationError("You already have a submission for this question.")
        return question


# ─── Score ────────────────────────────────────────────────────────────────────

class ScoreReadSerializer(serializers.ModelSerializer):
    judge = UserPublicSerializer(read_only=True)

    class Meta:
        model = Score
        fields = ["id", "judge", "points", "feedback", "scored_at", "updated_at"]


class ScoreWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ["id", "submission", "points", "feedback"]
        read_only_fields = ["id"]

    def validate(self, data):
        submission = data.get("submission") or (self.instance.submission if self.instance else None)
        if submission and data.get("points") is not None:
            if data["points"] > submission.question.max_score:
                raise serializers.ValidationError(
                    {"points": f"Points cannot exceed max score of {submission.question.max_score}."}
                )
        return data

    def create(self, validated_data):
        validated_data["judge"] = self.context["request"].user
        score = super().create(validated_data)
        # Update submission status
        submission = score.submission
        submission.status = Submission.Status.ACCEPTED
        submission.save(update_fields=["status"])
        # Refresh leaderboard
        self._update_leaderboard(submission)
        return score

    def update(self, instance, validated_data):
        score = super().update(instance, validated_data)
        self._update_leaderboard(score.submission)
        return score

    def _update_leaderboard(self, submission):
        from django.db.models import Sum, Max
        contest = submission.question.contest
        student = submission.student

        agg = Submission.objects.filter(
            student=student,
            question__contest=contest,
            score__isnull=False,
        ).aggregate(
            total=Sum("score__points"),
            last_sub=Max("submitted_at"),
            solved=Sum(
                __import__("django.db.models", fromlist=["Case", "When", "IntegerField"]).Case(
                    __import__("django.db.models", fromlist=["When"]).When(
                        score__points__gt=0, then=1
                    ),
                    default=0,
                    output_field=__import__("django.db.models", fromlist=["IntegerField"]).IntegerField(),
                )
            )
        )

        entry, _ = LeaderboardEntry.objects.get_or_create(contest=contest, user=student)
        entry.total_score = agg["total"] or 0
        entry.questions_solved = agg["solved"] or 0
        entry.last_submission_at = agg["last_sub"]
        entry.save()

        # Recompute ranks
        entries = LeaderboardEntry.objects.filter(contest=contest).order_by("-total_score", "last_submission_at")
        for rank, e in enumerate(entries, start=1):
            LeaderboardEntry.objects.filter(pk=e.pk).update(rank=rank)


# ─── Leaderboard ──────────────────────────────────────────────────────────────

class LeaderboardSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = ["rank", "user", "total_score", "questions_solved", "last_submission_at"]
