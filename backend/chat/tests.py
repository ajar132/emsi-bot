import pytest
from chat.models import Conversation, Message
from knowledge.services import route_query


pytestmark = pytest.mark.django_db


class TestChatEndpoint:
    def test_chat_requires_auth(self, api):
        response = api.post("/api/chat/", {"content": "Hello"}, format="json")
        assert response.status_code == 401

    def test_chat_creates_conversation(self, auth_student, mock_gemini_chat, mock_embedding):
        response = auth_student.post("/api/chat/",
            {"content": "Test question"}, format="json")
        assert response.status_code == 201
        assert response.data["assistant_message"]["content"] == "Réponse mockée du LLM."
        assert Conversation.objects.count() == 1
        assert Message.objects.count() == 2  # user + assistant

    def test_chat_continues_conversation(self, auth_student, conversation,
                                          mock_gemini_chat, mock_embedding):
        response = auth_student.post("/api/chat/",
            {"content": "Suite", "conversation_id": str(conversation.id)},
            format="json")
        assert response.status_code == 201
        assert response.data["conversation_id"] == str(conversation.id)
        assert conversation.messages.count() == 2

    def test_chat_validates_content_length(self, auth_student):
        response = auth_student.post("/api/chat/",
            {"content": "x" * 3000}, format="json")
        assert response.status_code == 400


class TestConversationViewSet:
    def test_list_only_own_conversations(self, auth_student, student_user, admin_user):
        Conversation.objects.create(user=student_user, title="Mine")
        Conversation.objects.create(user=admin_user, title="Other's")
        response = auth_student.get("/api/conversations/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Mine"

    def test_cannot_access_others_conversation(self, auth_student, admin_user):
        other_conv = Conversation.objects.create(user=admin_user, title="Other's")
        response = auth_student.get(f"/api/conversations/{other_conv.id}/")
        assert response.status_code == 404


class TestRouting:
    def test_routes_llm_only_when_no_faq(self, mocker):
        mocker.patch("chat.services.get_embedding", return_value=[0.0] * 768)
        result = route_query("Question hors FAQ")
        assert result["strategy"] == "LLM_ONLY"

    def test_routes_direct_faq_above_threshold(self, faq_wifi, mocker):
        mocker.patch("chat.services.get_embedding", return_value=[0.1] * 768)
        # mocke aussi cosine_similarity pour forcer un score haut
        mocker.patch("knowledge.services.cosine_similarity", return_value=0.95)
        result = route_query("Question proche FAQ WiFi")
        assert result["strategy"] == "DIRECT_FAQ"
        assert result["faq"] == faq_wifi
        # hit_count incrémenté
        faq_wifi.refresh_from_db()
        assert faq_wifi.hit_count == 1

    def test_routes_llm_with_context_in_grey_zone(self, faq_wifi, mocker):
        mocker.patch("chat.services.get_embedding", return_value=[0.1] * 768)
        mocker.patch("knowledge.services.cosine_similarity", return_value=0.78)
        result = route_query("Question semi-proche")
        assert result["strategy"] == "LLM_WITH_CONTEXT"