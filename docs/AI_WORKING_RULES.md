# Ethiopian Motorcycle & Bicycle Delivery Platform
## AI Working Rules & Engineering Protocols (`AI_WORKING_RULES.md`)

---

## 1. Purpose & Core Principles

This document establishes the mandatory engineering standards, security protocols, quality gates, and communication rules governing all development work on the Ethiopian Motorcycle and Bicycle Delivery Platform.

As an AI technical lead and pairing partner, these rules must be strictly adhered to across all development stages.

### Core Commandments
1. **Never Invent Business Rules**: If a business rule, tax rate, commission percentage, or operational policy is ambiguous or unspecified, record it as an open question and ask for user clarification. Never fabricate logic.
2. **Work in Small, Testable Stages**: Execute work in accordance with `DEVELOPMENT_ROADMAP.md`. Do not jump ahead or scaffold unrequested features.
3. **Verify Before Declaring Done**: Never declare a task or stage complete until code files exist, builds pass, and relevant tests run successfully.
4. **Never Expose Secrets**: Never log, expose, or request production secrets, API tokens, or database credentials in conversation or client code.
5. **Preserve Existing Code**: Inspect files before modifying them. Do not overwrite or delete existing logic unless explicitly refactoring.

---

## 2. Feature Implementation Protocol

### 2.1 Stage-Gated Workflow
1. **Pre-Flight Check**: Review the active stage objectives and acceptance criteria in `docs/DEVELOPMENT_ROADMAP.md`.
2. **Design Alignment**: Ensure data structures and endpoints align with `docs/DATABASE_DESIGN.md` and `docs/MVP_SPEC.md`.
3. **Incremental Implementation**:
   - Write or update schema / data access layer.
   - Write domain service logic with validation schemas.
   - Expose Server Action or Route Handler with authorization checks.
   - Implement responsive, mobile-first UI components.
4. **Automated Testing**: Write unit or integration tests verifying edge cases and happy paths.
5. **Verification**: Run tests and lint checks locally to confirm zero regressions.

---

## 3. Coding Conventions & Standards

### 3.1 TypeScript & Type Safety
- **Strict Mode**: Enable and adhere to strict TypeScript (`strict: true`, `noImplicitAny: true`).
- **No `any`**: The use of `any` is strictly prohibited. Use explicit types, generics, or `unknown` with Zod parsing.
- **Shared Schemas**: Define validation schemas with **Zod** in domain modules and share them across frontend forms and backend validation:
  ```typescript
  // Example: src/modules/deliveries/schemas.ts
  import { z } from 'zod';

  export const createDeliverySchema = z.object({
    pickupAddress: z.string().min(3),
    pickupLandmark: z.string().min(2),
    pickupSubcity: z.string().min(2),
    pickupPhone: z.string().regex(/^\+251[79]\d{8}$/, 'Must be a valid Ethiopian phone number (+251...)'),
    vehicleType: z.enum(['motorcycle', 'bicycle']),
    packageWeightKg: z.number().positive().max(30),
    payerType: z.enum(['sender', 'receiver', 'business_account']),
  });

  export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
  ```

### 3.2 Monetary & Financial Calculations
- **Never use standard floating-point arithmetic for money** (`0.1 + 0.2 !== 0.3`).
- In the database: Store all currency amounts as `NUMERIC(12, 2)`.
- In TypeScript:
  - Store and calculate in integer cents (e.g., `150.50 ETB` = `15050` cents), or
  - Use exact decimal math libraries (e.g., `decimal.js` or `dinero.js`) for complex rounding.
- Rounding strategy: Standard half-up to two decimal places.

### 3.3 Architecture & Layering
Code must be organized under `src/modules/<module-name>/`:
- **Schemas**: `schemas.ts` (Zod validation).
- **Service**: `service.ts` (Pure business logic, pricing math, state machine rules).
- **Repository / Queries**: `queries.ts` or `mutations.ts` (Drizzle ORM database operations).
- **Actions / Handlers**: `actions.ts` (Next.js Server Actions with session validation).
- **Components**: `components/` (Domain-specific UI elements).

---

## 4. Security & Operational Guardrails

### 4.1 Server-Side Authorization Defense
- **Every Server Action and API Route Handler must independently verify authentication and authorization.**
- Never trust client-supplied user IDs or role claims:
  ```typescript
  // REQUIRED PATTERN:
  export async function claimDeliveryAction(deliveryId: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'rider') {
      throw new UnauthorizedError('Only verified riders can claim deliveries');
    }
    
    // Pass session.user.id directly from the secure server session
    return await deliveryService.claimJob({ deliveryId, riderId: session.user.id });
  }
  ```

### 4.2 Concurrency & State Machine Integrity
- All state transitions and job claims must execute inside an atomic database transaction using row-level locking (`SELECT ... FOR UPDATE` or conditional `UPDATE ... WHERE status = 'expected'`).
- Status jumps that violate the delivery state machine are strictly rejected.

### 4.3 Environment Variable Hygiene
- Private credentials (database connection strings, session secrets, SMS gateway keys) must **NEVER** use the `NEXT_PUBLIC_` prefix.
- Maintain an accurate `.env.example` containing dummy template values for all required environment keys.
- Never commit actual `.env` or `.env.local` files to Git.

---

## 5. Testing & Verification Gates

Before marking any stage or feature as complete, the following checks must be satisfied:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Automated tests
npm run test

# 3. Linter
npm run lint
```

### Testing Hierarchy
1. **Unit Tests (Vitest)**:
   - Pricing calculations across all vehicle types, distance bands, and minimum fares.
   - Delivery state machine valid transitions and illegal transition rejections.
   - Commission ledger calculations and debt threshold calculations.
2. **Integration Tests (Vitest + Neon test branch)**:
   - Atomic job claim concurrency test (simulating simultaneous claims).
   - OTP generation and verification handshake.
   - Ledger debit/credit balance reconciliation.
3. **End-to-End Tests (Playwright)**:
   - Complete lifecycle: Customer booking $\rightarrow$ Rider discovery & claim $\rightarrow$ Pickup $\rightarrow$ Delivery with OTP $\rightarrow$ Commission accrual.

---

## 6. Git & Version Control Policy

### 6.1 Checkpoint Commit Policy
- Commit changes at the completion of each logical unit of work.
- Use Conventional Commits formatting:
  - `feat(auth): implement phone otp authentication`
  - `feat(pricing): add motorcycle and bicycle fare calculation engine`
  - `feat(deliveries): implement atomic job claim with row lock`
  - `fix(ledger): correct commission debt balance query`
  - `test(deliveries): add concurrency claim integration test`
  - `docs: update system architecture with sse dispatch design`

### 6.2 State Preservation
- Inspect repository status before starting changes.
- Never force push or delete untracked user files without explicit instruction.

---

## 7. Reporting & Communication Standards

At the conclusion of each development stage, the AI lead must provide a concise report containing:

1. **Files Created & Modified**: Clickable markdown links to every affected file.
2. **Key Architectural & Implementation Decisions**: Plain-language rationale for technical choices made.
3. **Unresolved Business Decisions**: Explicit list of any open questions or assumptions requiring user input.
4. **Identified Risks**: Operational, financial, or security risks requiring stakeholder attention.
5. **Exact Next Step**: Clear, unambiguous definition of the next action required to start the subsequent stage.
6. **Wait for Approval**: Explicitly pause and await user approval before initiating code changes for the next stage.
