# CertiFlow – Local Setup & Development Guide

Follow these steps to run a full instance of CertiFlow from scratch with sample demo data and automated test execution.

---

## 1. Prerequisites

- **Node.js**: v20 or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **Docker & Docker Compose**: Installed and running (`docker --version`)

---

## 2. Infrastructure Setup (PostgreSQL + Redis)

At the project root, launch the required database and cache containers:

```bash
docker compose up -d
```

Verify that the containers are healthy:

```bash
docker compose ps
```

You should see:
- `certiflow-postgres` listening on port `5432`
- `certiflow-redis` listening on port `6379`

---

## 3. Backend Setup & Seeding

Navigate into the `backend/` directory:

```bash
cd backend
npm install
```

Synchronize the database schema with Prisma:

```bash
npx prisma db push
```

Populate the database with the six demo users, sample training institutes, realistic batches in various approval stages, and verifiable certificates:

```bash
npm run seed
```

Run the automated moments verification test suite:

```bash
npm run test:moments
```

Start the backend development server:

```bash
npm run dev
```

The API will be operational on `http://localhost:5000`. Test the health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected output:
```json
{
  "success": true,
  "service": "CertiFlow Backend",
  "database": "PostgreSQL",
  "cache": "Redis",
  "queue": "BullMQ Active"
}
```

---

## 4. Frontend Setup

In a new terminal window, navigate into `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The application will launch on `http://localhost:3000`.

---

## 5. Walkthrough for Evaluators

1. **Dashboard & Demo Switcher**:
   - Open `http://localhost:3000`.
   - By default, you are logged in as **Anika (Training Centre)**.
   - Use the **"Demo Role" dropdown** in the top navigation to switch personas at any point.

2. **Test Moment 1 (Spreadsheet Ingestion & Bad Rows Rollback)**:
   - As Anika, go to **Upload & Batches** -> Click **Upload Batch**.
   - Click the button **"1-Click Moment 1 Test (Trigger Bad Rows Rollback)"**.
   - Observe the immediate row-level error breakdown table (identifying invalid phone format, negative marks, and duplicate roll numbers).
   - Notice that 0 candidate records were saved to PostgreSQL.

3. **Test Moment 2 (Multi-Officer District Quorum & Concurrency Guard)**:
   - Switch to **Dev (District Officer - North)**.
   - Open batch `BATCH-2026-0002` (which already has 1 endorsement).
   - Switch to **Meera (District Officer - North)** and click **Endorse Batch**.
   - Notice that the quorum reaches 2/2 and the batch automatically advances to the next stage.
   - Try endorsing twice with the same user: the system prevents duplicate approvals.

4. **Test Moment 3 (Quality Inspection)**:
   - Switch to **Neha (Quality Team)**.
   - Open batch `BATCH-2026-0003` (flagged for quality due to size > 20 candidates).
   - Click **Verify & Pass Quality Audit**.

5. **Test Moment 4 (State Final Approval & Certificate Issuance)**:
   - Switch to **Farah (State Office)**.
   - Open batch `BATCH-2026-0004` (awaiting state sign-off).
   - Click **Authorize & Issue Certificates**.
   - Observe the instant generation of unique certificate IDs, cryptographically verifiable QR codes, and enqueued WhatsApp background jobs.

6. **Test Moment 5 (Real-time Public Verification & Revocation)**:
   - Open `http://localhost:3000/verify` in an incognito window or new tab (no login required).
   - Click **Valid Certificate (DEMO01)** -> View the verified green credential card with QR code.
   - Click **Revoked Certificate (REVOKED)** -> View the immediate red warning card stating the official revocation reason.
   - Back in the portal as **Farah (State Office)**, navigate to **Certificates**, click **Revoke** on any active certificate, provide a reason, and re-check it on the public verification page to witness immediate real-time revocation.

