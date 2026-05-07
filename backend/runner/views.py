from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from chat.models import Message
from .models import CodeExecution
from .serializers import ExecuteRequestSerializer, CodeExecutionSerializer
from .services import execute_code, PistonError


# Rate limit : 20 exécutions par fenêtre de 10 minutes par user
MAX_EXECS_PER_WINDOW = 20
WINDOW_SECONDS = 600


class ExecuteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ExecuteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Rate limit
        cache_key = f"exec_count:{request.user.id}"
        count = cache.get(cache_key, 0)
        if count >= MAX_EXECS_PER_WINDOW:
            return Response(
                {"detail": f"Trop d'exécutions. Réessaye dans quelques minutes (limite: {MAX_EXECS_PER_WINDOW}/{WINDOW_SECONDS//60} min)."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # 2. Vérifie que le message_id éventuel appartient bien au user
        message = None
        if data.get("message_id"):
            message = Message.objects.filter(
                id=data["message_id"],
                conversation__user=request.user,
            ).first()

        # 3. Appel Piston
        try:
            result = execute_code(data["language"], data["code"], data.get("stdin", ""))
        except PistonError as e:
            return Response({"detail": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # 4. Persiste l'exécution
        execution = CodeExecution.objects.create(
            user=request.user,
            message=message,
            language=data["language"],
            code=data["code"],
            stdin=data.get("stdin", ""),
            stdout=result["stdout"],
            stderr=result["stderr"] + (("\n" + result["compile_output"]) if result["compile_output"] else ""),
            exit_code=result["exit_code"],
            exec_time_ms=result["exec_time_ms"],
        )

        # 5. Incrémente le compteur de rate limit
        cache.set(cache_key, count + 1, timeout=WINDOW_SECONDS)

        return Response({
            "execution": CodeExecutionSerializer(execution).data,
            "rate_limit": {
                "remaining": MAX_EXECS_PER_WINDOW - (count + 1),
                "reset_in_seconds": WINDOW_SECONDS,
            },
        }, status=status.HTTP_201_CREATED)