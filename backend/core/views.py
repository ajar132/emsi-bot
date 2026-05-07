from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from accounts.permissions import IsAdmin
from chat.models import Conversation, Message
from knowledge.models import FAQEntry
from runner.models import CodeExecution

User = get_user_model()


PERIOD_DAYS = {"24h": 1, "7d": 7, "30d": 30, "all": None}


class AdminStatsView(APIView):
    """GET /api/admin/stats/?period=7d  →  KPIs pour le dashboard admin."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        period = request.query_params.get("period", "7d")
        days = PERIOD_DAYS.get(period, 7)
        now = timezone.now()
        since = now - timedelta(days=days) if days else None

        # Filtre par période (None = pas de filtre)
        def in_period(qs, field="created_at"):
            return qs.filter(**{f"{field}__gte": since}) if since else qs

        # ----- USERS -----
        users_total = User.objects.count()
        users_new = in_period(User.objects.all(), "date_joined").count()
        users_active = in_period(Message.objects.values("conversation__user").distinct()).count()

        # ----- MESSAGES -----
        msgs_qs = in_period(Message.objects.all())
        msgs_total = msgs_qs.count()
        msgs_assistant = msgs_qs.filter(role=Message.Role.ASSISTANT)

        msgs_by_source = {
            "FAQ":    msgs_assistant.filter(source=Message.Source.FAQ).count(),
            "LLM":    msgs_assistant.filter(source=Message.Source.LLM).count(),
            "HYBRID": msgs_assistant.filter(source=Message.Source.HYBRID).count(),
        }
        total_assistant = sum(msgs_by_source.values()) or 1  # éviter /0
        savings_pct = round(
            100 * (msgs_by_source["FAQ"]) / total_assistant, 1
        )

        avg_tokens_llm = msgs_assistant.exclude(source=Message.Source.FAQ).aggregate(
            v=Avg("tokens_used")
        )["v"] or 0

        # ----- CONVERSATIONS -----
        convs_total = Conversation.objects.count()
        convs_in_period = in_period(Conversation.objects.all()).count()

        # ----- FAQ -----
        faq_total = FAQEntry.objects.count()
        faq_with_embedding = FAQEntry.objects.exclude(embedding__isnull=True).count()
        top_faqs = list(
            FAQEntry.objects.order_by("-hit_count")[:10].values("id", "question", "hit_count", "category")
        )

        # ----- CODE EXECUTIONS -----
        exec_qs = in_period(CodeExecution.objects.all())
        exec_total = exec_qs.count()
        exec_by_lang = list(
            exec_qs.values("language").annotate(count=Count("id")).order_by("-count")
        )
        exec_success_rate = (
            round(100 * exec_qs.filter(exit_code=0).count() / exec_total, 1)
            if exec_total else 0
        )

        return Response({
            "period": {
                "label": period,
                "since": since.isoformat() if since else None,
                "until": now.isoformat(),
            },
            "users": {
                "total": users_total,
                "new_in_period": users_new,
                "active_in_period": users_active,
            },
            "conversations": {
                "total": convs_total,
                "in_period": convs_in_period,
            },
            "messages": {
                "total_in_period": msgs_total,
                "assistant_total": total_assistant if total_assistant != 1 else sum(msgs_by_source.values()),
                "by_source": msgs_by_source,
                "savings_pct": savings_pct,
                "avg_tokens_llm": round(float(avg_tokens_llm), 1),
            },
            "faq": {
                "total_entries": faq_total,
                "with_embedding": faq_with_embedding,
                "top_10": top_faqs,
            },
            "code_executions": {
                "total_in_period": exec_total,
                "by_language": exec_by_lang,
                "success_rate_pct": exec_success_rate,
            },
        })