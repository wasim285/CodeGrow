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


class LessonFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Use serializer for validation
        from .serializers import LessonFeedbackSerializer
        
        serializer = LessonFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        code = serializer.validated_data.get("code")
        expected_output = serializer.validated_data.get("expected_output")
        user_output = serializer.validated_data.get("user_output")
        question = serializer.validated_data.get("question")
        
        # Get API key from environment variables
        HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
        API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder"

        # Prepare prompt with context about the error
        prompt = f"""
        The student was asked to solve this question:
        {question}
        
        They wrote this code:
        ```python
        {code}
        ```
        
        Expected output: {expected_output}
        Actual output: {user_output}
        
        Please explain what's wrong with their code, where they went wrong, and provide a helpful hint to fix it. 
        Do not provide the full solution, just guidance to help them learn.
        """

        headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
        payload = {"inputs": prompt}

        try:
            response = requests.post(API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                return Response(
                    {"error": f"API request failed with status code {response.status_code}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            feedback_data = response.json()
            
            # Extract the generated text
            if isinstance(feedback_data, list) and len(feedback_data) > 0:
                feedback_text = feedback_data[0].get("generated_text", "")
            else:
                feedback_text = feedback_data.get("generated_text", "")
            
            if not feedback_text:
                return Response(
                    {"error": "No feedback was generated"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Optional: You can save the feedback in the database for future reference
            # LessonFeedback.objects.create(
            #     user=request.user,
            #     code=code,
            #     question=question,
            #     expected_output=expected_output,
            #     actual_output=user_output,
            #     feedback=feedback_text
            # )

            return Response({"feedback": feedback_text}, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to get AI feedback: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LessonAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lesson_id = request.data.get("lessonId")
        current_step = request.data.get("currentStep")
        user_code = request.data.get("userCode", "")
        expected_output = request.data.get("expectedOutput", "")
        question = request.data.get("question", "")
        
        if not lesson_id or not question:
            return Response(
                {"error": "Missing lesson ID or question"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response(
                {"error": "Lesson not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prepare a simplified response based on the question type
        # This avoids API timeouts by using predefined responses for common questions
        simplified_response = self.get_simplified_response(question, lesson, current_step, user_code, expected_output)
        if simplified_response:
            return Response({"response": simplified_response}, status=status.HTTP_200_OK)
            
        try:
            # If no simplified response is available, use a simpler prompt for the API
            # that is less likely to cause timeouts
            prompt = self.create_simplified_prompt(question, lesson, current_step, user_code, expected_output)
            
            HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
            API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder"

            headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
            payload = {"inputs": prompt, "wait_for_model": False}  # Don't wait for model to load

            # Set a shorter timeout to avoid worker timeouts
            response = requests.post(API_URL, headers=headers, json=payload, timeout=5)
            
            if response.status_code != 200:
                # Fallback to simplified response if API fails
                return Response({
                    "response": "I'm having trouble connecting to my knowledge base right now. Let me provide a simpler answer:\n\n" + 
                                self.generate_fallback_response(question, lesson, current_step)
                }, status=status.HTTP_200_OK)
                
            feedback_data = response.json()
            
            # Extract the generated text
            if isinstance(feedback_data, list) and len(feedback_data) > 0:
                response_text = feedback_data[0].get("generated_text", "")
            else:
                response_text = feedback_data.get("generated_text", "")
            
            # Clean up the response
            response_text = self.clean_response_text(response_text, prompt)
            
            return Response({"response": response_text}, status=status.HTTP_200_OK)

        except (requests.RequestException, json.JSONDecodeError, KeyError, Exception) as e:
            import traceback
            print(f"AI Assistant Error: {str(e)}")
            print(traceback.format_exc())
            
            # Return a fallback response instead of an error
            return Response({
                "response": "I'm having trouble processing your question right now. Let me provide a simpler answer:\n\n" + 
                            self.generate_fallback_response(question, lesson, current_step)
            }, status=status.HTTP_200_OK)
    
    def create_simplified_prompt(self, question, lesson, current_step, user_code, expected_output):
        """Create a much simpler prompt that's less likely to cause timeouts"""
        prompt = f"Help a student with: {question}\n\nLesson: {lesson.title}\n"
        
        if current_step == 3 and user_code:
            prompt += f"Their code: {user_code[:300]}...\n"  # Limit code size
            
        prompt += "Keep your response short, simple, and encouraging."
        return prompt
    
    def clean_response_text(self, text, prompt):
        """Clean the response text to remove HTML, docstrings, etc."""
        if not text:
            return "I'm sorry, I couldn't generate a response. Please try a different question."
            
        # Remove the prompt if it's repeated in the response
        if text.startswith(prompt):
            text = text[len(prompt):].strip()
            
        # Remove HTML and docstrings
        text = re.sub(r'<!DOCTYPE.*?>', '', text, flags=re.DOTALL)
        text = re.sub(r'<html>.*?</html>', '', text, flags=re.DOTALL)
        text = re.sub(r'""".*?"""', '', text, flags=re.DOTALL)
        text = re.sub(r"'''.*?'''", '', text, flags=re.DOTALL)
        
        # If after cleaning we have little text left, provide a fallback
        if len(text.strip()) < 20:
            return "I understand your question. Could you try rephrasing it so I can help you better?"
            
        return text.strip()
    
    def get_simplified_response(self, question, lesson, current_step, user_code, expected_output):
        """Check if the question matches common patterns and return a pre-defined response"""
        question_lower = question.lower()
        
        # Check for common question patterns
        if any(keyword in question_lower for keyword in ["hello", "hi ", "hey", "greetings"]):
            return f"Hello! I'm here to help you with your '{lesson.title}' lesson. What would you like to know?"
            
        if any(keyword in question_lower for keyword in ["what will i learn", "what is this lesson about"]):
            return f"In this lesson on '{lesson.title}', you'll learn about {lesson.description}"
            
        if "explain" in question_lower and "concept" in question_lower:
            if current_step == 1:
                return f"Let me explain this concept in simpler terms: {lesson.step1_content[:300]}..."
            elif current_step == 2:
                return f"This concept involves: {lesson.step2_content[:300]}..."
                
        if "stuck" in question_lower and current_step == 3:
            return f"Let's break down the challenge step by step. The goal is to {lesson.step3_challenge[:150]}... Try starting by understanding what inputs you need and what output is expected."
            
        if "hint" in question_lower and current_step == 3:
            return f"Here's a hint: Make sure you're handling the input correctly and check that your output format matches what's expected ({expected_output})."
            
        # No simplified response available
        return None
        
    def generate_fallback_response(self, question, lesson, current_step):
        """Generate a fallback response based on the question and context"""
        if "explain" in question.lower():
            return f"This is a concept in {lesson.title} that involves understanding how to process data and perform operations in Python. Would you like me to break it down into smaller steps?"
            
        if "error" in question.lower() or "not working" in question.lower():
            return "When debugging code, focus on checking your syntax, making sure variable names match throughout your code, and verifying that your logic handles all possible inputs."
            
        if "how to" in question.lower():
            return "To approach this problem, break it into smaller steps: 1) Understand what inputs you need, 2) Process the data step by step, 3) Format your output correctly."
            
        # Generic fallback based on current step
        if current_step == 1:
            return "This introductory section helps build your foundation. Try re-reading the explanation and think about how these concepts connect to what you already know."
        elif current_step == 2:
            return "In the guided example, focus on understanding each line of code. Try changing small parts to see how it affects the output."
        elif current_step == 3:
            return "For this challenge, start by planning your approach on paper before coding. Think about what inputs you have and what steps you need to take to get the expected output."
        else:
            return "I'm here to help with this lesson. Could you tell me more specifically what you're struggling with?"