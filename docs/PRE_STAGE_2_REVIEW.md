# Pre-Stage 2 Architecture & Database Review
## Comprehensive Consistency Analysis (`PRE_STAGE_2_REVIEW.md`)

---

## 1. Executive Summary

This review evaluates [`docs/MVP_SPEC_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/MVP_SPEC_UPDATED.md) and [`docs/DATABASE_DESIGN_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/DATABASE_DESIGN_UPDATED.md) to ensure complete alignment between product requirements and database schema design before any Stage 2 migrations or application code are implemented.

### Overall Assessment
The updated specifications demonstrate strong architectural discipline. Key decisions—limiting the pilot to Addis Ababa, restricting delivery-fee payers to sender or receiver, deferring business billing, establishing test commission baselines (15% motorcycle / 10% bicycle), separating payment verification from physical handover, and hardening OTP entropy—are well reflected.

However, our forensic cross-review identified **5 critical/high-priority gaps and inconsistencies** that must be resolved prior to locking the database schema.

---

## 2. Issues Found (Categorized by Severity)

### 2.1 Critical Severity: Financial & State Integrity

#### Issue 1: Missing Database Protection Against Duplicate Payment Collections
- **Location**: `DATABASE_DESIGN_UPDATED.md` (Section 3.8 `payments` table).
- **Finding**: In `DATABASE_DESIGN_UPDATED.md`, the `UNIQUE(delivery_id)` constraint was removed from `payments` to permit multiple retry or dispute records. However, there is no database-level constraint preventing multiple records from simultaneously having a successful collection status (`collected_unverified`, `collected_cash_rider_confirmed`, or `verified`).
- **Risk**: A network retry, race condition, or malicious actor could record two successful collections for the same delivery fee.
- **Impact**: Inaccurate ledger debits and conflicting accounting balances.

#### Issue 2: Settlement Submissions vs. Active Rider Debt Ceiling
- **Location**: `MVP_SPEC_UPDATED.md` (Section 5.3) & `DATABASE_DESIGN_UPDATED.md` (Section 3.9 `commission_ledger`).
- **Finding**: When a courier submits a Telebirr or CBE settlement reference, a ledger entry is proposed with `status = 'pending_verification'`. Neither document clarifies whether `balance_after` is recalculated when the settlement is *submitted* or only when it is *approved by an admin*.
- **Risk**: If submitting an unverified reference immediately reduces outstanding debt, a blocked courier could submit a fake transaction code to artificially bypass their debt ceiling and claim more jobs.
- **Impact**: Direct financial leakage and uncollected platform commission.

---

### 2.2 High Severity: Schema & Onboarding Discrepancies

#### Issue 3: Missing Rider Onboarding Fields for Vehicle Verification
- **Location**: `MVP_SPEC_UPDATED.md` (Section 6.1) vs. `DATABASE_DESIGN_UPDATED.md` (Section 3.4 `rider_profiles`).
- **Finding**:
  - `MVP_SPEC_UPDATED.md` mandates that motorcycle riders provide vehicle ownership documentation (**Libre / ownership book**) and bicycle riders provide an **emergency contact**.
  - `rider_profiles` in `DATABASE_DESIGN_UPDATED.md` only includes `id_card_url` and `license_doc_url`. It lacks `ownership_doc_url` (Libre) and emergency contact fields (`emergency_contact_name`, `emergency_contact_phone`).
- **Impact**: Admins cannot verify vehicle ownership or reach emergency contacts without schema extensions.

#### Issue 4: Cancellation Data & Penalty Tracking Gap
- **Location**: `MVP_SPEC_UPDATED.md` (Section 6.2 & 6.3) vs. `DATABASE_DESIGN_UPDATED.md` (Section 3.6 `deliveries`).
- **Finding**:
  - `MVP_SPEC_UPDATED.md` states:
    1. If a requester cancels after rider arrival, a cancellation fee applies (25 ETB bicycle, 40 ETB motorcycle).
    2. If a rider unassigns/cancels after claiming, a penalty is logged.
  - In `deliveries`, there is a `cancelled_at TIMESTAMPTZ` column, but no columns to store `cancellation_reason`, `cancelled_by_user_id`, or `cancellation_fee_billed`.
  - Furthermore, neither document clarifies whether platform commission is charged on cancellation fees or how that fee is collected from the requester.

