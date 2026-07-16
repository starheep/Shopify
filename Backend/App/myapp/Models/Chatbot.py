from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField

import uuid


# API Key Storage
class UserAPIKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='api_keys')
    gemini_key = models.CharField(max_length=255, blank=True, null=True)
    groq_key = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s API Keys"

# Chat Session
class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=255, default="New Conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"

# Individual Messages
class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10)  # 'user' or 'model'
    text = models.TextField(blank=True, null=True)
    structured_data = JSONField(blank=True, null=True) # To store the interactive Product JSON!
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
