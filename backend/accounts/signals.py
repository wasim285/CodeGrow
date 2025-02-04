from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Lesson, UserProgress

@receiver(post_save, sender=CustomUser)
def create_lessons_for_user(sender, instance, created, **kwargs):
    if not instance.learning_goal or not instance.difficulty_level:
        return  

    UserProgress.objects.get_or_create(user=instance)

    default_lessons = {
        "School": {
            "Beginner": [
                {"title": "Introduction to Python", "description": "Learn Python basics.", "order": 1},
                {"title": "Variables & Data Types", "description": "Understand variables and data types.", "order": 2},
                {"title": "Loops & Conditionals", "description": "Control program flow with loops and conditionals.", "order": 3}
            ],
            "Intermediate": [
                {"title": "Functions & Loops", "description": "Master functions and loops.", "order": 1},
                {"title": "Object-Oriented Programming", "description": "Understand classes and objects.", "order": 2},
            ],
            "Advanced": [
                {"title": "Data Structures & Algorithms", "description": "Deep dive into CS fundamentals.", "order": 1},
                {"title": "Advanced Python Concepts", "description": "Explore metaprogramming and decorators.", "order": 2},
            ]
        },
        "Portfolio": {
            "Beginner": [
                {"title": "Building Your First Project", "description": "Start your portfolio with a simple project.", "order": 1},
            ],
            "Intermediate": [
                {"title": "APIs & Web Scraping", "description": "Learn how to interact with APIs and scrape data.", "order": 1},
            ],
            "Advanced": [
                {"title": "Full-Stack Web Development", "description": "Build a full-stack web application.", "order": 1},
            ]
        },
        "Career Growth": {
            "Beginner": [
                {"title": "Introduction to Data Structures", "description": "Learn the basics of stacks and queues.", "order": 1},
            ],
            "Intermediate": [
                {"title": "Interview Preparation", "description": "Solve common coding interview problems.", "order": 1},
            ],
            "Advanced": [
                {"title": "System Design", "description": "Learn how to design scalable applications.", "order": 1},
            ]
        }
    }

    lessons_to_create = default_lessons.get(instance.learning_goal, {}).get(instance.difficulty_level, [])

    for lesson_data in lessons_to_create:
        if not Lesson.objects.filter(
            title=lesson_data["title"],
            learning_goal=instance.learning_goal,
            difficulty_level=instance.difficulty_level
        ).exists():
            Lesson.objects.create(
                title=lesson_data["title"],
                description=lesson_data["description"],
                difficulty_level=instance.difficulty_level,
                learning_goal=instance.learning_goal,
                order=lesson_data["order"],
            )
