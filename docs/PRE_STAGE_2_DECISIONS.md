# Pre-Stage 2 Architecture Decisions & Resolutions
## Consolidated Decisions Document (`PRE_STAGE_2_DECISIONS.md`)

---

## 1. Overview & Purpose

This document formally records the architectural, business, financial, and schema decisions resolving all findings identified in [`docs/PRE_STAGE_2_REVIEW.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/PRE_STAGE_2_REVIEW.md). 

These decisions govern the pending updates to [`docs/MVP_SPEC_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/MVP_SPEC_UPDATED.md) and [`docs/DATABASE_DESIGN_UPDATED.md`](file:///e:/Personal/delivery%20app/Delivery_APP_system/docs/DATABASE_DESIGN_UPDATED.md) before initiating Stage 2 scaffolding and migrations.

---

## 2. Core Business & Operational Decisions

### Decision 1: Cancellation Fee Commission & Distribution
- **Policy**: The platform takes **0% commission** on cancellation fees during the MVP pilot.
- **Rule**: If a sender cancels after the courier has arrived at pickup (`status = 'ARRIVED_PICKUP'`), the cancellation fee (25.00 ETB for bicycle, 40.00 ETB for motorcycle) is due from the sender.
- **Accounting**: 100% of the cancellation fee belongs to the courier to compensate for time and fuel/effort. No commission debit is posted to the courier's `commission_ledger`.

### Decision 2: Failed Deliveries & Return Trip Protocol
- **Policy**: If a recipient is unreachable or refuses delivery after the courier arrives at drop-off (`ARRIVED_DROPOFF`), the courier logs a failed delivery attempt after at least 3 documented phone call attempts over a 10-minute waiting window.
- **State Flow**: `ARRIVED_DROPOFF` $\rightarrow$ `FAILED` $\rightarrow$ `RETURNED`.
- **Return Fee Handling**: The platform records the failed attempt and return trip. **No arbitrary or undefined return fee is charged automatically**. The courier returns the parcel to the original pickup sender. If the sender refuses to pay the original agreed delivery fare upon parcel return, the courier flags the order for **Administrative Review / Dispute Resolution**.

### Decision 3: Delivery OTP Lifecycle & Timing
- **Generation Timing**: The delivery verification OTP is **generated or refreshed at package pickup** (`PICKED_UP`), not at order creation. This guarantees that an OTP is never sent or sitting with a recipient hours before a courier has even collected the parcel.
- **Validity & Expiry**: The OTP has a **60-minute expiration window** from the moment `PICKED_UP` is recorded.
- **Resend & Refresh**: The sender or system can request an OTP resend. Resending generates a new random code and **immediately invalidates and expires all previous OTP codes** for that delivery.

### Decision 4: OTP Brute-Force Protection & Lockout Recovery
- **Attempt Limit**: A strict maximum of **5 failed OTP attempts** is enforced by the server.
- **Lockout Mechanism**: Upon the 5th failed attempt, OTP verification is locked (`verification_locked = true`), preventing any further attempts by the courier.
- **Controlled Recovery Process**:
  - The courier cannot bypass the lock.
  - Recovery requires either:
    1. The sender triggers an "In-App OTP Reset" (which issues a fresh code and resets attempts to 0), or
    2. A platform administrator performs a **Controlled Emergency Override** after direct telephone identity confirmation with the sender.

### Decision 5: Courier Debt Ceiling & Settlement Verification Integrity
- **Debt Ceiling**: Verified outstanding commission debt $\ge$ **500.00 ETB** immediately blocks the courier from claiming new deliveries.
- **Source of Truth**: The `commission_ledger` is the sole source of truth for debt.
- **Unverified Settlement Submissions**: When a courier submits a Telebirr or CBE payment reference, a ledger record is created with `status = 'pending_verification'`.
- **Integrity Rule**: **Pending settlements DO NOT reduce effective rider debt or unblock job claiming.** Debt is credited only when an administrator verifies the platform's bank/Telebirr statement and marks the settlement as `'settled'`.

---

## 3. Technical & Schema Resolutions

### 3.1 Duplicate Payment Prevention & Idempotency
- **Partial Unique Index**: To allow audit history and retry records while preventing duplicate fee collection, PostgreSQL enforces a partial unique index on successful payments:
  ```sql
  CREATE UNIQUE INDEX idx_payments_single_successful_collection 
  ON payments (delivery_id) 
  WHERE payment_status IN ('collected_unverified', 'collected_cash_rider_confirmed', 'verified');
  ```
- **Idempotency Key**: Payment submission requests require a client-generated UUID `idempotency_key` stored in `payments.idempotency_key` to reject accidental network re-transmissions.
- **State Machine Transitions**:
  - `pending` $\rightarrow$ `collected_cash_rider_confirmed` (Cash)
  - `pending` $\rightarrow$ `collected_unverified` (Telebirr / CBE Birr with reference)
  - `collected_unverified` $\rightarrow$ `verified` (Admin statement reconciliation)
  - `collected_unverified` | `pending` $\rightarrow$ `failed` | `disputed` | `reversed`

### 3.2 Rider Profile Vetting & Compliance Fields
The `rider_profiles` schema is extended with vehicle-conditional compliance fields:
- `ownership_doc_url TEXT NULL`: Mandatory for motorcycles (Libre ownership booklet); optional/null for bicycles.
- `emergency_contact_name VARCHAR(100) NOT NULL`: Mandatory for both motorcycle and bicycle riders.
- `emergency_contact_phone VARCHAR(20) NOT NULL`: Mandatory for both motorcycle and bicycle riders.

### 3.3 Delivery Cancellation Tracking
The `deliveries` schema is extended with explicit cancellation tracking columns:
- `cancelled_by_user_id UUID REFERENCES users(id)`: User who triggered cancellation.
- `cancellation_reason TEXT`: Mandatory reason entered during cancellation.
- `cancellation_fee NUMERIC(12, 2) DEFAULT 0.00`: Billed cancellation fee.

### 3.4 Concurrency Guard: Enforcing One Active Delivery per Rider
- Even under high-concurrency race conditions, a courier can only hold **one active delivery** at any time.
- The atomic claim transaction checks existing active jobs before locking the requested job:
  ```sql
  BEGIN;

  -- 1. Check if rider already holds an active job
  SELECT id FROM deliveries 
  WHERE rider_id = :claiming_rider_id 
    AND status IN ('assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff')
  FOR UPDATE;
  -- If rows exist: ROLLBACK and return 409 Conflict: 'Rider already has an active delivery'.

  -- 2. Atomically claim the target delivery
  UPDATE deliveries
  SET status = 'assigned',
      rider_id = :claiming_rider_id,
      assigned_at = NOW(),
      updated_at = NOW()
  WHERE id = :delivery_id 
    AND status = 'requested' 
    AND rider_id IS NULL
  RETURNING id;
  -- If 0 rows updated: ROLLBACK and return 409 Conflict: 'Job already claimed or unavailable'.

  COMMIT;
  ```

### 3.5 Representation of Unregistered Recipients
- In consumer peer-to-point deliveries where `payer_type = 'receiver'`, the recipient rarely has a registered user account.
- Schema rule: `payments.payer_user_id` is explicitly `NULLABLE`.
- When `payer_type = 'receiver'` and the payer is not registered:
  - `payments.payer_user_id = NULL`.
  - Payer identity is recorded via `deliveries.dropoff_contact_name` and `deliveries.dropoff_contact_phone`.
  - Notes field captures: `"Direct collection from recipient: {name} ({phone})"`.

### 3.6 Cryptographic OTP Security Architecture
- **No Plaintext or Unsalted Hashes**: Numeric 4-digit codes have only 10,000 combinations.
- **Peppered HMAC**: The platform stores `verification_otp_hash` calculated as:
  $$\text{HMAC-SHA256}(\text{ServerSecretPepper}, \text{delivery\_id} + \text{salt} + \text{otp})$$
- Schema columns in `deliveries`:
  - `verification_otp_hash VARCHAR(255) NOT NULL`
  - `verification_otp_salt VARCHAR(64) NOT NULL`
  - `verification_otp_expires_at TIMESTAMPTZ NOT NULL`
  - `verification_otp_used_at TIMESTAMPTZ NULL`
  - `verification_attempts INT NOT NULL DEFAULT 0`
  - `verification_locked BOOLEAN NOT NULL DEFAULT false`

### 3.7 Pricing & Commission Configuration
- Active rates are configurable in `pricing_rules`.
- Seed test defaults for Addis Ababa pilot:
  - Motorcycle: `commission_pct = 15.00`
  - Bicycle: `commission_pct = 10.00`
- Historical immutability: When an order is booked, `deliveries.commission_rate_pct` and `deliveries.commission_amount` snapshot the exact values so future rule modifications never rewrite historical records.

---

## 4. Pre-Stage 2 Approval Checklist

Use this checklist to verify readiness before generating or executing any database schema code:

- [x] **Addis Ababa Pilot Scope**: Geography restricted to Addis Ababa sub-cities and landmarks.
- [x] **Payer Scope**: Restricted to `sender` and `receiver` only; business-account billing deferred.
- [x] **Monetary Precision**: All financial columns typed as `NUMERIC(12, 2)`.
- [x] **Duplicate Payment Shield**: Partial unique index on `payments` preventing multiple successful collections.
- [x] **Debt Ceiling Defense**: Unverified settlement submissions (`pending_verification`) do not reduce active debt balance.
- [x] **Cancellation Tracking**: `deliveries` captures `cancelled_by_user_id`, `cancellation_reason`, and `cancellation_fee` with 0% commission.
- [x] **Failed Delivery Clarity**: Failed attempt and return trip recorded; non-payment escalated for admin dispute resolution without arbitrary return charges.
- [x] **Rider Compliance**: `rider_profiles` includes `ownership_doc_url` (motorcycle Libre) and emergency contact details.
- [x] **Concurrency & Single Active Job**: Atomic claim transaction validates 0 active in-progress jobs per rider.
- [x] **OTP Cryptography & Lifecycle**: 60-minute expiry, refreshed at pickup, invalidated on resend, max 5 attempts with lockout, HMAC-SHA256 peppered hash.
- [x] **Unregistered Recipient Support**: `payments.payer_user_id` is nullable.
- [x] **Branching / Environment Plan**: Schema development and testing targeting a dedicated Neon development branch or database, completely separate from production.

---

## 5. Remaining Post-MVP Questions (Recorded for Future Stages)

The following items are noted for post-pilot stages and do not block Stage 2:
1. **Automated Gateway Reconciliation**: In Stage 7/8, evaluating direct Telebirr/CBE API webhooks to automate reconciliation of `collected_unverified` payments.
2. **Dynamic Distance Adjustments**: In Stage 4, tuning the 1.35x urban street curvature circuity factor against real-world GPS trip data in Addis Ababa.
3. **Formal Tax Invoicing**: In Stage 8, determining Ethiopian Ministry of Revenue electronic tax invoice integration (TOT/VAT).
