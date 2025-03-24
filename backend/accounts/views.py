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
        current_step = request.data.get("currentStep", 1)
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
        
        # Build a more detailed prompt to get better AI responses
        prompt = self.build_detailed_prompt(
            question, 
            lesson, 
            current_step, 
            user_code, 
            expected_output
        )
        
        try:
            # Get an API key from settings or use an environment variable
            # This is a placeholder - you'll need to add your actual API key setup
            openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
            
            if openai_api_key:
                # Use OpenAI API if available
                response_text = self.get_openai_response(prompt, openai_api_key)
            else:
                # Fallback to a structured, contextual response generator
                response_text = self.generate_structured_response(
                    question, 
                    lesson, 
                    current_step, 
                    user_code, 
                    expected_output
                )
        except Exception as e:
            print(f"Error generating AI response: {str(e)}")
            # Fallback to a structured response if API call fails
            response_text = self.generate_structured_response(
                question, 
                lesson, 
                current_step, 
                user_code, 
                expected_output
            )
        
        return Response({"response": response_text}, status=status.HTTP_200_OK)
    
    def build_detailed_prompt(self, question, lesson, current_step, user_code, expected_output):
        """Build a detailed prompt with all relevant context for the AI"""
        # Get the appropriate content based on the step
        step_content = ""
        if current_step == 1:
            step_content = lesson.step1_content
        elif current_step == 2:
            step_content = lesson.step2_content
        elif current_step == 3:
            step_content = lesson.step3_challenge
        
        # Clean HTML from content
        step_content = re.sub(r'<[^>]+>', ' ', step_content)
        step_content = re.sub(r'\s+', ' ', step_content).strip()
        
        # Build a comprehensive prompt
        prompt = f"""You are an AI learning assistant helping a student learn Python programming.

CONTEXT:
- Lesson: {lesson.title}
- Description: {lesson.description}
- Current step: {current_step} ({'Introduction' if current_step == 1 else 'Guided Example' if current_step == 2 else 'Challenge'})
- Step content: {step_content[:500]}...

{f"- Student's code: {user_code}" if user_code else ""}
{f"- Expected output: {expected_output}" if expected_output else ""}

STUDENT'S QUESTION:
{question}

Please provide a helpful, educational response that addresses the specific question. Be concise but thorough, focusing on teaching programming concepts with clear explanations and examples where appropriate. Avoid generic greetings like "How can I help you today?" and directly answer the question.
"""
        return prompt
    
    def get_openai_response(self, prompt, api_key):
        """Get a response from OpenAI API"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a helpful programming tutor specializing in Python."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.7
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            response_data = response.json()
            if "choices" in response_data and len(response_data["choices"]) > 0:
                return response_data["choices"][0]["message"]["content"].strip()
            else:
                raise Exception("Invalid response format from OpenAI API")
                
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            raise
    
    def generate_structured_response(self, question, lesson, current_step, user_code, expected_output):
        """Generate a structured response based on question analysis"""
        question_lower = question.lower()
        
        # 1. Check for print-related questions
        if "print" in question_lower and ("how" in question_lower or "write" in question_lower):
            # Extract what they want to print if mentioned
            content = "Hello, World!"
            if "hello python" in question_lower:
                content = "Hello Python"
            elif "hello" in question_lower:
                content = "Hello"
                
            return f"""In Python, you use the print() function to display text on the screen. Here's how to print '{content}':

```python
print("{content}")
```

When you run this code, it will display: {content}

