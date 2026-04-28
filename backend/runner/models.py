from django.db import models
from django.conf import settings
from core.models import TimestampedModel


class CodeExecution(TimestampedModel):
    class Language(models.TextChoices):
        PYTHON = "python", "Python"
        JAVASCRIPT = "javascript", "JavaScript"
        TYPESCRIPT = "typescript", "TypeScript"
        JAVA = "java", "Java"
        C = "c", "C"
        CPP = "cpp", "C++"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="code_executions")
    message = models.ForeignKey("chat.Message", on_delete=models.CASCADE, related_name="executions", null=True, blank=True)
    language = models.CharField(max_length=20, choices=Language.choices)
    code = models.TextField()
    stdin = models.TextField(blank=True)
    stdout = models.TextField(blank=True)
    stderr = models.TextField(blank=True)
    exit_code = models.IntegerField(null=True, blank=True)
    exec_time_ms = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.language} • exit={self.exit_code} • {self.user.email}"

    @property
    def success(self) -> bool:
        return self.exit_code == 0