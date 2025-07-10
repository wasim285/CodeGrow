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
from django.db import models
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProgressSerializer, 
    LessonSerializer, ProfileSerializer, StudySessionSerializer, LessonWithSolutionSerializer,
    QuizQuestionSerializer, QuizSubmitSerializer, UserActivitySerializer
)
from .models import CustomUser, UserProgress, Lesson, StudySession, QuizQuestion, QuizAttempt, UserActivity
import subprocess
import sys
from django.http import JsonResponse
from django.views import View
from django.conf import settings
import os
import requests
from dotenv import load_dotenv
import json
import random
import logging

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
                
                # Create welcome activity
                UserActivity.create_activity(
                    user=user,
                    activity_type='account_created',
                    title="Welcome to CodeGrow! 🎉",
                    description="Your coding journey begins now",
                    xp_earned=10
                )
                
                # Give initial XP
                progress, _ = UserProgress.objects.get_or_create(user=user)
                progress.add_xp(10)
                
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
        old_streak = progress.streak

        if progress.last_active == today - timedelta(days=1):
            progress.streak += 1
        elif progress.last_active != today:
            progress.streak = 1

        progress.last_active = today
        progress.save()

        # Create lesson completion activity
        UserActivity.create_activity(
            user=user,
            activity_type='lesson_completed',
            title="Lesson Completed! ✅",
            description=f"Completed: {lesson.title}",
            xp_earned=25,
            lesson=lesson
        )

        # Award XP for lesson completion  
        leveled_up = progress.add_xp(25, create_activity=False)  # Don't create separate XP activity

        # Check for streak milestones
        if progress.streak > old_streak and progress.streak % 5 == 0:
            streak_xp = progress.streak * 10
            UserActivity.create_activity(
                user=user,
                activity_type='streak_milestone',
                title=f"🔥 {progress.streak}-Day Streak!",
                description=f"Maintained {progress.streak} days of consistent learning",
                xp_earned=streak_xp,
                streak_count=progress.streak
            )
            progress.add_xp(streak_xp, create_activity=False)  # Don't create separate XP activity

        return Response({
            "message": "Lesson marked as completed.",
            "lessons_completed": progress.lessons_completed,
            "streak": progress.streak,
            "leveled_up": leveled_up,
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
            "title":            lesson.title,
            "description":      lesson.description,
            "step1_content":    lesson.step1_content,
            "step2_content":    lesson.step2_content,
            "step3_challenge":  lesson.step3_challenge,
            "code_snippet":     lesson.code_snippet,
            "expected_output":  lesson.expected_output,
            "solution":         lesson.solution,
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
        
        # Get recent activities
        recent_activities = UserActivity.objects.filter(user=user)[:5]

        return Response({
            "current_lesson": LessonSerializer(current_lesson).data if current_lesson else None,
            "recommended_lessons": LessonSerializer(recommended_lessons, many=True).data,
            "study_sessions": StudySessionSerializer(study_sessions, many=True).data,
            "progress": UserProgressSerializer(progress).data,
            "recent_activities": UserActivitySerializer(recent_activities, many=True).data,
        })


class StudySessionListCreateView(generics.ListCreateAPIView):
    serializer_class = StudySessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        session = serializer.save(user=self.request.user)
        
        # Get the lesson title from the related lesson object
        lesson_title = session.lesson.title if session.lesson else 'Study Session'
        
        # Create study session activity (NO XP reward)
        UserActivity.create_activity(
            user=self.request.user,
            activity_type='study_session_added',
            title="Study Session Scheduled 📅",
            description=f"Scheduled: {lesson_title} on {session.date}",
            xp_earned=0  # Changed from 5 to 0
        )
        


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


class LessonSolutionView(generics.RetrieveAPIView):
    serializer_class = LessonWithSolutionSerializer
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticated]


class LessonQuizView(generics.ListAPIView):
    """
    GET /lessons/<lesson_id>/quiz/   →  list of questions (no answers)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        lesson_id = self.kwargs["lesson_id"]
        return QuizQuestion.objects.filter(lesson_id=lesson_id)

class LessonQuizSubmitView(APIView):
    """
    POST /lessons/<lesson_id>/quiz/submit/
      body: {"answers": {"12":"B","13":"D", ...}}
    Returns score and per-question feedback.
    Also awards XP (+10/correct) to UserProgress.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data["answers"]

        questions = QuizQuestion.objects.filter(lesson_id=lesson_id)
        if not questions.exists():
            return Response({"error": "No quiz for this lesson"}, 404)

        correct, feedback = 0, []
        for q in questions:
            user_ans = answers.get(str(q.id))
            is_correct = user_ans and user_ans.upper() == q.correct_option
            feedback.append({
                "id": q.id,
                "question": q.question,
                "your_answer": user_ans,
                "correct_option": q.correct_option if is_correct else None,
                "explanation": q.explanation if not is_correct else "Correct!"
            })
            if is_correct:
                correct += 1

        # Calculate score percentage
        total_questions = questions.count()
        score_percentage = int((correct / total_questions) * 100)

        # Award XP
        xp_earned = correct * 10
        progress, _ = UserProgress.objects.get_or_create(user=request.user)
        leveled_up = progress.add_xp(xp_earned)

        # Create quiz activity - ONLY ONE ACTIVITY, NOT TWO
        lesson = Lesson.objects.get(id=lesson_id)
        if score_percentage >= 70:  # Passing grade
            UserActivity.create_activity(
                user=request.user,
                activity_type='quiz_passed',
                title=f"Quiz Passed! 🎯",
                description=f"{lesson.title} Quiz - Score: {score_percentage}%",
                xp_earned=xp_earned,
                lesson=lesson,
                quiz_score=score_percentage
            )
        else:
            # Even for failed quizzes, create an activity but with different title
            UserActivity.create_activity(
                user=request.user,
                activity_type='quiz_completed',
                title=f"Quiz Completed 🎯",
                description=f"{lesson.title} Quiz - Score: {score_percentage}%",
                xp_earned=xp_earned,
                lesson=lesson,
                quiz_score=score_percentage
            )

        # DON'T create a separate xp_earned activity here
        
        return Response({
            "total": total_questions,
            "correct": correct,
            "score_percentage": score_percentage,
            "xp_earned": xp_earned,
            "xp_total": progress.xp,
            "level": progress.level,
            "leveled_up": leveled_up,
            "feedback": feedback
        }, 200)

class GeneralQuizView(generics.ListAPIView):
    """
    Returns 5 questions (in order) that match the user's learning goal and difficulty level.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = QuizQuestion.objects.filter(
            lesson__learning_goal=user.learning_goal,
            lesson__difficulty_level=user.difficulty_level
        ).order_by("order", "id")  # Order by 'order' field, then id for stability
        return qs[:5]  # Return the first 5 in order

class GeneralQuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        answers = request.data.get("answers", {})
        question_ids = list(map(int, answers.keys()))
        questions = QuizQuestion.objects.filter(id__in=question_ids)

        correct = 0
        feedback = []
        for q in questions:
            user_pick = answers.get(str(q.id))
            is_ok = user_pick == q.correct_option
            if is_ok: correct += 1
            feedback.append({
                "id": q.id,
                "question": q.question,
                "your_answer": user_pick,
                "correct": q.correct_option if is_ok else None,
                "explanation": q.explanation if not is_ok else "✓ Correct"
            })

        total_questions = questions.count()
        current_score = correct
        score_percentage = int((current_score / total_questions) * 100)  # Add this line

        # Get or create quiz attempt record
        quiz_attempt, created = QuizAttempt.objects.get_or_create(
            user=request.user,
            quiz_type="general",
            learning_goal=request.user.learning_goal,
            difficulty_level=request.user.difficulty_level,
            defaults={
                'best_score': 0,
                'total_questions': 0,
                'max_xp_earned': 0
            }
        )

        # Calculate XP to award
        xp_to_award = 0
        if current_score > quiz_attempt.best_score:
            # They improved! Award XP for the improvement
            previous_max_xp = quiz_attempt.best_score * 10
            new_max_xp = current_score * 10
            xp_to_award = new_max_xp - previous_max_xp
            
            # Update their best score
            quiz_attempt.best_score = current_score
            quiz_attempt.max_xp_earned = new_max_xp
            quiz_attempt.save()
        else:
            # No improvement, no additional XP
            xp_to_award = 0

        # Award XP WITHOUT creating separate XP activity
        user_progress, _ = UserProgress.objects.get_or_create(user=request.user)
        if xp_to_award > 0:
            user_progress.add_xp(xp_to_award, create_activity=False)  # Don't create XP activity

        # CREATE QUIZ COMPLETION ACTIVITY (this was missing!)
        if score_percentage >= 70:  # Passing grade
            UserActivity.create_activity(
                user=request.user,
                activity_type='quiz_passed',
                title=f"General Quiz Passed! 🎯",
                description=f"Score: {current_score}/{total_questions} ({score_percentage}%)",
                xp_earned=xp_to_award,
                quiz_score=score_percentage
            )
        else:
            # Even for failed attempts, create an activity
            UserActivity.create_activity(
                user=request.user,
                activity_type='quiz_completed',
                title=f"General Quiz Completed 🎯",
                description=f"Score: {current_score}/{total_questions} ({score_percentage}%)",
                xp_earned=xp_to_award,
                quiz_score=score_percentage
            )

        return Response({
            "total": total_questions,
            "correct": current_score,
            "best_score": quiz_attempt.best_score,
            "xp_earned": xp_to_award,
            "xp_total": user_progress.xp,
            "level": user_progress.level,
            "feedback": feedback,
            "message": f"Best score: {quiz_attempt.best_score}/{total_questions}" if not created else "First attempt!"
        }, status=status.HTTP_200_OK)


class ActivityListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserActivitySerializer
    
    def get_queryset(self):
        return UserActivity.objects.filter(user=self.request.user)
