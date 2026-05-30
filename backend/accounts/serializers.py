import re
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ("id", "email", "password", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("Email must be a non-empty string.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value.lower()

    def validate_password(self, value):
        """Validate password strength"""
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("Password must be a non-empty string.")
        
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one uppercase letter, one lowercase letter, and one digit
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)
