from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Lesson, UserProgress, StudySession, QuizQuestion

@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ("lesson", "user", "date", "start_time", "end_time")

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("username", "email", "learning_goal", "difficulty_level", "is_staff", "is_active")
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Personal Info", {"fields": ("learning_goal", "difficulty_level")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "learning_goal", "difficulty_level", "is_staff", "is_active"),
        }),
    )
    search_fields = ("username", "email")
    ordering = ("username",)

admin.site.register(CustomUser, CustomUserAdmin)

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "learning_goal", "difficulty_level", "order")
    search_fields = ("title", "learning_goal", "difficulty_level") 
    list_filter = ("learning_goal", "difficulty_level")
    ordering = ("learning_goal", "difficulty_level", "order")

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "streak", "lessons_completed", "last_active")

admin.site.register(QuizQuestion)
