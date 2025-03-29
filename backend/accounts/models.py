from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db.models import CASCADE
from datetime import timedelta, date

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)  # Make email required and unique
    LEARNING_GOALS = [
        ("School", "For School"),
        ("Portfolio", "Build a Portfolio"),
        ("Career Growth", "Career Growth"),
    ]

    DIFFICULTY_LEVELS = [
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
    ]

    learning_goal = models.CharField(
        max_length=50, choices=LEARNING_GOALS, blank=True, null=True
    )
    difficulty_level = models.CharField(
        max_length=50, choices=DIFFICULTY_LEVELS, blank=True, null=True
    )

    # Update related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    # Add USERNAME_FIELD and REQUIRED_FIELDS
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

class Lesson(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    step1_content = models.TextField(blank=True, null=True)
    step2_content = models.TextField(blank=True, null=True)
    step3_challenge = models.TextField(blank=True, null=True)
    difficulty_level = models.CharField(max_length=50, choices=CustomUser.DIFFICULTY_LEVELS)
    learning_goal = models.CharField(max_length=50, choices=CustomUser.LEARNING_GOALS)
    order = models.PositiveIntegerField()
    code_snippet = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("title", "learning_goal", "difficulty_level")

    def __str__(self):
        return f"{self.title} ({self.learning_goal} - {self.difficulty_level})"

    @classmethod
    def create_default_lessons(cls, user):
        if not user or not user.learning_goal or not user.difficulty_level:
            return

        default_lessons = {
            "School": {
                "Beginner": [
                    {
                        "title": "Introduction to Python",
                        "description": "Learn Python basics.",
                        "step1_content": "<h3>What is Python?</h3><p>Python is a beginner-friendly programming language.</p>",
                        "step2_content": "<h3>Basic Syntax</h3><p>Let's write a simple Python program.</p>",
                        "step3_challenge": "<h3>Mini Challenge</h3><p>Write a Python program that prints 'Hello, World!'.</p>",
                        "order": 1,
                        "code_snippet": "print('Hello, Python!')",
                    },
                    {
                        "title": "Variables & Data Types",
                        "description": "Learn about variables and data types.",
                        "step1_content": "<h3>Understanding Variables</h3><p>Variables store data in Python.</p>",
                        "step2_content": "<h3>Working with Variables</h3><p>Define a variable and assign a value.</p>",
                        "step3_challenge": "<h3>Mini Challenge</h3><p>Declare a variable 'name' and assign your name to it.</p>",
                        "order": 2,
                        "code_snippet": "age = 25\nname = 'John'",
                    },
                ],
            },
        }

        lessons = default_lessons.get(user.learning_goal, {}).get(user.difficulty_level, [])

        if not lessons:
            return

        for lesson_data in lessons:
            cls.objects.get_or_create(
                title=lesson_data["title"],
                learning_goal=user.learning_goal,
                difficulty_level=user.difficulty_level,
                defaults={
                    "description": lesson_data["description"],
                    "step1_content": lesson_data["step1_content"],
                    "step2_content": lesson_data["step2_content"],
                    "step3_challenge": lesson_data["step3_challenge"],
                    "order": lesson_data["order"],
                    "code_snippet": lesson_data["code_snippet"],
                },
            )


class UserProgress(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=CASCADE, related_name="progress")
    streak = models.PositiveIntegerField(default=0)
    lessons_completed = models.PositiveIntegerField(default=0)
    last_active = models.DateField(auto_now=True)
    completed_lessons = models.ManyToManyField(Lesson, blank=True)

    def __str__(self):
        return f"Progress for {self.user.username}"

    def mark_lesson_completed(self, lesson):
        if lesson not in self.completed_lessons.all():
            self.completed_lessons.add(lesson)
            self.lessons_completed += 1

            today = date.today()
            if self.last_active == today - timedelta(days=1):
                self.streak += 1
            elif self.last_active != today:
                self.streak = 1

            self.last_active = today
            self.save()

        return self.unlock_next_lesson(lesson)

    def unlock_next_lesson(self, lesson):
        next_lesson = Lesson.objects.filter(
            learning_goal=self.user.learning_goal,
            difficulty_level=self.user.difficulty_level,
            order__gt=lesson.order
        ).order_by("order").first()

        return next_lesson.id if next_lesson else None

    def get_completed_lessons(self):
        return self.completed_lessons.filter(
            learning_goal=self.user.learning_goal,
            difficulty_level=self.user.difficulty_level
        )


class StudySession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    learning_goal = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Study Session for {self.user.username} on {self.lesson.title}"

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)


@receiver(post_save, sender=CustomUser)
def assign_lessons_on_signup(sender, instance, created, **kwargs):
    if created:
        UserProgress.objects.get_or_create(user=instance)

    if instance.learning_goal and instance.difficulty_level:
        Lesson.create_default_lessons(instance)



class LessonFeedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Fields from first definition
    code_submitted = models.TextField(blank=True, null=True)
    ai_feedback = models.TextField(blank=True, null=True)
    
    # Fields from second definition
    code = models.TextField(blank=True, null=True)
    question = models.TextField(blank=True, null=True)
    expected_output = models.TextField(blank=True, null=True)
    actual_output = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        if self.lesson:
            return f"Feedback by {self.user.username} for {self.lesson.title} on {self.created_at.date()}"
        return f"Feedback for {self.user.username} on {self.created_at.strftime('%Y-%m-%d')}"