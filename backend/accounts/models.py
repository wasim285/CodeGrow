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
    expected_output = models.TextField(blank=True, null=True)
    solution = models.TextField(blank=True, null=True)  # New field to store the answer

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
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)

    def __str__(self):
        return f"Progress for {self.user.username}"

    def calculate_level(self):
        """Calculate level based on XP using a simple formula"""
        if self.xp < 50:
            return 1
        elif self.xp < 150:
            return 2
        elif self.xp < 300:
            return 3
        elif self.xp < 500:
            return 4
        elif self.xp < 750:
            return 5
        elif self.xp < 1050:
            return 6
        elif self.xp < 1400:
            return 7
        elif self.xp < 1800:
            return 8
        elif self.xp < 2250:
            return 9
        else:
            # For levels 10+, each level requires 500 more XP
            return 10 + ((self.xp - 2250) // 500)

    def get_level_progress(self):
        """Get XP progress within current level"""
        level_thresholds = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250]
        
        current_level = self.calculate_level()
        
        if current_level <= 9:
            level_start_xp = level_thresholds[current_level - 1]
            level_end_xp = level_thresholds[current_level]
        else:
            # For levels 10+
            level_start_xp = 2250 + ((current_level - 10) * 500)
            level_end_xp = 2250 + ((current_level - 9) * 500)
        
        xp_in_level = self.xp - level_start_xp
        xp_needed = level_end_xp - level_start_xp
        
        return {
            'xp_in_level': xp_in_level,
            'xp_needed': xp_needed,
            'next_level_xp': level_end_xp
        }

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

    def add_xp(self, amount, create_activity=True):
        """Add XP and handle level-ups with activity tracking"""
        old_level = self.level
        self.xp += amount
        new_level = self.calculate_level()
        
        # Check for level up
        if new_level > old_level:
            self.level = new_level
            # Create level up activity
            UserActivity.create_activity(
                user=self.user,
                activity_type='level_up',
                title=f"Level Up! 🎉",
                description=f"Reached Level {new_level}",
                xp_earned=0,
                level_achieved=new_level
            )
        
        self.save()
        
        # Only create XP earned activity if explicitly requested
        # This prevents duplicates when XP is already tracked in main activities
        if create_activity and amount >= 10 and amount > 0:
            UserActivity.create_activity(
                user=self.user,
                activity_type='xp_earned',
                title=f"Earned {amount} XP",
                description=f"Total XP: {self.xp}",
                xp_earned=amount
            )
        
        return new_level > old_level  # Return True if leveled up

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

class QuizQuestion(models.Model):
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="questions",
        blank=True,
        null=True,  # allow null for global quizzes
        help_text="Leave blank for global quiz questions"
    )
    question = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    CORRECT_CHOICES = [('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')]
    correct_option = models.CharField(max_length=1, choices=CORRECT_CHOICES)
    explanation = models.TextField(blank=True, help_text="Shown after user submits")
    order = models.PositiveIntegerField(default=1)  # <-- Add this line

    class Meta:
        ordering = ['order']  # <-- Default ordering by this field
        unique_together = ("lesson", "question")

    def __str__(self):
        if self.lesson:
            return f"{self.lesson.title} – {self.question[:40]}..."
        return f"Global – {self.question[:40]}..."

class QuizAttempt(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    quiz_type = models.CharField(max_length=50)  # "general" or "lesson_{id}"
    best_score = models.PositiveIntegerField(default=0)  # Best score out of total questions
    total_questions = models.PositiveIntegerField(default=5)
    max_xp_earned = models.PositiveIntegerField(default=0)  # Max XP they've earned from this quiz
    learning_goal = models.CharField(max_length=100)
    difficulty_level = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'quiz_type', 'learning_goal', 'difficulty_level']

    def __str__(self):
        return f"{self.user.username} - {self.quiz_type} - Best: {self.best_score}/{self.total_questions}"

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('lesson_completed', 'Lesson Completed'),
        ('quiz_passed', 'Quiz Passed'),
        ('streak_milestone', 'Streak Milestone'),
        ('level_up', 'Level Up'),
        ('xp_earned', 'XP Earned'),
        ('account_created', 'Account Created'),
        ('study_session_added', 'Study Session Added'),  # Add this new type
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=25, choices=ACTIVITY_TYPES)  # Increased max_length
    title = models.CharField(max_length=200)
    description = models.TextField()
    xp_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional fields for additional context
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True)
    quiz_score = models.IntegerField(null=True, blank=True)
    streak_count = models.IntegerField(null=True, blank=True)
    level_achieved = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    @classmethod
    def create_activity(cls, user, activity_type, title, description, **kwargs):
        """Helper method to create activities with consistent formatting"""
        return cls.objects.create(
            user=user,
            activity_type=activity_type,
            title=title,
            description=description,
            **kwargs
        )