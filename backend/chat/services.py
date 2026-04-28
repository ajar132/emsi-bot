import google.generativeai as genai
from django.conf import settings

# Configuration globale du SDK Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Prompt système : définit le rôle du bot
SYSTEM_PROMPT = """Tu es EMSI-Bot, l'assistant intelligent des étudiants de l'École Marocaine des Sciences de l'Ingénieur (EMSI).

RÈGLES :
- Réponds dans la langue de la question (français, anglais, ou darija marocaine en lettres latines/arabes).
- Sois concis, pédagogique et amical.
- Pour le code, utilise toujours des blocs markdown ```langage (ex: ```python, ```java).
- Pour les questions administratives EMSI, indique que l'étudiant peut aussi vérifier auprès du secrétariat.
- Si tu ne sais pas, dis-le clairement plutôt que d'inventer.
"""

# Modèle Gemini : flash = rapide et gratuit
MODEL_NAME = "gemini-flash-latest"


def call_gemini(user_message: str, history: list[dict] | None = None) -> dict:
    """
    Appelle Gemini avec le message courant et l'historique.

    Args:
        user_message: la nouvelle question de l'utilisateur
        history: liste de messages précédents au format [{"role": "user"|"model", "parts": ["..."]}]

    Returns:
        {"text": str, "tokens_used": int}
    """
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
    )

    chat = model.start_chat(history=history or [])
    response = chat.send_message(user_message)

    # Extraction du nombre de tokens (utilisé pour les stats)
    tokens = 0
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        tokens = response.usage_metadata.total_token_count

    return {"text": response.text, "tokens_used": tokens}


def build_history_from_messages(messages) -> list[dict]:
    """Convertit notre QuerySet Message vers le format attendu par Gemini."""
    history = []
    for msg in messages:
        # Gemini utilise "user" et "model" (pas "assistant")
        role = "user" if msg.role == "USER" else "model"
        history.append({"role": role, "parts": [msg.content]})
    return history