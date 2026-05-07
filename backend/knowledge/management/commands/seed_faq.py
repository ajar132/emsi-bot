from django.core.management.base import BaseCommand
from knowledge.models import FAQEntry


SEED_DATA = [
    ("Quels sont les horaires de la scolarité de l'EMSI ?",
     "Le service scolarité est ouvert du lundi au vendredi de 9h à 17h, fermé le week-end.",
     "scolarité"),
    ("Comment se connecter au WiFi de l'école ?",
     "Le WiFi `EMSI-Etudiants` est accessible avec ton identifiant institutionnel (numéro étudiant) et le mot de passe fourni à la rentrée.",
     "infrastructure"),
    ("Quand sont les vacances de fin d'année ?",
     "Les vacances de fin d'année commencent généralement la 3ème semaine de décembre et durent 2 semaines. Vérifie le calendrier officiel sur le portail étudiant.",
     "calendrier"),
    ("Comment récupérer mon relevé de notes ?",
     "Tu peux télécharger ton relevé de notes depuis ton espace personnel sur le portail étudiant, rubrique « Mes notes ». Pour un document signé, passe au secrétariat.",
     "scolarité"),
    ("Quelle est la procédure pour un stage ?",
     "1) Trouver une entreprise d'accueil. 2) Faire valider le sujet par ton responsable pédagogique. 3) Signer une convention de stage tripartite (étudiant, école, entreprise). 4) Soumettre le rapport et soutenir à la fin.",
     "stages"),
    ("Comment changer mon mot de passe étudiant ?",
     "Va sur le portail étudiant, rubrique « Mon compte » → « Changer le mot de passe ». Si tu l'as oublié, contacte le service informatique.",
     "infrastructure"),
    ("Quels sont les modes de paiement des frais de scolarité ?",
     "Tu peux payer par virement bancaire, chèque, ou en espèces au guichet de l'école. Un échéancier est possible sur demande au service comptabilité.",
     "scolarité"),
]


class Command(BaseCommand):
    help = "Crée des entrées FAQ de démonstration"

    def handle(self, *args, **options):
        created = 0
        for question, answer, category in SEED_DATA:
            obj, was_created = FAQEntry.objects.get_or_create(
                question=question,
                defaults={"answer": answer, "category": category},
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"✓ Créé : {question[:60]}"))
            else:
                self.stdout.write(self.style.WARNING(f"○ Déjà existant : {question[:60]}"))

        self.stdout.write(self.style.SUCCESS(f"\nTotal : {created} entrées créées."))