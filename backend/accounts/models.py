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
    content = models.TextField(blank=True, null=True)
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
                        "content": "<h3>What is Python?</h3><p>Python is a beginner-friendly programming language.</p>",
                        "order": 1,
                        "code_snippet": "print('Hello, Python!')",
                    },
                    {
                        "title": "Variables & Data Types",
                        "description": "Learn about variables and data types.",
                        "content": "<h3>Understanding Variables</h3><p>Variables store data in Python.</p>",
                        "order": 2,
                        "code_snippet": "age = 25\nname = 'John'",
                    },
                ],
                "Intermediate": [
                    {
                        "title": "Functions & Loops",
                        "description": "Master functions and loops.",
                        "content": "<h3>Understanding Functions</h3><p>Functions help you write reusable code.</p>",
                        "order": 3,
                        "code_snippet": "def greet():\n    print('Hello!')\ngreet()",
                    },
                    {
                        "title": "Data Structures",
                        "description": "Learn about Lists, Tuples, and Dictionaries.",
                        "content": "<h3>Data Structures</h3><p>Python provides different ways to store and manage data.</p>",
                        "order": 4,
                        "code_snippet": "students = {'Alice': 90, 'Bob': 85}",
                    },
                ],
                "Advanced": [
                    {
                        "title": "Object-Oriented Programming (OOP)",
                        "description": "Understand classes and objects in Python.",
                        "content": "<h3>What is OOP?</h3><p>OOP is a programming paradigm that uses objects and classes.</p>",
                        "order": 5,
                        "code_snippet": "class Car:\n    def __init__(self, brand):\n        self.brand = brand\n\nmy_car = Car('Toyota')",
                    },
                    {
                        "title": "File Handling",
                        "description": "Learn how to read and write files in Python.",
                        "content": "<h3>Working with Files</h3><p>Python allows reading and writing files using open().</p>",
                        "order": 6,
                        "code_snippet": "with open('data.txt', 'w') as f:\n    f.write('Hello, World!')",
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
                    "content": lesson_data["content"],
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


class StudySession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    learning_goal = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Study Session for {self.user.username} on {self.lesson.title}"


@receiver(post_save, sender=CustomUser)
def assign_lessons_on_signup(sender, instance, created, **kwargs):
    if created:
        from .models import UserProgress
        UserProgress.objects.get_or_create(user=instance)

    if instance.learning_goal and instance.difficulty_level:
        from .models import Lesson
        Lesson.create_default_lessons(instance)
