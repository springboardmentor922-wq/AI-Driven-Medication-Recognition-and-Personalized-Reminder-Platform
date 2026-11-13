# PillSync — Academic Medication Management MVP

PillSync is an educational full-stack prototype using React/Vite, Express/Mongoose, MongoDB and a FastAPI OCR service with optional Groq vision extraction.

**Workflow:** medicine photo → OCR/AI extraction → user verification → medicine record → schedule → taken/missed/snoozed log → adherence/refill analytics → optional email alerts.

> **Safety:** Not a medical device and not medical advice. OCR/AI can misread medicines and packaging. Never infer dose/frequency from OCR; the patient must verify the original prescription or ask their clinician. Do not use this prototype as the sole source for medication decisions.

## Implemented in this academic MVP

- Patient and caregiver signup/login; bcrypt password hashing and JWT-protected APIs.
- Patient profile with phone, conditions and timezone fields.
- Patient-controlled, one-time, 24-hour caregiver invitation code; caregiver must accept it. Patient can revoke linked access. Caregivers can view linked patients' medicine summaries and recent dose events.
- Admin role and protected summary endpoint. Admin accounts are provisioned manually with a script; public signup cannot create an admin.
- Medicine create/list/update/soft-delete, category, active ingredient, stock, quantity per dose, daily frequency and schedule times.
- Image OCR via Tesseract fallback and optional Groq vision structured extraction. The verification UI requires the user to review and confirm fields before saving.
- Browser reminders while the web app is open and browser notification permission is granted.
- Dose logging (taken/missed/snoozed), dose history, adherence percentage and stock decrement/restoration when a dose status is corrected.
- Backend missed-dose monitor: marks a scheduled dose missed after the configured grace period and attempts an email to the patient's registered address.
- Email refill alert when estimated stock is seven days or less; the alert marker resets when stock is edited or a dose changes stock.
- Basic dashboard analytics and stock depletion estimate.
- Docker Compose for local development with MongoDB, API, OCR and frontend.

## Still not production-complete

- OAuth2/social login, refresh-token/session revocation, full admin UI and comprehensive audit logging.
- Push notifications (FCM), SMS/WhatsApp, native mobile app, or guaranteed delivery to a phone notification tray. Email arrives in the mailbox; phone push depends on the user's email app settings.
- Durable distributed scheduler/queue. The current monitor runs inside the Express process once per minute; it needs the API process and database continuously available. If the machine sleeps/offline, it cannot run. Use a cloud-hosted worker/queue for dependable production alerts.
- Individual per-user timezone scheduling; the simple scheduler currently uses the single `APP_TIMEZONE` configured for the server.
- Caregiver email notification routing and configurable caregiver alert preferences.
- Clinical drug database validation, interaction checking, prescription expiry workflow, clinician approval, regulatory/privacy compliance and production security review.
- Automated end-to-end/browser tests, load/performance testing, cloud deployment, HTTPS, backups, monitoring and disaster recovery.

Do not represent these items as implemented. Docker Compose is a local container setup, not a cloud deployment.

## Requirements

- Node.js 20+ and npm
- Python 3.12 recommended
- MongoDB Atlas URI or Docker/local MongoDB
- Groq API key for vision extraction (optional; Tesseract OCR can run without Groq)
- Tesseract executable (optional fallback; on Windows, UB Mannheim installer)
- Gmail SMTP App Password (optional email alerts; never use your normal Gmail password)
- Docker Desktop only if using Compose

## Configure environment files

Copy each example file to `.env` in the same folder. Never commit or share `.env` files.

### `server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://DB_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/pillsync?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_secret_at_least_32_chars
CLIENT_URL=http://localhost:5173
OCR_URL=http://localhost:8000
APP_TIMEZONE=Asia/Kolkata
MISSED_DOSE_GRACE_MINUTES=10

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
EMAIL_FROM=PillSync <your-email@gmail.com>

ADMIN_NAME=Project Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_12_or_more_characters
```

For MongoDB Atlas: ensure the cluster is running, database user has read/write access to `pillsync`, and only your current public IP is on the Atlas IP access list. URL-encode special characters in the database password. Do not use `0.0.0.0/0` for normal development.

Gmail: enable Google 2-Step Verification and create an App Password. `SMTP_PASS` is that app password, not the normal Gmail password. Email alerts are disabled when SMTP settings are missing.

### `ocr-service/.env`

```env
GROQ_API_KEY=your_groq_api_key
GROQ_VISION_MODEL=qwen/qwen3.8-27b
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_LANG=eng+deu
```

Check Groq's current model availability and account limits before use. Keep the key only in the Python service `.env`; never put it in `client/.env`.

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Vite variables are public in the browser bundle. Do not put MongoDB passwords, JWT secrets, SMTP passwords or Groq API keys here.

## Run locally on Windows (3 terminals)

Extract the ZIP, open the project root in VS Code, then create the three `.env` files by copying the corresponding `.env.example` files and editing them.

### Terminal 1 — API

```powershell
cd server
npm install
npm run dev
```

API health: http://localhost:5000/api/health

### Terminal 2 — OCR service

```powershell
cd ocr-service
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