---

### 2.3 Medium Severity: Operational & Business Logic Constraints

#### Issue 5: Concurrent Active Job Limit for Couriers
- **Location**: `MVP_SPEC_UPDATED.md` (Section 3 & 4) vs. `DATABASE_DESIGN_UPDATED.md` (Section 4.1).
- **Finding**: The MVP scope strictly excludes pooled, batched, or multi-order deliveries. Each courier is expected to handle one single-point pickup-to-dropoff trip at a time. However, neither the atomic claiming query nor the database constraints check whether a claiming courier already has an in-progress delivery (`assigned`, `arrived_pickup`, `picked_up`, or `arrived_dropoff`).
- **Impact**: A courier could hoard multiple delivery jobs across the city, resulting in extreme delays and customer cancellations.

#### Issue 6: Unregistered Receiver Identity in Payment Records
- **Location**: `DATABASE_DESIGN_UPDATED.md` (Section 3.8 `payments.payer_user_id`).
- **Finding**: When `payer_type = 'receiver'`, the package recipient is paying the rider directly. In most consumer deliveries, the recipient does not have an account on the platform; they were identified only by `dropoff_contact_name` and `dropoff_contact_phone`.
- **Finding**: `payments.payer_user_id` is foreign-keyed to `users(id)`. If the recipient has no user account, this field must be `NULL`. This needs to be formally documented so the application does not attempt to look up or require a `user_id`.

#### Issue 7: OTP Hashing Scheme Specification
- **Location**: `DATABASE_DESIGN_UPDATED.md` (Section 3.6 `deliveries.verification_otp_hash`).
- **Finding**: `verification_otp_hash` is specified as `VARCHAR(255)`. For a 4-to-6 digit numeric code, unsalted or simple hashing (like plain SHA-256) is vulnerable to instant brute-force lookup (only $10^4$ to $10^6$ combinations).
- **Impact**: While better than plaintext, the specification should mandate HMAC with a secret server pepper or a slow key derivation function (Argon2id) with unique delivery salt.

---

## 3. Recommended Corrections

### 3.1 Recommended Schema Enhancements (`DATABASE_DESIGN_UPDATED.md`)

#### 1. Enforce Single Successful Payment Collection
Add a PostgreSQL partial unique index to `payments`:
```sql
-- Ensures only one record per delivery can represent a successful collection
CREATE UNIQUE INDEX idx_payments_single_success
ON payments (delivery_id)
WHERE payment_status IN ('collected_unverified', 'collected_cash_rider_confirmed', 'verified');
```

#### 2. Align Rider Profile with Vetting Requirements
Add the missing compliance columns to `rider_profiles`:
```sql
ALTER TABLE rider_profiles
  ADD COLUMN ownership_doc_url TEXT NULL,             -- Libre / vehicle registration book
  ADD COLUMN emergency_contact_name VARCHAR(100) NULL, -- Required for all riders
  ADD COLUMN emergency_contact_phone VARCHAR(20) NULL; -- Required for all riders
```

#### 3. Capture Delivery Cancellation Metadata
Add cancellation detail columns to `deliveries`:
```sql
ALTER TABLE deliveries
  ADD COLUMN cancelled_by_user_id UUID REFERENCES users(id),
  ADD COLUMN cancellation_reason TEXT,
  ADD COLUMN cancellation_fee NUMERIC(12, 2) DEFAULT 0.00;
```

#### 4. Guard Against Multi-Job Hoarding in Claim Transaction
Update the atomic job claiming query in Section 4.1 to verify the rider has zero active jobs:
```sql
BEGIN;

-- Verify the rider does not already have an active job
SELECT id FROM deliveries 
WHERE rider_id = :claiming_rider_id 
  AND status IN ('assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff')
LIMIT 1;
-- If an active job exists, ABORT with error: 'Rider already has an active delivery'.

-- Lock and claim the requested delivery
UPDATE deliveries
SET status = 'assigned',
    rider_id = :claiming_rider_id,
    assigned_at = NOW(),
    updated_at = NOW()
WHERE id = :delivery_id 
  AND status = 'requested' 
  AND rider_id IS NULL
RETURNING id;

COMMIT;
```

