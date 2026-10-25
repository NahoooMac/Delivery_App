# Pre-Stage 2 Architecture & Database Review
## Comprehensive Consistency Analysis (`PRE_STAGE_2_REVIEW.md`)

---

## 1. Executive Summary

This review evaluates [`docs/MVP_SPEC_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/MVP_SPEC_UPDATED.md) and [`docs/DATABASE_DESIGN_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/DATABASE_DESIGN_UPDATED.md) to ensure complete alignment between product requirements and database schema design before any Stage 2 migrations or application code are implemented.

### Overall Assessment
The updated specifications demonstrate strong architectural discipline. Key decisions—limiting the pilot to Addis Ababa, restricting delivery-fee payers to sender or receiver, deferring business billing, establishing test commission baselines (15% motorcycle / 10% bicycle), separating payment verification from physical handover, and hardening OTP entropy—are well reflected.

Our forensic cross-review initially identified **5 critical/high-priority gaps and inconsistencies**. As documented below, all 5 gaps, along with all operational questions, have been **100% resolved and verified** in [`docs/MVP_SPEC.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/MVP_SPEC.md), [`docs/DATABASE_DESIGN.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/DATABASE_DESIGN.md), and [`docs/PRE_STAGE_2_DECISIONS.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/PRE_STAGE_2_DECISIONS.md).

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

## 4. Resolved Decisions & Closed Policy Questions

The operational questions originally raised in this review have been formally decided and incorporated into [`docs/MVP_SPEC.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/MVP_SPEC.md) and [`docs/PRE_STAGE_2_DECISIONS.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/PRE_STAGE_2_DECISIONS.md):

| # | Question | Final Decision | Status in Current Docs |
| :- | :--- | :--- | :--- |
| **U1** | **Cancellation Fee Commission** | Platform waives commission on cancellation fees during MVP (0% platform cut). 100% of the 25 ETB (bicycle) or 40 ETB (motorcycle) fee belongs to the courier. No commission debit is logged. | **RESOLVED & VERIFIED**: Documented in `MVP_SPEC.md` Step 4 and `DATABASE_DESIGN.md` Section 3.8. |
| **U2** | **Failed Delivery Collection** | Failed drop-off does not trigger commission accrual (delivery was not completed). Courier returns parcel to sender. If sender refuses original fare, order is escalated for admin dispute resolution without automatic wallet debit. | **RESOLVED & VERIFIED**: Documented in `MVP_SPEC.md` Step 6 and `DATABASE_DESIGN.md` Section 3.8. |
| **U3** | **OTP Expiry Duration & Timing** | Recipient OTP is generated at `picked_up` with a strict 60-minute expiry window. Fields are `NULL` prior to parcel pickup. | **RESOLVED & VERIFIED**: Fully aligned in `MVP_SPEC.md` workflow diagram, Step 4/5, and `DATABASE_DESIGN.md` Section 3.6. |
| **U4** | **OTP Max Failed Attempts** | Maximum 5 failed attempts allowed before verification is locked (`verification_locked = true`), requiring sender in-app reset or admin phone verification override. | **RESOLVED & VERIFIED**: Specified in `DATABASE_DESIGN.md` Section 3.6 and Section 4.2. |
| **U5** | **Rider Debt Ceiling Grace Buffer** | Debt ceiling check is strictly enforced: couriers with verified debt $\ge 500.00$ ETB cannot claim jobs. Unverified settlement submissions (`pending_verification`) do not reduce active debt. | **RESOLVED & VERIFIED**: Specified in `DATABASE_DESIGN.md` Section 3.9 and Section 4.1. |

---

## 5. Checklist for Approving the Database Design

All items required before executing database migrations or DDL in Stage 2 have been satisfied and verified across the active documentation:

- [x] **Geographic Scope**: All address models specify Addis Ababa sub-cities and landmarks (`DATABASE_DESIGN.md` Section 3.6 `deliveries`).
- [x] **Payer Type**: `deliveries.payer_type` is constrained strictly to `'sender'` and `'receiver'` (`DATABASE_DESIGN.md` Section 3.6).
- [x] **Monetary Precision**: Every monetary column in `pricing_rules`, `deliveries`, `payments`, and `commission_ledger` is strictly `NUMERIC(12, 2)` (`DATABASE_DESIGN.md` Section 3.1-3.9).
- [x] **Pricing Snapshot**: `deliveries` captures both `commission_rate_pct` (15.00 or 10.00) and `commission_amount` at creation time (`DATABASE_DESIGN.md` Section 3.6).
- [x] **Duplicate Payment Guard**: Three partial unique indexes on `payments` enforce at most one successful fee collection per type (`idx_payments_single_successful_delivery_fare`, `idx_payments_single_cancellation_fee`, `idx_payments_single_return_fare`) (`DATABASE_DESIGN.md` Section 5).
- [x] **Payment Independence & Server-Side Guard**: Delivery completion (`delivered`) is decoupled from backoffice electronic payment reconciliation (`verified`), allowing `collected_unverified` to complete delivery, while strictly enforcing via server-side CTE that receiver-paid deliveries have a recorded payment before handover (`DATABASE_DESIGN.md` Section 4.2).
- [x] **Rider Compliance**: `rider_profiles` includes fields for ID card, driver's license (motorcycle), vehicle Libre ownership document (motorcycle: `ownership_doc_url`), and emergency contact (`emergency_contact_name`, `emergency_contact_phone`) (`DATABASE_DESIGN.md` Section 3.4).
- [x] **Cancellation Audit**: `deliveries` includes `cancelled_by_user_id`, `cancellation_reason`, and `cancellation_fee` (`DATABASE_DESIGN.md` Section 3.6).
- [x] **OTP Security**: `deliveries` contains `verification_otp_hash` (peppered HMAC), `verification_otp_salt`, `verification_otp_expires_at`, `verification_otp_used_at`, and `verification_attempts` (`DATABASE_DESIGN.md` Section 3.6).
- [x] **Concurrency & Single Active Job**: Atomic claim procedure validates zero active jobs for the courier via pessimistic row lock on `rider_profiles`, backed by the database-level partial unique index `idx_single_active_delivery_per_rider` across all canonical active states (`DATABASE_DESIGN.md` Section 4.1 & Section 5).
- [x] **Ledger Immutability**: `commission_ledger` is append-only with serialized courier row locking; unverified settlements do not artificially clear debt ceilings until admin approval (`DATABASE_DESIGN.md` Section 3.9 & Section 4.2).
- [x] **Environment Isolation**: Schema design specifies testing on an isolated Neon development branch or separate development database prior to production deployment (`DEVELOPMENT_ROADMAP.md` Stage 2).
