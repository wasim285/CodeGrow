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
import json
import re
import time
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
        # Extract data from the request
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
        
        # Instead of relying on external API, generate responses locally
        # This eliminates the timeout issues completely
        response_text = self.generate_local_response(question, lesson, current_step, user_code, expected_output)
        
        # Log the interaction for analytics (optional)
        try:
            AIInteraction.objects.create(
                user=request.user,
                lesson=lesson,
                question=question,
                response=response_text[:500],  # Store first 500 chars to avoid DB issues
                step=current_step
            )
        except Exception as e:
            # Don't fail if logging fails
            print(f"Error logging AI interaction: {str(e)}")
        
        return Response({"response": response_text}, status=status.HTTP_200_OK)
    
    def generate_local_response(self, question, lesson, current_step, user_code, expected_output):
        """
        Generate AI assistant responses locally without external API calls
        This eliminates timeouts and ensures consistent performance
        """
        question_lower = question.lower()
        
        # Add a small delay to simulate thinking (optional)
        time.sleep(0.5)
        
        # Handle common greeting patterns
        if any(word in question_lower for word in ["hello", "hi", "hey", "greetings"]):
            return f"Hello! I'm your AI assistant for this '{lesson.title}' lesson. How can I help you today?"
        
        # Handle lesson content questions
        if "what" in question_lower and any(phrase in question_lower for phrase in ["lesson", "learn", "about", "topic"]):
            return f"This lesson on '{lesson.title}' is about {lesson.description}. You'll learn key programming concepts and practical skills through guided examples and hands-on challenges."
        
        # Handle concept explanation requests
        if "explain" in question_lower or "understand" in question_lower:
            if current_step == 1:
                content = self.extract_clean_content(lesson.step1_content)
                return f"Let me explain the concept in simpler terms. {content} Does that help clarify things?"
            elif current_step == 2:
                content = self.extract_clean_content(lesson.step2_content)
                return f"In the guided example, we're learning about {content} Pay attention to how the code is structured and the logic flow."
        
        # Handle code-specific questions in step 2 or 3
        if (current_step == 2 or current_step == 3) and any(word in question_lower for word in ["code", "function", "error", "bug", "fix"]):
            if not user_code:
                return "I don't see any code to analyze. Please write some code in the editor first, then I can help you review it."
            
            code_snippet = user_code[:200] + "..." if len(user_code) > 200 else user_code
            
            # Generic code analysis
            if "what does" in question_lower or "explain" in question_lower:
                return f"Let me explain what your code does:\n\nYour code takes input, processes it using variables and operations, and produces an output. The key part is how you're handling the computation logic. Make sure your variables are properly initialized and your operations are performing the intended calculations."
            
            if "error" in question_lower or "bug" in question_lower or "fix" in question_lower:
                # Check for common programming errors
                common_issues = self.identify_common_issues(user_code)
                if common_issues:
                    return f"I spotted a few potential issues in your code:\n\n{common_issues}\n\nTry fixing these and see if it helps!"
                else:
                    return "Your code looks syntactically correct, but you might have a logical error. Check that your algorithm correctly implements the requirements. Make sure you're handling all possible input cases correctly."
        
        # Handle challenge-specific help in step 3
        if current_step == 3:
            if "stuck" in question_lower or "hint" in question_lower or "help" in question_lower:
                challenge = self.extract_clean_content(lesson.step3_challenge)
                return f"Let's break down the challenge: {challenge}\n\nHere's a hint: start by understanding the expected input and output format. Then, write pseudocode to outline your approach before coding. Focus on one requirement at a time."
            
            if "output" in question_lower or "expected" in question_lower:
                return f"The expected output should be: {expected_output}\n\nMake sure your code produces output in exactly this format, including any spacing, punctuation, or formatting details."
        
        # Handle general programming questions
        programming_concepts = {
            "loop": "Loops allow you to repeat a block of code multiple times. Common types are 'for' loops (for a specific number of iterations) and 'while' loops (until a condition is met).",
            "variable": "Variables store data values that can be used and modified throughout your program. In Python, you don't need to declare the type - it's dynamically typed.",
            "function": "Functions are reusable blocks of code that perform specific tasks. They help organize your code and follow the DRY (Don't Repeat Yourself) principle.",
            "if": "Conditional statements (if/elif/else) allow your program to make decisions based on certain conditions, executing different code blocks accordingly.",
            "list": "Lists are ordered, changeable collections that can store multiple items, even of different types. They use square brackets [].",
            "dictionary": "Dictionaries store data in key-value pairs, allowing fast lookups by key. They use curly braces {} with key:value syntax.",
            "error": "Errors happen when your code can't execute properly. Common types include SyntaxError (incorrect syntax), TypeError (operation on incorrect data type), and IndexError (accessing non-existent index)."
        }
        
        for concept, explanation in programming_concepts.items():
            if concept in question_lower:
                return explanation
        
        # Default responses based on current step
        step_responses = {
            1: [
                f"The introduction to {lesson.title} provides the foundation you need. Take your time to understand these concepts as they'll be essential for the next steps.",
                "It might help to relate these new concepts to something you already know. Can you think of a real-world analogy for this programming concept?",
                "Don't worry if everything doesn't click immediately. Programming is a skill that develops with practice and experience."
            ],
            2: [
                "Try to understand the guided example line by line. What does each statement do? How do they work together?",
                "The best way to learn is by experimenting! Try modifying the code example slightly and see how it changes the output.",
                "This example demonstrates fundamental programming patterns that you'll use frequently. Pay attention to the structure and problem-solving approach."
            ],
            3: [
                "For this challenge, break down the problem into smaller steps. What inputs do you need? What operations should you perform? What's the expected output format?",
                "Think about edge cases in your solution. What happens with unexpected inputs? Have you handled all possible scenarios?",
                "If you're stuck, try writing pseudocode first - outline your solution in plain English steps before converting to Python code."
            ]
        }
        
        # Return a random appropriate response for the current step
        step_num = int(current_step) if str(current_step).isdigit() else 1
        return random.choice(step_responses.get(step_num, step_responses[1]))
    
    def extract_clean_content(self, html_content):
        """Extract readable text from HTML content"""
        if not html_content:
            return "the key programming concepts covered in this lesson."
            
        # Simple regex to remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', html_content)
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit length
        if len(text) > 200:
            text = text[:200] + "..."
            
        return text
    
    def identify_common_issues(self, code):
        """Identify common programming issues in code"""
        issues = []
        
        # Check for indentation issues (simplified check)
        if "    " in code and "\t" in code:
            issues.append("- You're mixing tabs and spaces for indentation, which can cause issues in Python")
            
        # Check for unclosed brackets/parentheses
        if code.count('(') != code.count(')'):
            issues.append("- You have mismatched parentheses () in your code")
        if code.count('[') != code.count(']'):
            issues.append("- You have mismatched square brackets [] in your code")
        if code.count('{') != code.count('}'):
            issues.append("- You have mismatched curly braces {} in your code")
            
        # Check for common syntax issues
        if "print" in code and "print " not in code and "print(" not in code:
            issues.append("- Check your print statements. In Python 3, print requires parentheses: print()")
            
        if ";" in code:
            issues.append("- Python doesn't require semicolons (;) at the end of lines. They're optional but rarely used.")
            
        # Check for logical errors
        if "==" not in code and "if" in code:
            issues.append("- For comparisons in if statements, use == (double equals) not = (single equals)")
            
        # Return formatted issues or None
        if issues:
            return "\n".join(issues)
        return None