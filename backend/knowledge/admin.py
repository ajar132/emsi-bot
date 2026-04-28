from django.contrib import admin
from .models import FAQEntry

@admin.register(FAQEntry)
class FAQEntryAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "hit_count", "updated_at")
    list_filter = ("category",)
    search_fields = ("question", "answer")