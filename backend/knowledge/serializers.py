from rest_framework import serializers
from .models import FAQEntry


class FAQEntrySerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = FAQEntry
        fields = [
            'id', 'question', 'answer', 'category',
            'hit_count', 'created_by_email', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'hit_count', 'created_by_email', 'created_at', 'updated_at']
