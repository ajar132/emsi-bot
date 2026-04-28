from django.db import models
from django.conf import settings
from core.models import TimestampedModel


class FAQEntry(TimestampedModel):
    question = models.TextField()
    answer = models.TextField(help_text="Réponse en markdown")
    category = models.CharField(max_length=100, blank=True)
    # ⚠️ Stockage temporaire en JSON. Migrera vers VectorField (pgvector) en étape 5.
    embedding = models.JSONField(null=True, blank=True)
    hit_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="faq_entries"
    )

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Entrée FAQ"
        verbose_name_plural = "Entrées FAQ"

    def __str__(self):
        return self.question[:80]