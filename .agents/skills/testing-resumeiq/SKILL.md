---
name: testing-resumeiq
description: Test the ResumeIQ full-stack app end-to-end. Use when verifying scaffold, backend API, or frontend UI changes.
---

# Testing ResumeIQ

## Prerequisites
- Docker and Docker Compose must be available on the machine.
- No external API keys are needed for scaffold/boilerplate testing. The `GROQ_API_KEY` env var is only required when AI features are implemented.

## Start the App

```bash
cd /home/ubuntu/repos/ResumeIQ

# If a stale Docker network exists from a prior run, remove it first:
docker network rm resumeiq_default 2>/dev/null

# Build and start both services in detached mode:
docker compose up --build -d
```

Verify containers are running:
```bash
docker compose ps
# Expect: resumeiq-backend-1 (port 8000) and resumeiq-frontend-1 (port 5173) both UP
```

## Backend Verification

| Endpoint | Expected Response |
|---|---|
| `GET http://localhost:8000/` | `{"message":"Welcome to ResumeIQ API"}` |
| `GET http://localhost:8000/health` | `{"status":"ok"}` |
| `GET http://localhost:8000/docs` | Swagger UI with title "ResumeIQ API" |

```bash
curl -s http://localhost:8000/
curl -s http://localhost:8000/health
```

## Frontend Verification

Open `http://localhost:5173` in a browser. Expect:
- Page title: "ResumeIQ"
- Centered `<h1>` heading reading "ResumeIQ" in indigo color on a gray background

## Teardown

```bash
docker compose -f /home/ubuntu/repos/ResumeIQ/docker-compose.yml down
```

## Known Issues
- If Docker network label conflicts occur (e.g., `network resumeiq_default was found but has incorrect label`), remove the network with `docker network rm resumeiq_default` and retry.
- The `GROQ_API_KEY` warning during startup is expected and harmless when AI features are not yet implemented.

## Devin Secrets Needed
- `GROQ_API_KEY` — Required only when AI-powered extraction features are implemented. Not needed for scaffold testing.
