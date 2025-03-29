from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, UserProgress, Lesson, StudySession, LearningPathway, AdminActivityLog
from django.utils import timezone


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
        fields = ["id", "title", "description", "step1_content", "step2_content", "step3_challenge", "code_snippet"]


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


# Admin Serializers
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'is_active', 'date_joined', 'last_login', 'is_staff', 'is_superuser']
        read_only_fields = ['date_joined', 'last_login']


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'learning_goal', 'difficulty_level', 'bio',
            'profile_picture'
        ]
        
    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        UserProgress.objects.get_or_create(user=user)
        
        # Log the admin action
        request = self.context.get('request')
        admin_user = request.user if request else None
        
        if admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='create_user',
                target_user=user,
                action_details=f"Created user {user.username} ({user.email})",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'email', 'role',
            'learning_goal', 'difficulty_level', 'bio',
            'profile_picture', 'is_active'
        ]
        
    def update(self, instance, validated_data):
        # Track user activation/deactivation
        was_active = instance.is_active
        will_be_active = validated_data.get('is_active', was_active)
        action_type = None
        
        if was_active and not will_be_active:
            action_type = 'deactivate_user'
            validated_data['date_deactivated'] = timezone.now()
        elif not was_active and will_be_active:
            action_type = 'activate_user'
            validated_data['date_deactivated'] = None
        
        # Update the user
        user = super().update(instance, validated_data)
        
        # Log the admin action
        request = self.context.get('request')
        admin_user = request.user if request else None
        
        if admin_user and admin_user.is_admin and action_type:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type=action_type,
                target_user=user,
                action_details=f"{'Deactivated' if action_type == 'deactivate_user' else 'Activated'} user {user.username}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        elif admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='edit_user',
                target_user=user,
                action_details=f"Updated user {user.username}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return user


class LearningPathwaySerializer(serializers.ModelSerializer):
    lessons_count = serializers.SerializerMethodField()
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    
    class Meta:
        model = LearningPathway
        fields = [
            'id', 'name', 'code', 'description', 'icon', 
            'created_by', 'created_by_username', 'created_at', 
            'updated_at', 'is_active', 'lessons_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()
    
    def create(self, validated_data):
        # Set created_by from request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            
        pathway = super().create(validated_data)
        
        # Log the admin action
        admin_user = request.user if request else None
        if admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='create_pathway',
                target_pathway=pathway,
                action_details=f"Created pathway: {pathway.name}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return pathway
    
    def update(self, instance, validated_data):
        pathway = super().update(instance, validated_data)
        
        # Log the admin action
        request = self.context.get('request')
        admin_user = request.user if request else None
        
        if admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='edit_pathway',
                target_pathway=pathway,
                action_details=f"Updated pathway: {pathway.name}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return pathway


class AdminLessonSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    learning_pathway_name = serializers.ReadOnlyField(source='learning_pathway.name')
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'step1_content', 'step2_content', 
            'step3_challenge', 'difficulty_level', 'learning_goal', 'order',
            'code_snippet', 'expected_output', 'created_by', 'created_by_username',
            'created_at', 'updated_at', 'is_published', 'learning_pathway',
            'learning_pathway_name'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set created_by from request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            
        lesson = super().create(validated_data)
        
        # Log the admin action
        admin_user = request.user if request else None
        if admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='create_lesson',
                target_lesson=lesson,
                action_details=f"Created lesson: {lesson.title}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return lesson
    
    def update(self, instance, validated_data):
        lesson = super().update(instance, validated_data)
        
        # Log the admin action
        request = self.context.get('request')
        admin_user = request.user if request else None
        
        if admin_user and admin_user.is_admin:
            AdminActivityLog.objects.create(
                admin_user=admin_user,
                action_type='edit_lesson',
                target_lesson=lesson,
                action_details=f"Updated lesson: {lesson.title}",
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
        
        return lesson


class AdminActivityLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.ReadOnlyField(source='admin_user.username')
    target_name = serializers.SerializerMethodField()
    action_name = serializers.ReadOnlyField(source='get_action_type_display')
    
    class Meta:
        model = AdminActivityLog
        fields = [
            'id', 'admin_user', 'admin_username', 'action_type', 
            'action_name', 'target_user', 'target_lesson', 'target_pathway',
            'target_name', 'action_details', 'ip_address', 'timestamp'
        ]
        read_only_fields = fields
    
    def get_target_name(self, obj):
        if obj.target_user:
            return obj.target_user.username
        elif obj.target_lesson:
            return obj.target_lesson.title
        elif obj.target_pathway:
            return obj.target_pathway.name
        return "Unknown"
