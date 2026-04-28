from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "role", "content", "source", "tokens_used", "created_at")
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    """Liste/résumé sans les messages (léger)."""
    message_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "title", "is_favorite", "message_count", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at", "message_count")


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Conversation avec tous ses messages (pour le détail)."""
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "title", "is_favorite", "messages", "created_at", "updated_at")
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    """Payload d'envoi d'un message."""
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    content = serializers.CharField(max_length=2000)