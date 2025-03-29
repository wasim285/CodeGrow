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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AllLessonsView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lesson.objects.all().order_by("order")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
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
        except Exception as e:
            print(f"Dashboard error: {str(e)}")
            return Response(
                {"error": "Failed to load dashboard data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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


# REMOVED: CodeFeedbackView class that provided AI code review


# REMOVED: LessonFeedbackView class that provided AI feedback on lessons


class LessonAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Extract data from the request
        lesson_id = request.data.get("lessonId")
        current_step = request.data.get("currentStep", 1)
        user_code = request.data.get("userCode", "")
        expected_output = request.data.get("expectedOutput", "")
        question = request.data.get("question", "")
        learning_pathway = request.data.get("learningPathway", "")
        
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
        
        # Build a detailed prompt for the AI model
        prompt = self.build_prompt(question, lesson, current_step, user_code, expected_output, learning_pathway)
        
        try:
            # Get response from Hugging Face model
            response_text = self.get_hf_response(prompt)
            
            # Clean up the response if needed
            response_text = self.clean_response(response_text, question)
            
            return Response({"response": response_text}, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"AI model error: {str(e)}")
            # Fallback to a simple, structured response if API call fails
            fallback_response = self.get_fallback_response(question, lesson, current_step, user_code, expected_output)
            return Response({"response": fallback_response}, status=status.HTTP_200_OK)
    
    def build_prompt(self, question, lesson, current_step, user_code, expected_output, learning_pathway=""):
        """Build a detailed prompt for the AI model with all context"""
        # Get the appropriate content based on the step
        step_content = ""
        if current_step == 1:
            step_content = lesson.step1_content
        elif current_step == 2:
            step_content = lesson.step2_content
        elif current_step == 3:
            step_content = lesson.step3_challenge
        
        # Clean HTML from content
        if step_content:
            step_content = re.sub(r'<[^>]+>', ' ', step_content)
            step_content = re.sub(r'\s+', ' ', step_content).strip()
            # Limit length to avoid token limits
            step_content = step_content[:500] + "..." if len(step_content) > 500 else step_content
        
        # Add learning pathway context if available
        pathway_context = ""
        if learning_pathway:
            pathway_details = {
                "School": "helping students master concepts for academic success",
                "Portfolio": "helping users build practical projects for their coding portfolio",
                "Career Growth": "helping professionals develop industry-standard coding practices"
            }
            
            pathway_details_text = pathway_details.get(learning_pathway, "")
            if pathway_details_text:
                pathway_context = f"Learning Pathway: {learning_pathway} - Focus on {pathway_details_text}.\n"
        
        # Format for Mistral's instruction format
        prompt = f"""<s>[INST] You are a helpful AI learning assistant named CodeGrow for a Python programming education platform.

CONTEXT:
{pathway_context}Lesson: {lesson.title}
Description: {lesson.description}
Current Step: {current_step} ({'Introduction' if current_step == 1 else 'Guided Example' if current_step == 2 else 'Challenge'})
Step Content: {step_content}

{"User's Code: " + user_code if user_code else "The user hasn't written any code yet."}
{"Expected Output: " + expected_output if expected_output else ""}

The student's question is: {question}

Your task:
1. Give a direct, helpful response to the student's question
2. Focus on explaining Python concepts clearly with examples
3. If they ask about code, explain what it does or how to write it
4. Provide correct Python syntax and educational value
5. Keep your response under 200 words
6. Don't repeat the question or use generic greetings like "How can I help you today?"
7. Address their specific question immediately

Your response: [/INST]"""
        
        return prompt
    
    def get_hf_response(self, prompt):
        """Get a response from the Hugging Face model API"""
        headers = {
            "Authorization": f"Bearer {settings.HF_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True,
                "return_full_text": False
            }
        }
        
        api_url = f"{settings.HF_API_URL}{settings.HF_MODEL_ID}"
        
        # Try multiple times with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    api_url, 
                    headers=headers, 
                    json=payload,
                    timeout=settings.HF_REQUEST_TIMEOUT
                )
                
                # Check for successful response
                if response.status_code == 200:
                    response_json = response.json()
                    
                    # Handle different response formats from different models
                    if isinstance(response_json, list) and len(response_json) > 0:
                        if "generated_text" in response_json[0]:
                            text = response_json[0]["generated_text"]
                        else:
                            text = str(response_json[0])
                    elif isinstance(response_json, dict):
                        if "generated_text" in response_json:
                            text = response_json["generated_text"]
                        else:
                            text = str(response_json)
                    else:
                        text = str(response_json)
                    
                    # Clean up and return the response
                    text = text.strip()
                    return text
                
                # If model is still loading, wait and retry
                if response.status_code == 503 and "Model is loading" in response.text:
                    wait_time = (2 ** attempt) * 2  # Exponential backoff: 2, 4, 8 seconds
                    print(f"Model is loading, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                
                # Other error
                raise Exception(f"API request failed with status {response.status_code}: {response.text}")
                
            except requests.exceptions.Timeout:
                # Handle timeout specifically
                wait_time = (2 ** attempt) * 2
                if attempt < max_retries - 1:  # Don't sleep on the last attempt
                    print(f"Request timed out, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise Exception("All requests timed out")
            except Exception as e:
                # Handle other exceptions
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2
                    print(f"Error: {str(e)}, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise
        
        # If we got here, all retries failed
        raise Exception("All requests to the model API failed")
    
    def clean_response(self, response, question):
        """Clean up the model response to ensure it's useful and appropriate"""
        # Remove any prompt remnants or instruction tokens
        response = re.sub(r'</?s>|\[/?INST\]', '', response).strip()
        
        # Check if response is too short or generic
        if len(response) < 20:
            return self.get_fallback_response(question, None, None, None, None)
        
        # Check for common generic greeting patterns and remove them
        greeting_patterns = [
            r'^Hello!.*How can I help you.*\?',
            r'^Hi there!.*How can I assist.*\?',
            r'^Greetings!.*What can I do.*\?'
        ]
        
        for pattern in greeting_patterns:
            if re.match(pattern, response, re.IGNORECASE):
                # Replace with empty string and check if what remains is substantial
                remaining = re.sub(pattern, '', response, flags=re.IGNORECASE).strip()
                if len(remaining) > 30:  # If there's still substantial content
                    return remaining
                else:
                    return self.get_fallback_response(question, None, None, None, None)
        
        return response
    
    def get_fallback_response(self, question, lesson, current_step, user_code, expected_output):
        """Generate a fallback response when the API call fails"""
        question_lower = question.lower()
        
        # Questions about printing
        if "print" in question_lower:
            return """In Python, you use the print() function to display text. For example:

```python
print("Hello, World!")  # Outputs: Hello, World!
```

You can also print variables:
```python
name = "Python"
print("Hello,", name)  # Outputs: Hello, Python
```

Make sure to put your text inside quotes (single or double), and use commas to separate multiple items."""
            
        # Questions about code
        if "what does this code do" in question_lower or "explain" in question_lower:
            if user_code:
                return "Your code appears to be a Python program that processes input and produces output. To give a more specific explanation, I'd need to analyze it in detail, but I'm currently experiencing technical difficulties. Try running your code to see what it does or ask about specific parts you're confused about."
            else:
                return "I don't see any code to analyze. Please write some Python code first, and then I can help explain what it does."
        
        # Questions about challenge
        if "hint" in question_lower or "challenge" in question_lower or "stuck" in question_lower:
            return "To solve this programming challenge, break it down into steps: understand the requirements, plan your approach, implement one piece at a time, and test your solution. Which specific part are you struggling with?"
        
        # Default fallback
        return "I understand you're asking about Python programming. Could you provide more specific details about what you're trying to learn or which concept you're having trouble with?"