OCR docs: http://localhost:8000/docs  
OCR health: http://localhost:8000/health (Groq should show configured when the key is loaded).

### Terminal 3 — frontend

```powershell
cd client
npm install
npm run dev
```

Open http://localhost:5173.

Keep API and OCR terminals running. Browser notifications only work while the web app is open and permission is granted. Missed-dose/refill emails need the API process continuously running and valid SMTP settings.

## Caregiver setup

1. Patient creates a Patient account and signs in.
2. Caregiver creates a separate Caregiver account and signs in.
3. Patient opens **Profile & caregivers** and generates an invitation code.
4. Patient shares the one-time code privately with the caregiver; it expires after 24 hours.
5. Caregiver opens **Profile & caregivers**, enters the code and accepts.
6. Patient can revoke the relationship from the same page.

A caregiver can see only patients who have explicitly linked them using this flow. Do not share invitation codes publicly.

## Admin account

Admin cannot be selected on public signup. After configuring `ADMIN_NAME`, `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `server/.env`, run:

```powershell
cd server
npm run create-admin
```

Admin summary endpoint: `GET /api/admin/summary` (JWT required; admin role only). This MVP has no full admin dashboard.

## Email alert test

Sign in to PillSync and use the notifications test endpoint with your JWT:

```http
POST http://localhost:5000/api/notifications/test-email
Authorization: Bearer YOUR_JWT
```

A successful response confirms SMTP can send a test email to the account email. To test missed-dose behavior, create a medicine with a schedule time a few minutes in the past, ensure the API remains running beyond the configured grace period, and inspect the dose history and inbox. For a safe test, use a test account and a non-critical dummy medicine record; do not change real medication behavior to test software.

## Docker Compose (local development)

Copy root `.env.example` to root `.env`, set a strong `JWT_SECRET`, optional Groq and SMTP settings, then run:

```powershell
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health
- OCR docs: http://localhost:8000/docs

Compose uses a local MongoDB container by default. If you choose Atlas, update `MONGO_URI` and remove/disable the local MongoDB dependency as appropriate. Stop with `docker compose down`. `docker compose down -v` deletes the local database volume.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Patient/caregiver signup |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/profile` | View/update own profile |
| POST | `/api/caregivers/invite` | Patient creates one-time caregiver code |
| POST | `/api/caregivers/accept` | Caregiver accepts patient consent code |
| GET | `/api/caregivers/patients` | Caregiver's linked patients |
| GET | `/api/caregivers/caregivers` | Patient's linked caregivers |
| DELETE | `/api/caregivers/:id` | Revoke/unlink relationship |
| GET | `/api/admin/summary` | Admin-only platform counts |
| GET/POST | `/api/medicines` | List/create own medicines |
| PUT/DELETE | `/api/medicines/:id` | Update/soft-delete own medicine |
| GET/POST | `/api/doses` | Dose history / record dose |
| GET | `/api/analytics` | Adherence and refill estimate |
| POST | `/api/ocr` | Authenticated image OCR proxy |
| POST | `/api/notifications/test-email` | Send test email to signed-in user |

All routes except register/login/health require `Authorization: Bearer <JWT>`.

## Troubleshooting

- `ECONNREFUSED 127.0.0.1:27017`: API is using a local MongoDB URI but no local MongoDB server is running. Set the Atlas URI in `server/.env`, or start Docker/local MongoDB.
- Atlas connection fails: verify cluster status, DB username/password, IP access list, DNS and outbound port 27017.
- OCR unavailable: ensure Uvicorn is running on port 8000 and `OCR_URL=http://localhost:8000`.
- Groq not configured: inspect OCR service `.env`, restart Uvicorn and check `/health`.
- Email not sent: test `/api/notifications/test-email`, verify Gmail App Password and SMTP settings, then inspect API logs.
- Port in use: stop the previous process or change the service port and update dependent URLs.

## Before real-world use

Rotate any credentials previously shared or included in ZIPs. Use HTTPS, secret management, rate limiting, robust validation, secure token lifecycle, least-privilege DB access, backups, monitoring, audit logs, data retention/deletion controls, caregiver consent review, privacy/legal review and clinical safety review. This is an academic MVP only.
