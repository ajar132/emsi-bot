# Brief pour génération de présentation PowerPoint — EMSI-Bot

## Instructions pour Claude Desktop
Génère une présentation PowerPoint professionnelle de 15 slides en français.
- Style : sombre / moderne (fond #0A0A0B ou bleu marine foncé, accents violet #7C3AED)
- Police : titre en gras taille 32-36, contenu taille 18-22
- Chaque slide : 1 titre clair + 4 à 6 points maximum (pas de phrases longues)
- Ajoute des icônes ou formes simples pour illustrer
- Langue : français

---

## Contenu des slides

### Slide 1 — Page de titre
- **Titre principal** : EMSI-Bot
- **Sous-titre** : Assistant Intelligent pour les Étudiants de l'EMSI
- **Détail** : Projet de fin de module — Intelligence Artificielle & Développement Web
- Logo ou icône de robot centré

---

### Slide 2 — Contexte & Problématique
- Les étudiants posent des centaines de questions répétitives (inscriptions, scolarité, calendrier…)
- Le secrétariat est surchargé par des demandes simples
- Besoin d'un assistant disponible 24h/24, 7j/7
- Objectif : automatiser les réponses fréquentes tout en gardant la puissance d'un LLM

---

### Slide 3 — Présentation du projet
- EMSI-Bot est un chatbot intelligent dédié aux étudiants de l'EMSI
- Répond aux questions générales ET aux questions EMSI spécifiques
- Supporte le français, l'anglais et le darija marocain
- Intègre un système FAQ vectoriel + un modèle de langage (Gemini)
- Interface web moderne, responsive, accessible sur mobile et desktop

---

### Slide 4 — Architecture générale
**Schéma en 3 couches :**
1. **Frontend** — React (TypeScript) → interface utilisateur
2. **Backend** — Django REST Framework → API, logique métier
3. **Services externes** — Gemini AI (LLM) + Piston (exécution de code)

Flux : Utilisateur → React → Django API → Routing intelligent → Gemini / FAQ → Réponse

---

### Slide 5 — Technologies utilisées
**Backend :**
- Python / Django 5 + Django REST Framework
- JWT (authentification sécurisée)
- SQLite (dev) / PostgreSQL (prod)
- Google Gemini API (IA générative)

**Frontend :**
- React 18 + TypeScript
- Tailwind CSS (design responsive)
- Framer Motion (animations)
- Monaco Editor (éditeur de code intégré)

---

### Slide 6 — Modèle de données
**5 entités principales :**
- **User** : email, rôle (STUDENT / ADMIN / SUPER_ADMIN)
- **Conversation** : titre, favoris, lié à un utilisateur
- **Message** : contenu, rôle (USER/ASSISTANT), source (FAQ/LLM/HYBRID), tokens
- **FAQEntry** : question, réponse, catégorie, embedding vectoriel, compteur de hits
- **CodeExecution** : langage, code, stdout, stderr, temps d'exécution

---

### Slide 7 — Système de routage intelligent (FAQ)
**Comment le bot choisit sa réponse :**

1. La question de l'étudiant est transformée en vecteur (embedding Gemini)
2. Comparaison par similarité cosinus avec toutes les FAQ en base
3. **3 stratégies selon le score :**
   - Score > 0.85 → **Réponse FAQ directe** (rapide, précise)
   - Score 0.70–0.85 → **LLM + contexte FAQ** (réponse enrichie)
   - Score < 0.70 → **LLM seul** (question libre)

---

### Slide 8 — Interface de chat
**Fonctionnalités principales :**
- Historique des conversations dans une sidebar
- Messages avec badge source (FAQ 🟣 / Gemini 🔵 / Hybrid 🟡)
- Blocs de code avec coloration syntaxique (Monaco Editor)
- Exécution de code directement dans le chat (Python, Java, C++…)
- Commandes rapides : `/code`, `/explique`, `/résume`, `/exercice`
- Design responsive (desktop + mobile)

---

### Slide 9 — Exécution de code intégrée
- Chaque bloc de code généré est exécutable en un clic
- Sandbox sécurisé via **Piston** (isolation complète)
- Langages supportés : Python, Java, JavaScript, TypeScript, C, C++
- Champ stdin pour les programmes interactifs
- Affichage séparé : stdout (vert) et stderr (rouge)
- Rate limiting : 20 exécutions / 10 minutes par utilisateur

---

### Slide 10 — Authentification & Rôles
**Système sécurisé basé sur JWT :**
- Tokens d'accès (24h) + refresh tokens (30 jours)
- 3 rôles distincts :
  - **STUDENT** : accès au chat uniquement
  - **ADMIN** : accès chat + panneau d'administration FAQ
  - **SUPER_ADMIN** : tous les droits
- Routes protégées côté frontend ET côté backend
- Rehydratation automatique du profil au chargement

---

### Slide 11 — Panneau d'administration FAQ
**Interface réservée aux admins :**
- Liste de toutes les entrées FAQ avec recherche en temps réel
- Créer / modifier / supprimer des entrées FAQ
- Chaque modification régénère automatiquement l'embedding vectoriel
- Catégorisation des questions (Scolarité, Inscriptions, etc.)
- Statistiques : nombre de fois qu'une FAQ a été utilisée (hit count)

---

### Slide 12 — Déploiement
**Conteneurisation avec Docker :**
- Service **backend** : Django + Daphne (ASGI)
- Service **frontend** : Nginx servant le build React
- Service **db** : PostgreSQL 16
- Service **piston** : sandbox d'exécution de code

Commande unique pour lancer tout le projet :
```
docker compose up
```

---

### Slide 13 — Sécurité & Performance
- Authentification JWT avec refresh automatique
- CORS configuré (origines autorisées uniquement)
- Rate limiting sur l'exécution de code (anti-abus)
- Embeddings pré-calculés (pas de recalcul à chaque requête)
- Réponses FAQ directes : < 100ms (pas d'appel LLM)
- Isolation des exécutions de code (sandbox Piston)

---

### Slide 14 — Résultats & Démonstration
**Ce que le bot sait faire :**
- Répondre aux questions EMSI (scolarité, inscriptions, dates importantes)
- Expliquer des concepts informatiques et mathématiques
- Générer, expliquer et exécuter du code dans 6 langages
- Résumer des cours, créer des exercices
- Maintenir le contexte sur 16 messages d'historique

**Langues supportées :** Français · Anglais · Darija marocaine

---

### Slide 15 — Perspectives & Améliorations futures
- **WebSocket** : réponses en streaming temps réel (infrastructure prête avec Django Channels)
- **pgvector** : migration vers une vraie base vectorielle pour la recherche FAQ
- **Redis** : cache distribué pour le rate limiting en production
- **Multimédia** : support des images et fichiers PDF dans le chat
- **Analytics** : tableau de bord des questions les plus posées
- **Application mobile** : version React Native

---

### Slide 16 — Conclusion
- EMSI-Bot répond à un besoin réel des étudiants de l'EMSI
- Architecture moderne, scalable et sécurisée
- Combinaison intelligente FAQ + LLM pour des réponses précises
- Interface soignée accessible sur tous les appareils
- Projet extensible grâce à une architecture modulaire

**Merci pour votre attention — Questions ?**

---

## Notes de design pour Claude Desktop
- Slide 4 : faire un vrai schéma d'architecture avec des boîtes et des flèches
- Slide 7 : faire un diagramme de décision (arbre ou flowchart) pour le routing
- Slide 12 : afficher les 4 services Docker sous forme de cartes côte à côte
- Couleurs suggérées : fond sombre (#0F0F14), accent violet (#7C3AED), texte blanc, badges colorés
- Ajouter le nom "EMSI-Bot" et une petite icône robot sur chaque slide (coin bas gauche ou header)
