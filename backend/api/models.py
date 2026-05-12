from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        JUDGE = "judge", "Judge"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_student(self):
        return self.role == self.Role.STUDENT

    def is_judge(self):
        return self.role == self.Role.JUDGE

    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.role})"


class Contest(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ENDED = "ended", "Ended"

    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_contests"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    participants = models.ManyToManyField(User, through="ContestParticipant", related_name="contests")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ContestParticipant(models.Model):
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("contest", "user")

    def __str__(self):
        return f"{self.user.username} in {self.contest.title}"


class Question(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    contest = models.ForeignKey(Contest, on_delete=models.CASCADE, related_name="questions")
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    max_score = models.PositiveIntegerField(default=100)
    time_limit_seconds = models.PositiveIntegerField(default=300)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_questions"
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.title} ({self.contest.title})"


class Submission(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        PARTIAL = "partial", "Partial Credit"

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    content = models.TextField()
    language = models.CharField(max_length=50, default="text")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Submission by {self.student.username} for {self.question.title}"


class Score(models.Model):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="score")
    judge = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="scored_submissions")
    points = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    feedback = models.TextField(blank=True)
    scored_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Score {self.points} for {self.submission}"


class LeaderboardEntry(models.Model):
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE, related_name="leaderboard")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leaderboard_entries")
    total_score = models.PositiveIntegerField(default=0)
    questions_solved = models.PositiveIntegerField(default=0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    last_submission_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("contest", "user")
        ordering = ["-total_score", "last_submission_at"]

    def __str__(self):
        return f"{self.user.username} - {self.contest.title} - Score: {self.total_score}"


class SiteSettings(models.Model):
    """Singleton model for site-wide settings editable by admin."""
    site_name = models.CharField(max_length=100, default="Evalix")
    about_text = models.TextField(blank=True, default="")
    terms_text = models.TextField(blank=True, default="")
    privacy_text = models.TextField(blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=50, blank=True, default="")
    contact_address = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return self.site_name

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
