from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, UserProgress, Lesson, StudySession


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password2 = serializers.CharField(write_only=True, min_length=8, required=True)

    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "username", "email", "password", "password2"]

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
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

        if "learning_goal" in validated_data or "difficulty_level" in validated_data:
            # ✅ Remove old lessons before updating
            Lesson.objects.filter(
                learning_goal=instance.learning_goal,
                difficulty_level=instance.difficulty_level
            ).delete()
            updated = True

        if "learning_goal" in validated_data:
            instance.learning_goal = validated_data["learning_goal"]

        if "difficulty_level" in validated_data:
            instance.difficulty_level = validated_data["difficulty_level"]

        if updated:
            instance.save()
            Lesson.create_default_lessons(instance)

        return instance


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            "id", "title", "description", "step1_content", "step2_content",
            "step3_challenge", "code_snippet", "learning_goal", "difficulty_level"
        ]


class UserProgressSerializer(serializers.ModelSerializer):
    """Updated serializer to include completed lessons count correctly."""
    total_lessons_completed = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ["streak", "total_lessons_completed", "last_active"]

    def get_total_lessons_completed(self, obj):
        """Returns the total number of lessons the user has completed in the current pathway."""
        return obj.completed_lessons.filter(
            learning_goal=obj.user.learning_goal,
            difficulty_level=obj.user.difficulty_level
        ).count()


class StudySessionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)  # ✅ Ensure ID is included in responses
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)  # ✅ Fix lesson title retrieval

    class Meta:
        model = StudySession
        fields = ['id', 'lesson', 'lesson_title', 'date', 'start_time', 'end_time']

    def validate(self, data):
        if data["end_time"] <= data["start_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data
