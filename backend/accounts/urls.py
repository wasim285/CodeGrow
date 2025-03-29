from django.urls import path
from . import views
from .views import LessonAssistantView

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.EnhancedLoginView.as_view(), name='login'),  # Use EnhancedLoginView instead of LoginView
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # User dashboard and learning endpoints
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('lessons/', views.LessonListView.as_view(), name='lessons'),
    path('lessons/all/', views.AllLessonsView.as_view(), name='all-lessons'),
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    path('lessons/<int:lesson_id>/complete/', views.complete_lesson, name='complete-lesson'),
    path('lessons/<int:lesson_id>/check-completion/', views.check_lesson_completion, name='check-lesson-completion'),
    path('study-sessions/', views.StudySessionListCreateView.as_view(), name='study-sessions'),
    path('study-sessions/<int:pk>/', views.StudySessionDetailView.as_view(), name='study-session-detail'),
    path('run-code/', views.RunCodeView.as_view(), name='run-code'),
    path('lesson-assistant/', views.LessonAssistantView.as_view(), name='lesson-assistant'),
    
    # Admin endpoints
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/activate/', views.AdminUserActivateView.as_view(), name='admin-user-activate'),
    path('admin/pathways/', views.AdminPathwayListView.as_view(), name='admin-pathways'),
    path('admin/pathways/<int:pk>/', views.AdminPathwayDetailView.as_view(), name='admin-pathway-detail'),
    path('admin/lessons/', views.AdminLessonListView.as_view(), name='admin-lessons'),
    path('admin/lessons/<int:pk>/', views.AdminLessonDetailView.as_view(), name='admin-lesson-detail'),
    path('admin/activity-log/', views.AdminActivityLogView.as_view(), name='admin-activity-log'),
    
    # Utils
    path('create-superuser/', views.CreateSuperUserView.as_view(), name='create-superuser'),
]
