# AI-Driven-Medication-Recognition-and-Personalized-Reminder-Platform
AI-Driven Medication Recognition and Personalized Reminder Platform
# PillSync — AI-Driven Medication Recognition & Personalized Reminder Platform

PillSync is a full-stack healthcare management application designed to help patients, caregivers, and administrators manage daily medications, track dose adherence, and prevent missed doses.

---

##  Project Milestones

- **Milestone 1 (Completed):** System architecture, database schema design, FastAPI backend setup, JWT authentication, Role-Based Access Control (`Patient`, `Caregiver`, `Admin`), and React frontend with persistent session & profile management.
- **Milestone 2 (In Progress):** Core medication management, morning/afternoon/night dose schedules, adherence tracking, and interactive sidebar dashboard.

---

## Tech Stack

- **Frontend:** React, Vite, Axios, Custom CSS
- **Backend:** FastAPI, Uvicorn, SQLAlchemy ORM, Passlib (Bcrypt), PyJWT
- **Database:** SQLite (`pillsync.db`) / PostgreSQL-ready via SQLAlchemy

---

## How to Run Locally

### 1. Start the FastAPI Backend
Open a terminal in the project root folder and run:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```
*API Docs available at:* `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend
Open a second terminal in the project root folder and run:
```bash
cd frontend
npm install
npm run dev
```
*Web App available at:* `http://localhost:5173/`
