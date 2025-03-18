from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, UserProgress, Lesson, StudySession


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ["username", "email", "password"]
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        UserProgress.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError({"error": "Invalid username or password"})


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "username", "email", "learning_goal", "difficulty_level"]

    def update(self, instance, validated_data):
        updated = False

        if "learning_goal" in validated_data:
            instance.learning_goal = validated_data["learning_goal"]
            updated = True

        if "difficulty_level" in validated_data:
            instance.difficulty_level = validated_data["difficulty_level"]
            updated = True

        if updated:
            instance.save()
            Lesson.create_default_lessons(instance)

        return instance


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            "id", 
            "title", 
            "description", 
            "step1_content", 
            "step2_content", 
            "step3_challenge", 
            "code_snippet",
            "expected_output",
            "difficulty_level",
            "learning_goal"
        ]


class UserProgressSerializer(serializers.ModelSerializer):
    total_lessons_completed = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ["streak", "total_lessons_completed", "last_active"]

    def get_total_lessons_completed(self, obj):
        return obj.completed_lessons.count()


class StudySessionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)

    class Meta:
        model = StudySession
        fields = ['id', 'lesson', 'lesson_title', 'date', 'start_time', 'end_time']

    def validate(self, data):
        if data["end_time"] <= data["start_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class LessonFeedbackSerializer(serializers.Serializer):
    """
    Serializer for the lesson feedback API endpoint.
    """
    code = serializers.CharField(required=True)
    expected_output = serializers.CharField(required=True)
    user_output = serializers.CharField(required=True)
    question = serializers.CharField(required=True)
    
    def validate(self, data):
        # Basic validation to ensure all fields have content
        for field in ['code', 'expected_output', 'question']:
            if not data.get(field, '').strip():
                raise serializers.ValidationError(f"{field} cannot be empty")
        return data
