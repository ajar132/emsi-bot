# EMSI-Bot

Chatbot intelligent pour les étudiants de l'EMSI.
Système hybride FAQ + LLM (Google Gemini) avec exécution de code.

## 🏗️ Architecture

- **Backend** : Django 5 + DRF (dossier `backend/`)
- **Frontend** : React + Vite + Tailwind (dossier `frontend/` — à venir)
- **LLM** : Google Gemini (`gemini-flash-latest`)
- **Embeddings** : Google `text-embedding-004` (768 dim)
- **Sandbox** : Piston via Docker

## 👥 Équipe

- **EL MAHDI BAKIROU** — Chef de projet & Backend Django
- **ZIAD EL YOUSFI** — Frontend & UX
- **YASSINE ZAIDANY** — DevOps & Données

## 🚀 Démarrage rapide (backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env            # puis remplir GEMINI_API_KEY
python manage.py migrate
python manage.py seed_faq
python manage.py runserver
```

## 📚 Documentation

- **API REST** : voir `backend/docs/API.md`
- **Cahier des charges** : voir `docs/CDC.pdf`

## 🧪 Tests

```bash
cd backend
pytest --cov=. --cov-report=term-missing
```

Couverture actuelle : **90%**.