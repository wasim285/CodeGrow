from django.urls import path
from . import views
from .views import CodeFeedbackView

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("lessons/", views.LessonListView.as_view(), name="lesson-list"),
    path("lessons/<int:pk>/", views.LessonDetailView.as_view(), name="lesson-detail"),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("study-sessions/", views.StudySessionListCreateView.as_view(), name="study-sessions"),
    path("study-sessions/<int:pk>/", views.StudySessionDetailView.as_view(), name="study-session-detail"),
    path("run-code/", views.RunCodeView.as_view(), name="run-code"),
    path("all-lessons/", views.all_lessons, name="all-lessons"),
    path("recommended-lessons/", views.AllLessonsView.as_view(), name="recommended-lessons"),
    path("complete_lesson/", views.complete_lesson, name="complete_lesson"),
    path("complete-lesson/<int:lesson_id>/", views.complete_lesson, name="complete-lesson"),
    path("check-lesson-completion/<int:lesson_id>/", views.check_lesson_completion, name="check-lesson-completion"),
    path("ai-feedback/", CodeFeedbackView.as_view(), name="ai-feedback"),
]
