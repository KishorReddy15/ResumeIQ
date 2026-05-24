# ResumeIQ Low-Level Design (LLD) Sequence Diagrams

This document contains the complete set of interactive Mermaid sequence diagrams representing the key visual and data transaction flows of the **ResumeIQ** application.

---

## 1. Initial Page Load Flow

This diagram illustrates what happens when the application is launched for the first time. It covers both **Case A (Fresh State / Database is empty)** and **Case B (Populated State / Database has existing records)** in a unified timeline.

```mermaid
sequenceDiagram
autonumber
actor Recruiter
participant Browser as Browser Client
participant UI as React UI
participant API as FastAPI Router
participant DB as SQLite DB

Recruiter->>Browser: Enters http://localhost:5173
activate Browser
Browser->>Browser: Mount DOM index.html to main.jsx to App.jsx
Browser->>UI: Initialize State loading=true candidates=[]
UI->>Recruiter: Renders Header and Layout
deactivate Browser

activate UI
Note over UI: UI mount triggers concurrent API fetches

par Fetch Filter Options
    UI->>API: GET /candidates/filters
    activate API
    API->>DB: SELECT DISTINCT source skill tag
    DB-->>API: Returns filter option lists
    API-->>UI: 200 OK Filter JSON
    deactivate API
and Fetch Candidates List
    UI->>API: GET /candidates empty filters
    activate API
    API->>DB: SELECT c.* FROM candidates ORDER BY created_at DESC
    DB-->>API: Returns candidate rows or empty list
    deactivate API
end

alt Database is empty
    UI->>UI: setLoading false
    UI->>Recruiter: Renders empty state message
else Database has candidates
    loop For each candidate row
        API->>DB: SELECT skill FROM skills WHERE candidate_id
        DB-->>API: Skills
        API->>DB: SELECT * FROM experience WHERE candidate_id
        DB-->>API: Experience
        API->>DB: SELECT * FROM education WHERE candidate_id
        DB-->>API: Education
        API->>DB: SELECT tag FROM tags WHERE candidate_id
        DB-->>API: Tags
    end
    API-->>UI: 200 OK Array of Candidate JSON objects
    UI->>UI: setCandidates res.data
    UI->>UI: setLoading false
    loop For each candidate
        UI->>UI: Mount CandidateCard component
    end
    UI->>Recruiter: Renders candidate cards
end

deactivate UI
```

---

## 2. Resume PDF Upload & Structured Extraction Flow

This diagram maps out the visual and data transaction that takes place when a recruiter drops a PDF resume to upload it into the main directory.

```mermaid
sequenceDiagram
autonumber
actor Recruiter
participant UI as React UI UploadZone
participant API as FastAPI Router
participant SVC as LLM Services
participant LLM as Groq LLM Llama 3.1
participant DB as SQLite DB

Recruiter->>UI: Drags and Drops Resume PDF
activate UI
UI->>UI: Trigger onDrop and handleFiles
Note over UI: Validates file is PDF
UI->>API: POST /upload FormData file and source
deactivate UI

activate API
API->>SVC: validate_pdf filename and size
Note over SVC: Checks size less than 10MB
API->>SVC: extract_text_from_pdf pdf_bytes
SVC-->>API: Returns raw_text

API->>SVC: extract_resume_data raw_text
activate SVC
SVC->>LLM: Call chat.completions.create with parsing prompt
LLM-->>SVC: Returns raw JSON string
SVC->>SVC: Parse into ExtractedResume Pydantic schema
SVC-->>API: Returns structured Candidate schema
deactivate SVC

API->>DB: INSERT INTO candidates name email phone raw_text
DB-->>API: Returns candidate_id

par Save Relational Data
    API->>DB: INSERT INTO skills candidate_id skill
and
    API->>DB: INSERT INTO experience candidate_id title
and
    API->>DB: INSERT INTO education candidate_id degree
end

API->>DB: COMMIT TRANSACTION
API->>API: Call _build_candidate candidate_id
Note over API: Compiles unified CandidateOut object
API-->>UI: Response 200 OK CandidateOut JSON
deactivate API

activate UI
UI->>UI: Trigger handleUploaded
UI->>UI: setCandidates newCandidate plus prev
UI->>Recruiter: Renders new Candidate Card on UI
deactivate UI
```

