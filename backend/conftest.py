import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from chat.models import Conversation, Message
from knowledge.models import FAQEntry

User = get_user_model()


# ============== Users ==============

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email="student@emsi-edu.ma",
        password="Test1234!",
        first_name="Stu",
        last_name="Dent",
        role="STUDENT",
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@emsi-edu.ma",
        password="Test1234!",
        first_name="Adm",
        last_name="In",
        role="ADMIN",
    )


# ============== Clients API ==============

@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def auth_student(api, student_user):
    """Client authentifié en tant qu'étudiant."""
    refresh = RefreshToken.for_user(student_user)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api


@pytest.fixture
def auth_admin(api, admin_user):
    """Client authentifié en tant qu'admin."""
    refresh = RefreshToken.for_user(admin_user)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api


# ============== Données métier ==============

@pytest.fixture
def conversation(student_user):
    return Conversation.objects.create(user=student_user, title="Test conv")


@pytest.fixture
def faq_wifi(db):
    """FAQ sur le WiFi avec un embedding factice."""
    return FAQEntry.objects.create(
        question="Comment se connecter au WiFi ?",
        answer="Le WiFi `EMSI-Etudiants` s'utilise avec ton identifiant institutionnel.",
        category="infrastructure",
        embedding=[0.1] * 768,  # vecteur factice mais valide
    )


# ============== Mocks Gemini & Piston ==============

@pytest.fixture
def mock_gemini_chat(mocker):
    """Mocke call_gemini là où ChatView l'appelle."""
    return mocker.patch(
        "chat.views.call_gemini",  # ← changé : .views au lieu de .services
        return_value={"text": "Réponse mockée du LLM.", "tokens_used": 42},
    )


@pytest.fixture
def mock_embedding(mocker):
    """Mocke get_embedding dans les 2 modules qui l'utilisent."""
    fake = mocker.patch("chat.services.get_embedding", return_value=[0.1] * 768)
    mocker.patch("knowledge.services.get_embedding", return_value=[0.1] * 768)
    return fake


@pytest.fixture
def mock_piston(mocker):
    """Mocke execute_code là où ExecuteView l'appelle."""
    return mocker.patch(
        "runner.views.execute_code",  # ← changé : .views au lieu de .services
        return_value={
            "stdout": "Hello mock\n",
            "stderr": "",
            "exit_code": 0,
            "exec_time_ms": 0,
            "compile_output": "",
        },
    )