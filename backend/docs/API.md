EMSI-Bot — Documentation API (v0.4)

Backend : Django 5 + DRF + SimpleJWT
LLM : Google Gemini (gemini-flash-latest)
Embeddings : Google text-embedding-004 (768 dim) — à venir étape 5
Auth : JWT Bearer (header Authorization: Bearer <access_token>)
Base URL (dev) : http://127.0.0.1:8000


🔐 Authentification
POST /api/auth/register/
Crée un nouveau compte étudiant.

Auth : non
Body :

json{
  "email": "ahmed@emsi-edu.ma",
  "password": "MotDePasse123",
  "password_confirm": "MotDePasse123",
  "first_name": "Ahmed",
  "last_name": "El Alami"
}

Réponse 201 :

json{
  "id": "uuid",
  "email": "ahmed@emsi-edu.ma",
  "first_name": "Ahmed",
  "last_name": "El Alami",
  "role": "STUDENT",
  "date_joined": "2026-04-28T14:00:00Z"
}

Erreurs : 400 (validation : email déjà pris, mots de passe différents, etc.)


POST /api/auth/login/
Authentifie l'utilisateur, retourne les tokens JWT.

Auth : non
Body :

json{ "email": "ahmed@emsi-edu.ma", "password": "MotDePasse123" }

Réponse 200 :

json{
  "access": "eyJhbGciOiJIUzI1...",
  "refresh": "eyJhbGciOiJIUzI1...",
  "user": { "id": "...", "email": "...", "role": "STUDENT", "first_name": "...", "last_name": "..." }
}

Durée : access = 24h, refresh = 30j
Erreurs : 401 (identifiants invalides)


POST /api/auth/refresh/
Renouvelle l'access token avec le refresh token.

Auth : non
Body : { "refresh": "..." }
Réponse 200 : { "access": "...", "refresh": "..." } (nouveaux tokens)


GET /api/auth/me/  ·  PATCH /api/auth/me/
Profil de l'utilisateur connecté.

Auth : ✅ Bearer
GET : retourne { id, email, first_name, last_name, role, date_joined }
PATCH body : { "first_name": "...", "last_name": "..." }


💬 Conversations
GET /api/conversations/
Liste les conversations de l'utilisateur (résumé sans messages).

Auth : ✅ Bearer
Réponse 200 :

json[
  {
    "id": "uuid",
    "title": "Pointeurs en C",
    "is_favorite": false,
    "message_count": 4,
    "created_at": "2026-04-28T14:00:00Z",
    "updated_at": "2026-04-28T14:05:00Z"
  }
]
POST /api/conversations/
Crée une conversation vide.

Auth : ✅ Bearer
Body : { "title": "..." } (optionnel)

GET /api/conversations/{id}/
Détail d'une conversation avec ses messages.

Auth : ✅ Bearer
Réponse 200 :

json{
  "id": "uuid",
  "title": "Pointeurs en C",
  "is_favorite": false,
  "messages": [
    { "id": "...", "role": "USER", "content": "...", "source": "", "tokens_used": 0, "created_at": "..." },
    { "id": "...", "role": "ASSISTANT", "content": "...", "source": "LLM", "tokens_used": 145, "created_at": "..." }
  ],
  "created_at": "...",
  "updated_at": "..."
}
PATCH /api/conversations/{id}/
Renomme ou favorise une conversation.

Auth : ✅ Bearer
Body : { "title": "...", "is_favorite": true }

DELETE /api/conversations/{id}/
Supprime la conversation et tous ses messages (CASCADE).

Auth : ✅ Bearer
Réponse : 204 No Content


🤖 Chat (Gemini)
POST /api/chat/
Envoie un message au bot et reçoit la réponse.

Auth : ✅ Bearer
Body :

json{
  "conversation_id": "uuid-optionnel",
  "content": "Explique-moi les pointeurs en C"
}

Si conversation_id est omis → une nouvelle conversation est créée automatiquement
content : 2000 caractères max
Réponse 201 :

json{
  "conversation_id": "uuid",
  "user_message": {
    "id": "...", "role": "USER", "content": "Explique-moi les pointeurs en C",
    "source": "", "tokens_used": 0, "created_at": "..."
  },
  "assistant_message": {
    "id": "...", "role": "ASSISTANT", "content": "Un pointeur en C est...",
    "source": "LLM", "tokens_used": 245, "created_at": "..."
  }
}

Champ source :

"" (vide) sur les messages USER
"FAQ" : réponse trouvée dans la base FAQ (étape 5)
"LLM" : réponse générée par Gemini
"HYBRID" : réponse Gemini avec contexte FAQ (étape 5)


Erreurs :

400 : content manquant ou trop long
404 : conversation_id invalide ou n'appartient pas à l'utilisateur
503 : erreur Gemini (quota, indisponibilité)




⚙️ Configuration côté Frontend
javascript// Constantes
const API_BASE = "http://127.0.0.1:8000";

// Helper pour les appels authentifiés
async function apiCall(path, options = {}) {
  const access = localStorage.getItem("access");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(access && { Authorization: `Bearer ${access}` }),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    // tenter un refresh, sinon rediriger vers /login
  }
  return res.json();
}

// Exemple : envoyer un message
const data = await apiCall("/api/chat/", {
  method: "POST",
  body: JSON.stringify({ content: "Salut !", conversation_id: currentConvId }),
});

📋 Codes HTTP utilisés
CodeSignification200OK201Created204No Content (suppression réussie)400Bad Request (validation)401Unauthorized (token absent ou invalide)403Forbidden (rôle insuffisant)404Not Found429Too Many Requests (rate limit, à venir)503Service Unavailable (Gemini KO)

🗓 Historique des versions
VersionDateChangements0.12026-04-27Setup Django + 5 apps0.22026-04-28Modèles métier (Conversation, Message, FAQEntry, CodeExecution, AuditLog)0.32026-04-28Authentification JWT (register, login, refresh, me)0.42026-04-28Endpoint chat + intégration Gemini (gemini-flash-latest)0.5 (à venir)—Recherche FAQ vectorielle + routage hybride0.6 (à venir)—Endpoint exécution de code (Piston)

## 📊 Admin

### `GET /api/admin/stats/?period=7d|24h|30d|all`
Tableau de bord statistique pour les administrateurs.

- **Auth** : ✅ Bearer (rôle ADMIN ou SUPER_ADMIN)
- **Query param** : `period` parmi `24h`, `7d` (défaut), `30d`, `all`
- **Réponse 200** : objet avec `users`, `conversations`, `messages` (dont `savings_pct` et `by_source`), `faq.top_10`, `code_executions`
- **Erreur 403** : utilisateur sans rôle admin