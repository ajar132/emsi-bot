from django.contrib import admin
from .models import CodeExecution

@admin.register(CodeExecution)
class CodeExecutionAdmin(admin.ModelAdmin):
    list_display = ("user", "language", "exit_code", "exec_time_ms", "created_at")
    list_filter = ("language",)
    search_fields = ("user__email",)