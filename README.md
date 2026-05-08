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

## 🚀 Démarrage rapide

### Backend (Django)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env            # puis remplir GEMINI_API_KEY
python manage.py migrate
python manage.py seed_faq
python manage.py runserver      # → http://127.0.0.1:8000
```

### Frontend (React)

> **Prérequis** : Node.js 18+ installé sur votre machine.

```bash
cd frontend
npm install     # à faire UNE SEULE FOIS après le clone
npm run dev     # → http://localhost:5173
```

Le frontend se connecte automatiquement au backend sur `http://127.0.0.1:8000`.  
Assurez-vous que le backend tourne **avant** d'ouvrir le frontend.

## 📚 Documentation

- **API REST** : voir `backend/docs/API.md`

## 🧪 Tests

```bash
cd backend
pytest --cov=. --cov-report=term-missing
```

Couverture actuelle : **90%**.