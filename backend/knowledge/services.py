from knowledge.models import FAQEntry
from chat.services import get_embedding, cosine_similarity


# Seuils de décision (à ajuster empiriquement après tests)
THRESHOLD_HIGH = 0.85   # FAQ directe au-dessus
THRESHOLD_LOW = 0.70    # LLM + contexte FAQ entre LOW et HIGH ; LLM seul en-dessous


def regenerate_embedding(faq: FAQEntry) -> None:
    """Calcule et sauvegarde l'embedding d'une entrée FAQ.
    Appelé à la création/modification d'une FAQ."""
    # On embed la question (la plus discriminante pour la recherche)
    faq.embedding = get_embedding(faq.question)
    faq.save(update_fields=["embedding", "updated_at"])


def find_best_faq(query: str) -> tuple[FAQEntry | None, float]:
    """
    Cherche la FAQ la plus proche d'une question utilisateur.

    Returns:
        (faq_entry, similarity_score) ou (None, 0.0) si aucune FAQ en base
    """
    query_emb = get_embedding(query)
    faqs = FAQEntry.objects.exclude(embedding__isnull=True)

    best_faq = None
    best_score = 0.0
    for faq in faqs:
        score = cosine_similarity(query_emb, faq.embedding)
        if score > best_score:
            best_score = score
            best_faq = faq

    return best_faq, best_score


def route_query(query: str) -> dict:
    """
    Décide quoi faire d'une requête utilisateur :
    - DIRECT_FAQ : on retourne la réponse FAQ telle quelle
    - LLM_WITH_CONTEXT : on appelle le LLM en lui passant la FAQ comme contexte
    - LLM_ONLY : on appelle le LLM sans contexte FAQ
    """
    best_faq, score = find_best_faq(query)

    if best_faq is None or score < THRESHOLD_LOW:
        return {"strategy": "LLM_ONLY", "faq": None, "score": score}

    if score >= THRESHOLD_HIGH:
        # On incrémente le hit_count de la FAQ
        best_faq.hit_count += 1
        best_faq.save(update_fields=["hit_count"])
        return {"strategy": "DIRECT_FAQ", "faq": best_faq, "score": score}

    return {"strategy": "LLM_WITH_CONTEXT", "faq": best_faq, "score": score}