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
    pathway_content = models.JSONField(blank=True, null=True)
    expected_output = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("title", "learning_goal", "difficulty_level")

    def __str__(self):
        return f"{self.title} ({self.learning_goal} - {self.difficulty_level})"
    
    def get_pathway_content(self, learning_goal="School"):
        if self.pathway_content and learning_goal in self.pathway_content:
            return self.pathway_content[learning_goal]
        return None

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
                        "expected_output": "Hello, Python!",
                        "pathway_content": {
                            "School": {
                                "step1_content": "<h3>What is Python?</h3><p>Python is a beginner-friendly programming language used in many schools to teach coding concepts.</p><p>It's known for its clear syntax and readability, making it perfect for beginners.</p>",
                                "step2_content": "<h3>Basic Syntax for School</h3><p>In your computer science class, you might start with simple programs like this:</p>",
                                "code_snippet": "# My first Python program\nprint('Hello, Python!')\n\n# This is a comment - the computer ignores this\n\n# Let's print a calculation\nprint(2 + 3)\n\n# Try changing the message or calculation above!"
                            },
                            "Portfolio": {
                                "step1_content": "<h3>Python for Your Portfolio</h3><p>Python is an excellent language for building portfolio projects that showcase your skills to potential employers.</p>",
                                "step2_content": "<h3>Portfolio-Ready Code</h3><p>Even a simple program can be structured professionally:</p>",
                                "code_snippet": "def main():\n    \"\"\"Entry point for our simple program.\"\"\"\n    print('Hello, Portfolio Project!')\n    print('This is the first step in building your coding portfolio.')\n    \n    # Try adding more functionality to this program!\n\nif __name__ == '__main__':\n    main()"
                            },
                            "Career Growth": {
                                "step1_content": "<h3>Python in Professional Settings</h3><p>Python is one of the most in-demand programming skills in the job market, used in data science, web development, automation and more.</p>",
                                "step2_content": "<h3>Professional Python Practices</h3><p>In professional environments, even simple programs follow best practices:</p>",
                                "code_snippet": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\nSimple demonstration module.\n\nThis module demonstrates basic Python syntax with professional formatting.\n\"\"\"\n\ndef greet(name: str) -> str:\n    \"\"\"Return a professional greeting message.\n    \n    Args:\n        name: The name to include in the greeting\n        \n    Returns:\n        A formatted greeting string\n    \"\"\"\n    return f\"Welcome to professional Python development, {name}!\"\n\n\nif __name__ == \"__main__\":\n    print(greet(\"Developer\"))"
                            }
                        }
                    },
                    {
                        "title": "Variables & Data Types",
                        "description": "Learn about variables and data types.",
                        "step1_content": "<h3>Understanding Variables</h3><p>Variables store data in Python.</p>",
                        "step2_content": "<h3>Working with Variables</h3><p>Define a variable and assign a value.</p>",
                        "step3_challenge": "<h3>Mini Challenge</h3><p>Declare a variable 'name' and assign your name to it.</p>",
                        "order": 2,
                        "code_snippet": "age = 25\nname = 'John'",
                        "expected_output": "John is 25 years old",
                        "pathway_content": {
                            "School": {
                                "step2_content": "<h3>Variables for School Projects</h3><p>Variables help you store and manipulate data in your programs. Here's how you might use them in a school assignment:</p>",
                                "code_snippet": "# School grade calculator\n\n# Store test scores in variables\ntest1 = 85\ntest2 = 90\ntest3 = 78\n\n# Calculate the average score\naverage = (test1 + test2 + test3) / 3\n\n# Output the results\nprint(f'Test scores: {test1}, {test2}, {test3}')\nprint(f'Average score: {average:.1f}')\n\n# Try changing the test scores to see how the average changes!"
                            },
                            "Portfolio": {
                                "step2_content": "<h3>Variables for Portfolio Projects</h3><p>For your portfolio, showcase practical applications of variables with user input:</p>",
                                "code_snippet": "# Simple budget calculator for your portfolio\n\n# Get user input (in a real project, add input validation)\nmonthly_income = float(input('Enter your monthly income: $'))\nrent = float(input('Enter your monthly rent/mortgage: $'))\nutilities = float(input('Enter your monthly utilities cost: $'))\n\n# Calculate remaining budget\ntotal_expenses = rent + utilities\nremaining_budget = monthly_income - total_expenses\n\n# Format and display results\nprint('\\nMonthly Budget Summary')\nprint(f'Income: ${monthly_income:.2f}')\nprint(f'Expenses: ${total_expenses:.2f}')\nprint(f'Remaining budget: ${remaining_budget:.2f}')\n\n# Calculate and show percentage of income spent\nspent_percentage = (total_expenses / monthly_income) * 100\nprint(f'You spend {spent_percentage:.1f}% of your income on housing and utilities.')"
                            },
                            "Career Growth": {
                                "step2_content": "<h3>Professional Variable Usage</h3><p>In professional code, you'll use more complex data structures and type annotations:</p>",
                                "code_snippet": "from typing import Dict, List, Union\nfrom datetime import datetime\n\n# Using type hints for better code maintenance\nProductData = Dict[str, Union[str, float, int, bool]]\n\n# Sample inventory management\ndef calculate_inventory_value(products: List[ProductData]) -> float:\n    \"\"\"Calculate the total value of inventory.\n    \n    Args:\n        products: List of product dictionaries with price and quantity\n        \n    Returns:\n        Total inventory value\n    \"\"\"\n    total_value = 0.0\n    \n    for product in products:\n        # Safe access with get() method and default values\n        price = product.get('price', 0.0)\n        quantity = product.get('quantity', 0)\n        total_value += price * quantity\n        \n    return total_value\n\n# Sample inventory data\ninventory = [\n    {'id': 'P001', 'name': 'Laptop', 'price': 1200.00, 'quantity': 5},\n    {'id': 'P002', 'name': 'Mouse', 'price': 25.50, 'quantity': 15},\n    {'id': 'P003', 'name': 'Keyboard', 'price': 85.99, 'quantity': 10}\n]\n\n# Calculate and display inventory value\ntotal = calculate_inventory_value(inventory)\nprint(f'Total inventory value: ${total:.2f}')\n\n# Add timestamp for reporting\ncurrent_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')\nprint(f'Report generated at: {current_time}')"
                            }
                        }
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
                    "pathway_content": lesson_data.get("pathway_content"),
                    "expected_output": lesson_data.get("expected_output"),
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