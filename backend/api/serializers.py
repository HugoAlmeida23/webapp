from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note
from .models import Fatura


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "author", "fatura_id"]
        extra_kwargs = {
            "author": {"read_only": True},
            "fatura_id": {"required": True},  # Ensure it's required
        }
        
        
class FaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fatura
        fields = '__all__'
        extra_kwargs = {"user": {"read_only": True}}
    
    def validate_IVA6(self, value):
        if value in [None, '', 'null']:
            return None
        return value

    def validate_IVA23(self, value):
        if value in [None, '', 'null']:
            return None
        return value
        