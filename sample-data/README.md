# CertiFlow – Sample Testing Data & Upload Guide

This directory contains verified sample candidate rosters formatted specifically for the **CertiFlow** platform.

---

## 1. Files in this Directory

| File | Purpose | Contents |
| :--- | :--- | :--- |
| **`CertiFlow_Sample_Candidate_Batch.xlsx`** | **Production-grade Valid Batch** | 10 realistic fictional student records with valid Indian mobile numbers (`+91`), unique Aadhaar/National IDs, roll numbers, course details, marks, and attendance rates. |
| **`CertiFlow_Invalid_Test_Batch.xlsx`** | **Moment 1 Validation Test** | 4 student records containing deliberate errors (malformed phone, negative marks, duplicate National ID, out-of-range attendance) to demonstrate **Strict Validation & Atomic Rollback**. |

---

## 2. Spreadsheet Schema & Required Columns

The first worksheet (`SheetNames[0]`) is parsed directly by CertiFlow. The column headers are:

| Column Header | Format / Constraint | Example |
| :--- | :--- | :--- |
| **`Full Name`** | String (min 2 characters) | `Aarav Sharma` |
| **`Father Name`** | String (Optional) | `Ramesh Sharma` |
| **`National ID`** | Unique alphanumeric string (min 6 digits) | `987654321001` |
| **`Phone (10 digits)`** | Valid 10-digit mobile number or `+91` format | `+919876543011` or `9876543011` |
| **`Email`** | Valid email address (Optional) | `aarav.sharma@example.com` |
| **`Roll Number`** | Unique identifier within batch | `ROL-2026-N001` |
| **`Marks (0-100)`** | Number between `0` and `100` (Pass threshold: `≥ 40`) | `92` |
| **`Attendance (%)`** | Number between `0` and `100` | `96` |
| **`District`** | Accredited district name | `District North` |

---

## 3. Step-by-Step Live Reviewer Walkthrough

Follow this 5-stage workflow to demonstrate end-to-end certification starting from a completely clean database:

### Stage 1: Batch Upload as Training Centre
1. Open the application at `http://localhost:3000/login`.
2. Sign in with:
   - **Email:** `training.centre@certiflow.gov`
   - **Password:** `password123`
3. Notice that the dashboard and batches view begin at **0 records** (clean canvas).
4. Go to **Upload & Batches** (`/batches`) and click **Upload Batch**.
5. **Demonstrate Moment 1 (Atomic Rollback)**:
   - Select `CertiFlow_Invalid_Test_Batch.xlsx`.
   - Observe that the upload immediately rejects with pinpointed error line numbers (`Row 3: Invalid phone`, `Row 4: Marks cannot be negative`, `Row 5: Duplicate National ID`).
   - Confirm that **0 records** were saved in PostgreSQL.
6. **Upload Valid Batch**:
   - Select `CertiFlow_Sample_Candidate_Batch.xlsx`.
   - Course Name: `Solar PV Installation Technician`
   - Course Code: `SOL-PV-L4`
   - Click submit: The batch (`BATCH-2026-0001`) and all 10 candidate records are created in PostgreSQL.
   - Status transitions to `UNDER_DISTRICT_REVIEW`.
7. Sign out from the top navigation bar.

---

### Stage 2: Multi-Officer District Review (Quorum Enforcement)
1. Sign in as **District Officer 1**:
   - **Email:** `district.officer1@certiflow.gov`
   - **Password:** `password123`
2. Open **District Approvals** (`/approvals`) and select the uploaded batch.
3. Click **Approve Batch**.
4. Observe that the batch remains in review pending quorum: **1 of 2 district approvals recorded**.
5. Sign out.
6. Sign in as **District Officer 2**:
   - **Email:** `district.officer2@certiflow.gov`
   - **Password:** `password123`
7. Open the same batch and click **Approve Batch**.
8. Notice that quorum is satisfied (`2/2`). The batch advances to State Review.
9. Sign out.

---

### Stage 3: Quality Review (If Cohort > 20)
*(For batches with > 20 candidates, Quality Reviewer logs in to audit before state sign-off).*
- **Email:** `quality.reviewer@certiflow.gov`
- **Password:** `password123`

---

### Stage 4: State Final Approval & Certificate Issuance
1. Sign in as **State Director**:
   - **Email:** `state.director@certiflow.gov`
   - **Password:** `password123`
2. Open **Batches**, inspect the approved batch, and click **Final State Authorization**.
3. CertiFlow automatically:
   - Renders 10 official vector PDF certificates using **PDFKit**.
   - Generates cryptographically verifiable QR codes.
   - Dispatches 10 individual WhatsApp delivery jobs to **BullMQ**.
4. Open **Certificates** (`/certificates`) to view the newly generated certificates (`CRT-2026-...`).
5. Click **PDF** on any certificate to inspect the generated official document with signature and QR code.

---

### Stage 5: WhatsApp Delivery Simulation & Public Verification
1. On the **Certificates** page, view the **WhatsApp Delivery Stream** widget:
   - Notice the status: `"DEMO MODE — WhatsApp delivery simulated. No actual message was sent."`
   - Click any candidate's delivery status pill to inspect the attempt history timeline, carrier receipt (`wamid.SIM_...`), and idempotency key.
2. **Instant Revocation Demonstration**:
   - Click **Revoke** on any certificate.
   - Enter reason: `"Biometric attendance logs tampered during assessment."`
   - Copy the Certificate ID.
3. Open an Incognito window (unauthenticated) and visit `http://localhost:3000/verify`.
4. Enter the revoked Certificate ID: The portal instantly displays the prominent red **REVOKED** warning banner with timestamp and official reason.
5. Enter any valid Certificate ID: Displays the green **AUTHENTIC & VALID** verification badge.

---

## 4. Resetting Back to Clean State

To wipe all uploaded test batches, candidates, and certificates and return to a clean zero-record state:

```bash
cd backend
npm run clean
```

*This command preserves all 5 official authentication accounts and 2 accredited training centres while resetting all operational tables to 0 records.*

