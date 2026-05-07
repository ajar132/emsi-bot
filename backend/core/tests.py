import pytest
from chat.models import Conversation, Message


pytestmark = pytest.mark.django_db


class TestAdminStats:
    def test_stats_requires_auth(self, api):
        response = api.get("/api/admin/stats/")
        assert response.status_code == 401

    def test_stats_blocks_student(self, auth_student):
        response = auth_student.get("/api/admin/stats/")
        assert response.status_code == 403

    def test_stats_returns_kpis_for_admin(self, auth_admin, admin_user):
        # Crée des données
        conv = Conversation.objects.create(user=admin_user, title="X")
        Message.objects.create(conversation=conv, role="ASSISTANT",
                               content="r1", source="FAQ", tokens_used=0)
        Message.objects.create(conversation=conv, role="ASSISTANT",
                               content="r2", source="LLM", tokens_used=100)

        response = auth_admin.get("/api/admin/stats/?period=all")
        assert response.status_code == 200
        assert response.data["messages"]["by_source"]["FAQ"] == 1
        assert response.data["messages"]["by_source"]["LLM"] == 1
        assert response.data["messages"]["savings_pct"] == 50.0