Make sure to:
- Enclose your text in quotes (single or double)
- Include parentheses after print
- Check that the quotes match (don't mix single and double quotes)"""
        
        # 2. Check for syntax questions
        if any(word in question_lower for word in ["syntax", "how to", "how do i"]):
            if "variable" in question_lower:
                return """Python variable syntax is simple:

```python
variable_name = value
```

Examples:
```python
name = "John"       # String variable
age = 25            # Integer variable
price = 19.99       # Float variable
is_student = True   # Boolean variable
```

Python is dynamically typed, so you don't need to declare the variable type. The interpreter determines the type based on the assigned value."""
            
            if "function" in question_lower or "def" in question_lower:
                return """To define a function in Python, use the 'def' keyword:

```python
def function_name(parameter1, parameter2, ...):
    # Function body
    # Code to execute
    return result  # Optional return statement
```

Example:
```python
def greet(name):
    return f"Hello, {name}!"
    
# Call the function
message = greet("Alice")
print(message)  # Displays: Hello, Alice!
```

Functions help you organize and reuse code. The 'return' statement is optional - if omitted, the function returns None."""
        
        # 3. Check for code analysis questions
        if "what does this code do" in question_lower or "explain this code" in question_lower:
            if user_code:
                code_explanation = "Your code "
                
                if "print(" in user_code:
                    code_explanation += "displays text to the console using the print() function. "
                
                if "=" in user_code and "==" not in user_code:
                    code_explanation += "assigns values to variables. "
                    
                if "if" in user_code:
                    code_explanation += "uses conditional statements to make decisions based on certain conditions. "
                    
                if "for" in user_code or "while" in user_code:
                    code_explanation += "utilizes loops to repeat actions. "
                    
                if "def" in user_code:
                    code_explanation += "defines a custom function that can be called later. "
                    
                code_explanation += "\n\nTo understand your code better, let's break it down line by line:\n"
                
                # Add a simple line-by-line analysis
                lines = user_code.strip().split('\n')
                for i, line in enumerate(lines[:5]):  # Limit to first 5 lines for brevity
                    line = line.strip()
                    if line and not line.startswith('#'):
                        code_explanation += f"\nLine {i+1}: `{line}`"
                        if "print" in line:
                            code_explanation += " - This displays output to the console."
                        elif "=" in line and "==" not in line and "!=" not in line:
                            code_explanation += " - This assigns a value to a variable."
                        elif "if" in line:
                            code_explanation += " - This starts a conditional block that only executes if the condition is True."
                        elif "else" in line:
                            code_explanation += " - This provides an alternative code block to execute when the if condition is False."
                        elif "for" in line:
                            code_explanation += " - This starts a loop that iterates over a sequence."
                        elif "def" in line:
                            code_explanation += " - This defines a function."
                
                return code_explanation
            else:
                return "I don't see any code to analyze. Please write some Python code first, and then I can explain what it does."
        
        # 4. Handle challenge-related questions
        if current_step == 3 and any(word in question_lower for word in ["hint", "stuck", "help", "challenge"]):
            if expected_output:
                hint = f"For this challenge, you need to write code that produces this output: '{expected_output}'. "
                
                if "hello" in expected_output.lower():
                    hint += "Try using the print() function with the appropriate string."
                elif any(op in expected_output for op in ["+", "-", "*", "/"]):
                    hint += "This appears to involve mathematical operations. Make sure your code performs the correct calculation and displays the result."
                
                return hint
            else:
                return """To approach this challenge:

1. Understand what you're being asked to do
2. Break it down into smaller steps
3. Think about which Python concepts you need (variables, loops, conditionals, etc.)
4. Write your solution step by step
5. Test your code with different inputs if possible

What specific part of the challenge are you struggling with?"""
        
        # 5. Default responses for different steps
        if current_step == 1:
            return f"""In this introduction to "{lesson.title}", we're covering the fundamental concepts needed for the lesson. 

The key points to understand are:
- Python syntax basics
- How code statements are structured
- How the concepts relate to practical programming

Is there a specific part of the introduction you'd like me to explain in more detail?"""
        elif current_step == 2:
            return f"""The guided example in this lesson demonstrates how to apply the concepts in practice. 

When analyzing this example, pay attention to:
- How the code is structured
- The relationship between different lines of code
- How the output is produced

Feel free to experiment by modifying parts of the example to see how it changes the behavior."""
        else:
            return f"""For this challenge in "{lesson.title}", you'll need to apply what you've learned to solve a programming problem.

Remember to:
- Plan before you code
- Test your solution with different inputs
- Make sure your output format matches exactly what's expected

Could you tell me which specific aspect of the challenge you need help with?"""
