from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import FAQEntry
from .services import regenerate_embedding


@receiver(post_save, sender=FAQEntry)
def faq_embedding_on_save(sender, instance: FAQEntry, created, **kwargs):
    """Régénère automatiquement l'embedding quand la question change."""
    # Évite la boucle infinie : si on vient juste de sauver l'embedding lui-même, on saute
    if kwargs.get("update_fields") == {"embedding", "updated_at"}:
        return
    if kwargs.get("update_fields") == {"hit_count"}:
        return
    # Régénère seulement si la question a changé OU à la création
    try:
        regenerate_embedding(instance)
    except Exception as e:
        # On log mais on ne crashe pas la sauvegarde de la FAQ
        print(f"[FAQ embedding] Erreur : {e}")