---

## 3. Dynamic Filtering & AI Search Flow

This diagram illustrates how a user loads dynamic filters, clicks a tag, types a natural language search query, and triggers the combined SQLite & concurrent LLM evaluation pipeline.

```mermaid
sequenceDiagram
autonumber
actor Recruiter
participant UI as React UI FilterBar
participant API as FastAPI Router
participant SVC as LLM Services
participant LLM as Groq LLM Llama 3.1
participant DB as SQLite DB

UI->>API: GET /candidates/filters
API->>DB: SELECT DISTINCT source skill tag FROM tables
DB-->>API: Returns dynamic arrays
API-->>UI: Response sources skills tags arrays
UI->>Recruiter: Renders Shortlisted and Python as filter options

Recruiter->>UI: Selects Shortlisted tag and types Lives in Karnataka
Note over UI: Debounces input for 300ms
UI->>API: GET /candidates?tag=Shortlisted&search=Lives in Karnataka

activate API
API->>DB: SELECT candidates WHERE tag equals Shortlisted
DB-->>API: Returns Shortlisted candidate rows Candidates 1 and 2
API->>API: Compile complete objects skills education raw_text

API->>SVC: filter_candidates_with_llm Cand1 Cand2 query Lives in Karnataka
activate SVC
Note over SVC: Spawns ThreadPoolExecutor max_workers=10

par Thread 1 Candidate 2 Prashanth
    SVC->>LLM: check_single_candidate Cand2 Lives in Karnataka
    LLM-->>SVC: matches false Resides in Hyderabad
and Thread 2 Candidate 1 Kishor
    SVC->>LLM: check_single_candidate Cand1 Lives in Karnataka
    LLM-->>SVC: matches true Resides in Bangalore Karnataka
end

SVC-->>API: Returns matching IDs list with ID 1
deactivate SVC

API->>API: Filter candidate array to only ID 1
API-->>UI: Response 200 OK Kishor Reddy Candidate JSON
deactivate API

UI->>Recruiter: Renders only Kishor Reddy card on screen
```

---

## 4. Resume Chat Assistant Session Flow

This diagram maps out the session-based chat assistant flow, including parsing PDFs strictly for the current tab memory and building conversational RAG context history.

```mermaid
sequenceDiagram
autonumber
actor Recruiter
participant UI as React UI ChatAssistant
participant API as FastAPI Router
participant SVC as LLM Services
participant LLM as Groq LLM Llama 3.1

Recruiter->>UI: Selects Resumes and clicks Upload PDFs
activate UI
UI->>API: POST /chat/upload FormData list of files
deactivate UI

activate API
loop For each file
    API->>SVC: validate_pdf
    API->>SVC: extract_text_from_pdf
end
API-->>UI: Response 200 OK resume_texts and filenames
deactivate API

activate UI
UI->>UI: Store raw texts in resumeTexts state
UI->>UI: Append Loaded Confirmation message
UI->>Recruiter: Renders welcome message and resume badges
deactivate UI

Recruiter->>UI: Types Who has React skills and clicks Send
activate UI
UI->>UI: Append User message to messages state
UI->>UI: Render Thinking box
UI->>API: POST /chat messages history and resume_texts
deactivate UI

activate API
API->>SVC: chat_with_resumes resume_texts and messages
activate SVC
SVC->>SVC: Compile CHAT_SYSTEM_PROMPT with all raw resume_texts
Note over SVC: Prepend context as a single system message
SVC->>SVC: Append past user and assistant chat history
SVC->>LLM: Call chat.completions.create model llama-3.1-8b-instant
LLM-->>SVC: Returns Assistant Text Reply
SVC-->>API: Returns reply string
deactivate SVC

API-->>UI: Response 200 OK reply text
deactivate API

activate UI
UI->>UI: Append AI reply to messages state
UI->>UI: Scroll UI window smoothly to bottom via messagesEndRef
UI->>Recruiter: Renders AI comparison bubble
deactivate UI
```
