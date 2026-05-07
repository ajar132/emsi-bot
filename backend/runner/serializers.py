from rest_framework import serializers
from .models import CodeExecution
from .services import LANGUAGE_VERSIONS


class ExecuteRequestSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=list(LANGUAGE_VERSIONS.keys()))
    code = serializers.CharField(max_length=10_000)  # 10 Ko max
    stdin = serializers.CharField(required=False, allow_blank=True, default="", max_length=4_000)
    message_id = serializers.UUIDField(required=False, allow_null=True)


class CodeExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeExecution
        fields = (
            "id", "language", "code", "stdout", "stderr",
            "exit_code", "exec_time_ms", "created_at",
        )
        read_only_fields = fields