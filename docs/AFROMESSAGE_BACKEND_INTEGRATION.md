# AfroMessage SMS Integration Specification

## 1. Overview & Architecture

AfroMessage is an enterprise-grade SMS gateway provider in Ethiopia. This document details the secure server-side integration for SwiftAddis urban motorcycle and bicycle delivery notifications.

### Zero-Trust Frontend Security Rule
- **Never expose AfroMessage credentials (`AFROMESSAGE_API_KEY`) to the React frontend, Vite environment variables, browser network calls, or public GitHub repositories.**
- All SMS dispatch operations execute strictly on the backend (e.g. Neon Functions, Node.js / Express microservice, or serverless webhooks).
- The client application triggers internal delivery state transitions (e.g., `picked_up`, `delivered`). The backend database triggers or endpoint handlers then invoke `server/sms/afroMessageService.ts` asynchronously.
- Failures in SMS delivery **never roll back** core delivery status transitions. Failures are recorded and queued for background retry.

---

## 2. Verified AfroMessage API Specifications

- **Endpoint:** `POST https://api.afromessage.com/api/send` (or `GET` with URL-encoded query parameters)
- **Authentication:** `Authorization: Bearer <AFROMESSAGE_API_KEY>`
- **Request Format:** `Content-Type: application/json`
- **Supported Ethiopian Number Formats:**
  - Standard E.164: `+2519xxxxxxxx` or `+2517xxxxxxxx`
  - Normalized from local formats: `09xxxxxxxx`, `07xxxxxxxx`, `9xxxxxxxx`, `7xxxxxxxx`
- **Request Body Parameters:**
  - `to` *(string, mandatory)*: Normalized recipient phone number (`+251...`)
  - `message` *(string, mandatory)*: UTF-8 notification text
  - `sender` *(string, optional)*: Approved Sender ID (e.g., `SwiftAddis`). Defaults to `AfroMessage` in sandbox/test mode
  - `from` *(string, optional)*: System identifier ID if subscribed to multiple short codes
  - `callback` *(string, optional)*: Webhook URL for asynchronous delivery receipts

---

## 3. Server Environment Variables

Store these variables in the server environment (e.g., `.env` on server or Neon Cloud Console):

```bash
# Mandatory AfroMessage API Token from developer dashboard
AFROMESSAGE_API_KEY="your_secret_afromessage_api_key_here"

# Approved Brand Sender Name (e.g. "SwiftAddis")
# Note: Requires business document verification with Ethio Telecom / Safaricom via AfroMessage
AFROMESSAGE_SENDER_NAME="SwiftAddis"

# Optional Identifier ID for dedicated short codes
AFROMESSAGE_IDENTIFIER_ID=""

# API Base URL (defaults to production endpoint)
AFROMESSAGE_API_URL="https://api.afromessage.com/api/send"
```

---

## 4. Reusable Notification Methods in `server/sms/afroMessageService.ts`

| Method | Trigger Event | Target Recipient | Content | Idempotency Key |
| :--- | :--- | :--- | :--- | :--- |
| `sendDeliveryStartedSMS` | Courier verifies sender OTP & starts transit | Recipient | Order tracking #, courier name, courier phone, estimated arrival (min) | `{deliveryId}:delivery_started:v1` |
| `sendETAUpdatedSMS` | Heavy traffic or detour alters ETA significantly | Recipient | Order tracking #, updated estimated arrival | `{deliveryId}:eta_updated:{newEta}` |
| `sendDeliveryCompletedSMS` | Courier verifies recipient OTP at drop-off | Recipient | Confirmation of successful parcel handover | `{deliveryId}:delivery_completed:v1` |
| `sendDeliveryStatusSMS` | Courier claims job or starts delivery | Sender | Order update & courier contact details | `{deliveryId}:sender_status_{status}:v1` |

---

## 5. Idempotency & PII Protection

1. **Idempotency Guard**: Prevents customer spam when network retries occur. Dispatches are hashed against `{deliveryId}:{event}:{version}`. Duplicate attempts are marked as `skipped_duplicate` without issuing duplicate requests to AfroMessage.
2. **PII Masking**: Logs mask phone numbers (e.g., `+2519****4567`) so customer personal phone numbers are never stored in plain text server logs.

---

## 6. Minimal Backend Integration Steps

When deploying the backend (Node.js/Express, Cloudflare Worker, or Neon Function):

1. **Install Dependencies** (if not already installed): Node 18+ native `fetch` is used with zero extra external dependencies.
2. **Import Service**:
   ```typescript
   import { sendDeliveryStartedSMS } from './server/sms/afroMessageService';
   ```
3. **Invoke upon order lifecycle trigger**:
   ```typescript
   await sendDeliveryStartedSMS({
     deliveryId: order.id,
     trackingNumber: order.trackingNumber,
     recipientName: order.dropoffContactName,
     recipientPhone: order.dropoffContactPhone,
     riderName: rider.name,
     riderPhone: rider.phone,
     estimatedMinutes: order.estimatedDurationMinutes,
   });
   ```
4. **Account & Sender ID Approval**:
   - Register on [afromessage.com](https://afromessage.com).
   - In sandbox mode, messages send with sender ID `AfroMessage`.
   - For custom brand sender name `SwiftAddis`, submit commercial registration to AfroMessage for Ethio Telecom / Safaricom sender ID approval.
