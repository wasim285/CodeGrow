from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db.models import CASCADE


class CustomUser(AbstractUser):
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

    def __str__(self):
        return self.username


class Lesson(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    step1_content = models.TextField(blank=True, null=True)  # Step 1: Introduction
    step2_content = models.TextField(blank=True, null=True)  # Step 2: Guided Code Example
    step3_challenge = models.TextField(blank=True, null=True)  # Step 3: Mini Challenge
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


from datetime import timedelta, date

class UserProgress(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=CASCADE, related_name="progress")
    streak = models.PositiveIntegerField(default=0)  # 🔥 Learning Streak
    lessons_completed = models.PositiveIntegerField(default=0)
    last_active = models.DateField(auto_now=True)
    completed_lessons = models.ManyToManyField(Lesson, blank=True)

    def __str__(self):
        return f"Progress for {self.user.username}"

    def mark_lesson_completed(self, lesson):
        """Marks a lesson as completed, unlocks the next lesson, and updates progress."""

        # ✅ Ensure the lesson isn't already marked as completed
        if lesson not in self.completed_lessons.all():
            self.completed_lessons.add(lesson)
            self.lessons_completed += 1

            # ✅ Update Learning Streak
            today = date.today()
            if self.last_active == today - timedelta(days=1):  # Was active yesterday
                self.streak += 1
            elif self.last_active != today:  # Missed a day
                self.streak = 1

            self.last_active = today
            self.save()

        return self.unlock_next_lesson(lesson)

    def unlock_next_lesson(self, lesson):
        """Finds and unlocks the next lesson if available."""
        next_lesson = Lesson.objects.filter(
            learning_goal=self.user.learning_goal,
            difficulty_level=self.user.difficulty_level,
            order__gt=lesson.order  # Get next lesson in sequence
        ).order_by("order").first()

        return next_lesson.id if next_lesson else None


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
        """Ensure lesson removal from study sessions correctly reflects in the UI"""
        print(f"🟢 Deleting Study Session: {self.id} for {self.user.username}")
        super().delete(*args, **kwargs)


@receiver(post_save, sender=CustomUser)
def assign_lessons_on_signup(sender, instance, created, **kwargs):
    if created:
        UserProgress.objects.get_or_create(user=instance)

    if instance.learning_goal and instance.difficulty_level:
        Lesson.create_default_lessons(instance)