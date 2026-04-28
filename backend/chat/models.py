from django.db import models
from django.conf import settings
from core.models import TimestampedModel


class Conversation(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations")
    title = models.CharField(max_length=200, default="Nouvelle conversation")
    is_favorite = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["user", "-updated_at"])]

    def __str__(self):
        return f"{self.title} ({self.user.email})"


class Message(TimestampedModel):
    class Role(models.TextChoices):
        USER = "USER", "Utilisateur"
        ASSISTANT = "ASSISTANT", "Assistant"

    class Source(models.TextChoices):
        FAQ = "FAQ", "FAQ"
        LLM = "LLM", "LLM"
        HYBRID = "HYBRID", "Hybride (FAQ + LLM)"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    source = models.CharField(max_length=20, choices=Source.choices, blank=True)
    faq_entry = models.ForeignKey(
        "knowledge.FAQEntry", on_delete=models.SET_NULL, null=True, blank=True, related_name="messages"
    )
    tokens_used = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]

    def __str__(self):
        return f"[{self.role}] {self.content[:60]}"