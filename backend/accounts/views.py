from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.decorators import api_view, permission_classes
from django.db.models.signals import post_save
from django.dispatch import receiver
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProgressSerializer, 
    LessonSerializer, ProfileSerializer, StudySessionSerializer
)
from .models import CustomUser, UserProgress, Lesson, StudySession
import subprocess
import sys
from django.http import JsonResponse
from django.views import View
from django.conf import settings
import os
import requests
from dotenv import load_dotenv

load_dotenv()  # Load environment variables


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Validate password requirements
                password = serializer.validated_data.get('password')
                if len(password) < 8:
                    return Response(
                        {"password": ["Password must be at least 8 characters long."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check for at least one uppercase, one lowercase, and one number
                if not any(c.isupper() for c in password):
                    return Response(
                        {"password": ["Password must contain at least one uppercase letter."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if not any(c.islower() for c in password):
                    return Response(
                        {"password": ["Password must contain at least one lowercase letter."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if not any(c.isdigit() for c in password):
                    return Response(
                        {"password": ["Password must contain at least one number."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create user if all validations pass
                user = serializer.save()
                token, _ = Token.objects.get_or_create(user=user)
                
                return Response({
                    "token": token.key,
                    "message": "User registered successfully!"
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    "error": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle validation errors
        errors = {}
        for field, error_list in serializer.errors.items():
            if field == 'username' and 'unique' in str(error_list[0]).lower():
                errors[field] = ["This username is already taken."]
            elif field == 'email' and 'unique' in str(error_list[0]).lower():
                errors[field] = ["This email is already registered."]
            else:
                errors[field] = error_list

        return Response(errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
                "learning_goal": user.learning_goal,
                "difficulty_level": user.difficulty_level,
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user  

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if "learning_goal" in request.data or "difficulty_level" in request.data:
                user.refresh_from_db()
                Lesson.create_default_lessons(user)
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_lessons(request):
    lessons = Lesson.objects.all().order_by("order")
    serializer = LessonSerializer(lessons, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_lesson(request, lesson_id):
    user = request.user

    try:
        lesson = Lesson.objects.get(id=lesson_id)
        progress, created = UserProgress.objects.get_or_create(user=user)

        if lesson in progress.completed_lessons.all():
            return Response({
                "message": "Lesson already completed.",
                "lessons_completed": progress.lessons_completed,
                "streak": progress.streak,
            }, status=status.HTTP_200_OK)

        progress.completed_lessons.add(lesson)
        progress.lessons_completed = progress.completed_lessons.count()

        from datetime import date, timedelta
        today = date.today()

        if progress.last_active == today - timedelta(days=1):
            progress.streak += 1
        elif progress.last_active != today:
            progress.streak = 1

        progress.last_active = today
        progress.save()

        return Response({
            "message": "Lesson marked as completed.",
            "lessons_completed": progress.lessons_completed,
            "streak": progress.streak,
            "progress": UserProgressSerializer(progress).data
        }, status=status.HTTP_200_OK)

    except Lesson.DoesNotExist:
        return Response({"error": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_lesson_completion(request, lesson_id):
    user = request.user
    try:
        progress, _ = UserProgress.objects.get_or_create(user=user)
        lesson_completed = progress.completed_lessons.filter(id=lesson_id).exists()
        return Response({"lesson_completed": lesson_completed}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LessonListView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.learning_goal or not user.difficulty_level:
            return Lesson.objects.none()

        lessons = Lesson.objects.filter(
            learning_goal=user.learning_goal.strip(),
            difficulty_level=user.difficulty_level.strip()
        ).order_by("order")

        return lessons


class LessonDetailView(generics.RetrieveAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lesson = self.get_object()
        return Response({
            "title": lesson.title,
            "description": lesson.description,
            "step1_content": lesson.step1_content,
            "step2_content": lesson.step2_content,
            "step3_challenge": lesson.step3_challenge,
            "code_snippet": lesson.code_snippet,
        }, status=status.HTTP_200_OK)


class LessonListView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.learning_goal or not user.difficulty_level:
            return Lesson.objects.none()

        return Lesson.objects.filter(
            learning_goal=user.learning_goal.strip(),
            difficulty_level=user.difficulty_level.strip()
        ).order_by("order")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        lessons_data = [
            {
                "title": lesson.title,
                "description": lesson.description,
                "step1_content": lesson.step1_content,
                "step2_content": lesson.step2_content,
                "step3_challenge": lesson.step3_challenge,
                "code_snippet": lesson.code_snippet,
            }
            for lesson in queryset
        ]
        return Response(lessons_data, status=status.HTTP_200_OK)


class AllLessonsView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lesson.objects.all().order_by("order")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        lessons_data = [
            {
                "title": lesson.title,
                "description": lesson.description,
                "step1_content": lesson.step1_content,
                "step2_content": lesson.step2_content,
                "step3_challenge": lesson.step3_challenge,
                "code_snippet": lesson.code_snippet,
            }
            for lesson in queryset
        ]
        return Response(lessons_data, status=status.HTTP_200_OK)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        progress, _ = UserProgress.objects.get_or_create(user=user)

        available_lessons = Lesson.objects.filter(
            learning_goal=user.learning_goal,
            difficulty_level=user.difficulty_level
        ).order_by("order")

        current_lesson = available_lessons.first()
        study_sessions = StudySession.objects.filter(user=user)

        recommended_lessons = available_lessons.exclude(id__in=progress.completed_lessons.all())[:3]

        return Response({
            "current_lesson": LessonSerializer(current_lesson).data if current_lesson else None,
            "recommended_lessons": LessonSerializer(recommended_lessons, many=True).data,
            "study_sessions": StudySessionSerializer(study_sessions, many=True).data,
            "progress": UserProgressSerializer(progress).data,
        })


class StudySessionListCreateView(generics.ListCreateAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 


class StudySessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        study_session = self.get_object()
        study_session.delete()
        return Response({"message": "Study session removed successfully!"}, status=status.HTTP_204_NO_CONTENT)


class RunCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip()
        lesson_id = request.data.get("lesson_id")

        if not code or not lesson_id:
            return Response({"error": "Missing code or lesson_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True, text=True, timeout=5
            )

            output = result.stdout if result.stdout else result.stderr

            return JsonResponse({
                "output": output.strip(),
                "status_code": result.returncode
            }, status=status.HTTP_200_OK)

        except subprocess.TimeoutExpired:
            return Response({"error": "Execution timeout exceeded."}, status=status.HTTP_408_REQUEST_TIMEOUT)
        except Exception as e:
            return Response({"error": f"Execution failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@receiver(post_save, sender=CustomUser)
def assign_lessons_on_signup(sender, instance, created, **kwargs):
    if created or (instance.learning_goal and instance.difficulty_level):
        Lesson.create_default_lessons(instance)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.auth.delete()
            return Response({"message": "Logged out successfully!"}, status=status.HTTP_200_OK)
        except:
            return Response({"error": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST)


class CreateSuperUserView(View):
    def get(self, request, *args, **kwargs):
        User = get_user_model()
        
        username = "admin"
        email = "admin@example.com"
        password = "AdminSecurePass123"

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            return JsonResponse({"message": "Superuser created successfully!"}, status=201)
        else:
            return JsonResponse({"message": "Superuser already exists."}, status=200)


class CodeFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip()

        if not code:
            return Response({"error": "No code provided."}, status=status.HTTP_400_BAD_REQUEST)

        HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
        API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder"

        headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
        payload = {"inputs": f"Review this Python code and suggest improvements:\n{code}"}

        try:
            response = requests.post(API_URL, headers=headers, json=payload)
            feedback = response.json()

            if "error" in feedback:
                return Response({"error": "AI feedback failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({"feedback": feedback}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)