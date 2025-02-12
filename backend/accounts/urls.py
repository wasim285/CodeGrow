from django.urls import path
from . import views  

urlpatterns = [
    # ✅ User Authentication
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),

    # ✅ User Profile
    path("profile/", views.ProfileView.as_view(), name="profile"),

    # ✅ Lessons
    path("lessons/", views.LessonListView.as_view(), name="lesson-list"),
    path("lessons/<int:pk>/", views.LessonDetailView.as_view(), name="lesson-detail"),
    
    # ✅ Dashboard & Recommendations
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("recommended-lessons/", views.AllLessonsView.as_view(), name="recommended-lessons"),

    # ✅ Study Sessions
    path("study-sessions/", views.StudySessionListCreateView.as_view(), name="study-sessions"),
    path("study-sessions/<int:pk>/", views.StudySessionDetailView.as_view(), name="study-session-detail"),

    # ✅ Lesson Completion
    path("complete-lesson/<int:lesson_id>/", views.complete_lesson, name="complete-lesson"),
    path("check-lesson-completion/<int:lesson_id>/", views.check_lesson_completion, name="check-lesson-completion"),

    # ✅ Running Code
    path("run-code/", views.RunCodeView.as_view(), name="run-code"),
]
