# ResumeIQ

AI-powered resume analysis platform.

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React + Tailwind CSS + Axios     |
| Backend  | Python FastAPI + SQLite + PyMuPDF|
| AI       | Groq API (LLM)                   |
| Infra    | Docker + Docker Compose          |

## Project Structure

```
ResumeIQ/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI entry point
│   │   ├── database.py      # SQLite connection helper
│   │   ├── models.py        # Pydantic models
│   │   ├── routes.py        # API routes
│   │   └── services.py      # Business logic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js            # Axios instance
│   │   ├── App.jsx           # Root component
│   │   ├── index.css         # Tailwind imports
│   │   └── main.jsx          # React entry point
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Run

```bash
# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
