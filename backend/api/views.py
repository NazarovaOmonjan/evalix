from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import Contest, ContestParticipant, Question, Submission, Score, LeaderboardEntry
from .permissions import (
    IsAdmin, IsJudge, IsAdminOrJudge, IsStudent,
    IsAdminOrReadOnly, IsOwnerOrAdminOrJudge, IsScoreOwnerOrAdmin
)
from .serializers import (
    RegisterSerializer, LoginSerializer,
    UserProfileSerializer, UserAdminSerializer,
    ContestSerializer, ContestWriteSerializer,
    QuestionSerializer,
    SubmissionSerializer,
    ScoreReadSerializer, ScoreWriteSerializer,
    LeaderboardSerializer,
)

User = get_user_model()


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — public"""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserProfileSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — public"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
            return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — authenticated user's profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Admin: User Management ───────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — list all users (admin only)"""
    queryset = User.objects.all().order_by("id")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/admin/users/<id>/ — manage any user (admin only)"""
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]


class AdminPromoteUserView(APIView):
    """POST /api/admin/users/<id>/promote/ — change a user's role"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get("role")
        if role not in [r[0] for r in User.Role.choices]:
            return Response(
                {"detail": f"Invalid role. Choose from: {[r[0] for r in User.Role.choices]}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.role = role
        user.save(update_fields=["role"])
        return Response(UserAdminSerializer(user).data)


# ─── Contest ──────────────────────────────────────────────────────────────────

class ContestViewSet(viewsets.ModelViewSet):
    """
    list/retrieve — any authenticated user
    create/update/delete — admin only
    """
    queryset = Contest.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ContestWriteSerializer
        return ContestSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsStudent])
    def enroll(self, request, pk=None):
        """POST /api/contests/<id>/enroll/ — student enrolls in a contest"""
        contest = self.get_object()
        if contest.status == Contest.Status.ENDED:
            return Response({"detail": "Contest has ended."}, status=status.HTTP_400_BAD_REQUEST)
        _, created = ContestParticipant.objects.get_or_create(contest=contest, user=request.user)
        if not created:
            return Response({"detail": "Already enrolled."}, status=status.HTTP_200_OK)
        return Response({"detail": "Enrolled successfully."}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def leaderboard(self, request, pk=None):
        """GET /api/contests/<id>/leaderboard/"""
        contest = self.get_object()
        entries = LeaderboardEntry.objects.filter(contest=contest).select_related("user").order_by("rank")
        return Response(LeaderboardSerializer(entries, many=True).data)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def my_results(self, request, pk=None):
        """GET /api/contests/<id>/my_results/ — student sees their own scores"""
        contest = self.get_object()
        submissions = Submission.objects.filter(
            student=request.user,
            question__contest=contest,
        ).select_related("question", "score")
        return Response(SubmissionSerializer(submissions, many=True, context={"request": request}).data)


# ─── Question ─────────────────────────────────────────────────────────────────

class QuestionViewSet(viewsets.ModelViewSet):
    """
    list/retrieve — any authenticated user (for active contests)
    create/update/delete — admin only
    """
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Question.objects.select_related("contest", "created_by")
        contest_id = self.request.query_params.get("contest")
        if contest_id:
            qs = qs.filter(contest_id=contest_id)
        # Students only see questions in active contests
        user = self.request.user
        if user.is_student():
            qs = qs.filter(contest__status=Contest.Status.ACTIVE)
        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]


# ─── Submission ───────────────────────────────────────────────────────────────

class SubmissionViewSet(viewsets.ModelViewSet):
    """
    create — student only
    list/retrieve — student sees own; judge/admin see all
    update/delete — admin only
    """
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.select_related("student", "question", "score")
        if user.is_student():
            return qs.filter(student=user)
        # Judges and admins see all; filter by contest/question if provided
        contest_id = self.request.query_params.get("contest")
        question_id = self.request.query_params.get("question")
        status_filter = self.request.query_params.get("status")
        if contest_id:
            qs = qs.filter(question__contest_id=contest_id)
        if question_id:
            qs = qs.filter(question_id=question_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_permissions(self):
        if self.action == "create":
            return [IsStudent()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {"request": self.request}

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["patch"], permission_classes=[IsAdminOrJudge])
    def update_status(self, request, pk=None):
        """PATCH /api/submissions/<id>/update_status/ — judge marks submission under_review"""
        submission = self.get_object()
        new_status = request.data.get("status")
        allowed = [Submission.Status.UNDER_REVIEW, Submission.Status.PENDING]
        if new_status not in allowed:
            return Response(
                {"detail": f"Judges can only set status to: {[s for s in allowed]}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        submission.status = new_status
        submission.save(update_fields=["status"])
        return Response(SubmissionSerializer(submission, context={"request": request}).data)


# ─── Judge: Score ─────────────────────────────────────────────────────────────

class ScoreViewSet(viewsets.ModelViewSet):
    """
    create/update — judge or admin
    retrieve/list — judge or admin
    delete — admin only
    """
    queryset = Score.objects.select_related("submission", "judge")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ScoreWriteSerializer
        return ScoreReadSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        if self.action in ["create", "update", "partial_update"]:
            return [IsAdminOrJudge()]
        return [IsAdminOrJudge()]

    def get_serializer_context(self):
        return {"request": self.request}

    def create(self, request, *args, **kwargs):
        submission_id = request.data.get("submission")
        if Score.objects.filter(submission_id=submission_id).exists():
            return Response(
                {"detail": "This submission has already been scored. Use PATCH to update."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


# ─── Judge Dashboard ──────────────────────────────────────────────────────────

class JudgeDashboardView(APIView):
    """GET /api/judge/dashboard/ — pending submissions for a judge"""
    permission_classes = [IsAdminOrJudge]

    def get(self, request):
        pending = Submission.objects.filter(
            status__in=[Submission.Status.PENDING, Submission.Status.UNDER_REVIEW]
        ).select_related("student", "question", "question__contest").order_by("submitted_at")

        contest_id = request.query_params.get("contest")
        if contest_id:
            pending = pending.filter(question__contest_id=contest_id)

        return Response(
            {
                "pending_count": pending.count(),
                "submissions": SubmissionSerializer(pending, many=True, context={"request": request}).data,
            }
        )
