from django.contrib import admin
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "is_favorite", "updated_at")
    list_filter = ("is_favorite",)
    search_fields = ("title", "user__email")

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("role", "source", "conversation", "created_at")
    list_filter = ("role", "source")
    search_fields = ("content",)