#### 5. Define Settlement Balance Update Lifecycle
Clarify in `commission_ledger`:
- When a rider submits a settlement, the entry is created with `status = 'pending_verification'` and does **not** alter the courier's effective balance or debt ceiling.
- When an administrator reviews the company bank/Telebirr statement and clicks "Approve", the entry status transitions to `'settled'`, and the courier's debt is credited.

---

## 4. Unresolved Decisions & Open Questions

The following business rules require stakeholder confirmation:

| # | Question | Current Proposal / Assumption | Decision Impact |
| :- | :--- | :--- | :--- |
| **U1** | **Cancellation Fee Commission** | When a sender cancels after rider arrival and pays the cancellation fee (25 or 40 ETB), does the platform take commission on that fee? | **Proposal**: Platform waives commission on cancellation fees during MVP; 100% of the cancellation fee goes to the rider to compensate for fuel/effort. |
| **U2** | **Failed Delivery Collection** | If recipient is unreachable after arrival and parcel is returned to sender, when does the rider collect the fare + return fee? | **Proposal**: Rider collects fare upon returning package to sender. If sender refuses to pay, incident is flagged for admin dispute resolution. |
| **U3** | **OTP Expiry Duration** | What is the exact expiration window for the dropoff OTP? | **Proposal**: OTP expires 60 minutes after order enters `ASSIGNED`, with an in-app "Resend OTP" button for the sender. |
| **U4** | **OTP Max Failed Attempts** | How many failed OTP entries are allowed before locking? | **Proposal**: Maximum 5 failed attempts, after which the status locks and requires admin phone verification to prevent brute-forcing. |
| **U5** | **Rider Debt Ceiling Grace Buffer** | Can a rider accept an order that pushes their debt slightly above 500 ETB? | **Proposal**: Debt ceiling check runs *before* claiming. If current debt $\ge$ 500.00 ETB, claiming is blocked. |

---

## 5. Checklist for Approving the Database Design

Before executing any migrations or DDL in Stage 2, verify that every item on this checklist is satisfied:

- [ ] **Geographic Scope**: All address models specify Addis Ababa sub-cities and landmarks.
- [ ] **Payer Type**: `deliveries.payer_type` is constrained strictly to `'sender'` and `'receiver'`.
- [ ] **Monetary Precision**: Every monetary column in `pricing_rules`, `deliveries`, `payments`, and `commission_ledger` is strictly `NUMERIC(12, 2)`.
- [ ] **Pricing Snapshot**: `deliveries` captures both `commission_rate_pct` (15.00 or 10.00) and `commission_amount` at creation time.
- [ ] **Duplicate Payment Guard**: A partial unique index ensures only one successful payment record per delivery.
- [ ] **Payment Independence**: Database schema allows `deliveries.status = 'delivered'` while `payments.payment_status = 'collected_unverified'`.
- [ ] **Rider Compliance**: `rider_profiles` includes fields for ID card, driver's license (motorcycle), vehicle Libre ownership document (motorcycle), and emergency contact.
- [ ] **Cancellation Audit**: `deliveries` includes `cancelled_by_user_id`, `cancellation_reason`, and `cancellation_fee`.
- [ ] **OTP Security**: `deliveries` contains `verification_otp_hash` (peppered HMAC), `verification_otp_expires_at`, `verification_otp_used_at`, and `verification_attempts`.
- [ ] **Concurrency**: Atomic claim procedure validates zero active jobs for the claiming rider and uses row locking.
- [ ] **Ledger Immutability**: `commission_ledger` is append-only; unverified settlements do not artificially clear debt ceilings until admin approval.
- [ ] **Environment Isolation**: Schema design specifies testing on an isolated Neon development branch or separate development database prior to production deployment.
