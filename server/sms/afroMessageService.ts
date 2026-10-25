/**
 * AfroMessage SMS Service (Server-side Only)
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - This service runs strictly in a server-side Node.js / Serverless environment (e.g. Neon Functions, Express, Cloudflare Workers).
 * - Never import or execute this file in client-side React code or browser bundles.
 * - Credentials (AFROMESSAGE_API_KEY) are read exclusively from server-side environment variables.
 * 
 * Provider Documentation:
 * - API Endpoint: POST https://api.afromessage.com/api/send
 * - Auth: Authorization: Bearer {AFROMESSAGE_API_KEY}
 * - Payload: { to, message, sender?, from?, callback? }
 */

export interface AfroMessageSendPayload {
  to: string;
  message: string;
  sender?: string;
  from?: string;
  callback?: string;
}

export interface AfroMessageResponse {
  acknowledge: 'success' | 'error';
  response?: {
    id?: string;
    status?: string;
    details?: unknown;
  };
  error?: string;
}

export interface SMSNotificationResult {
  success: boolean;
  event: 'delivery_started' | 'eta_updated' | 'delivery_completed' | 'delivery_status';
  recipientMasked: string;
  idempotencyKey: string;
  providerStatus: 'sent' | 'skipped_duplicate' | 'unconfigured' | 'failed';
  providerMessageId?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface AfroMessageConfig {
  apiKey?: string;
  senderName?: string;
  identifierId?: string;
  apiUrl?: string;
}

// In-memory idempotency cache (keyed by idempotencyKey)
// In production clustered backends, replace with Redis or Postgres table
const processedEvents = new Set<string>();

/**
 * Normalizes Ethiopian phone numbers to international E.164 format:
 * - 0911234567 -> +251911234567
 * - 0712345678 -> +251712345678
 * - +251911234567 -> +251911234567
 * - 911234567 -> +251911234567
 * Returns null if the phone number is invalid.
 */
export function normalizeEthiopianPhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // 1. +251 9... or +251 7... (13 chars)
  if (/^\+251[79]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // 2. 09... or 07... (10 digits) -> convert to +251
  if (/^0[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }

  // 3. 9... or 7... (9 digits) -> convert to +251
  if (/^[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`;
  }

  // 4. 2519... or 2517... (12 digits) -> add +
  if (/^251[79]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Masks phone numbers for secure logging without exposing sensitive PII:
 * +251911234567 -> +2519****4567
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return '****';
  return `${phone.slice(0, 5)}****${phone.slice(-4)}`;
}

/**
 * Checks server-side configuration status for AfroMessage.
 */
export function getAfroMessageConfig(): {
  isConfigured: boolean;
  missingKeys: string[];
  config: AfroMessageConfig;
} {
  const apiKey = process.env.AFROMESSAGE_API_KEY || '';
  const senderName = process.env.AFROMESSAGE_SENDER_NAME || 'AfroMessage';
  const identifierId = process.env.AFROMESSAGE_IDENTIFIER_ID || '';
  const apiUrl = process.env.AFROMESSAGE_API_URL || 'https://api.afromessage.com/api/send';

  const missingKeys: string[] = [];
  if (!apiKey) {
    missingKeys.push('AFROMESSAGE_API_KEY');
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    config: {
      apiKey,
      senderName,
      identifierId,
      apiUrl,
    },
  };
}

// Optional mock dispatcher function for testing
let mockDispatcher: ((payload: AfroMessageSendPayload) => Promise<AfroMessageResponse>) | null = null;

export function setMockAfroMessageDispatcher(
  fn: ((payload: AfroMessageSendPayload) => Promise<AfroMessageResponse>) | null
): void {
  mockDispatcher = fn;
}

/**
 * Internal low-level dispatcher to AfroMessage HTTP API.
 * Never exposes API key in client responses or public logs.
 */
async function dispatchSMS(
  payload: AfroMessageSendPayload,
  idempotencyKey: string
): Promise<AfroMessageResponse> {
  // If mock dispatcher is injected (for automated unit testing)
  if (mockDispatcher) {
    return mockDispatcher(payload);
  }

  const { isConfigured, config } = getAfroMessageConfig();

  if (!isConfigured) {
    console.warn(
      `[AfroMessage] SMS dispatch skipped: Service unconfigured. Missing AFROMESSAGE_API_KEY. (Target: ${maskPhone(payload.to)})`
    );
    return {
      acknowledge: 'error',
      error: 'AFROMESSAGE_API_KEY is not configured in server environment.',
    };
  }

  const requestBody = {
    to: payload.to,
    message: payload.message,
    ...(payload.sender ? { sender: payload.sender } : config.senderName ? { sender: config.senderName } : {}),
    ...(payload.from ? { from: payload.from } : config.identifierId ? { from: config.identifierId } : {}),
    ...(payload.callback ? { callback: payload.callback } : {}),
  };

  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      acknowledge: 'error',
      error: `AfroMessage HTTP ${response.status}: ${errorText.slice(0, 150)}`,
    };
  }

  const data = (await response.json()) as AfroMessageResponse;
  return data;
}

/**
 * 1. Delivery Started SMS
 * Trigger: When courier collects the parcel from sender and starts transit.
 * Recipient: Recipient of the delivery.
 */
export async function sendDeliveryStartedSMS(params: {
  deliveryId: string;
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  riderName: string;
  riderPhone: string;
  estimatedMinutes: number;
}): Promise<SMSNotificationResult> {
  const timestamp = new Date().toISOString();
  const idempotencyKey = `${params.deliveryId}:delivery_started:v1`;
  const normalizedPhone = normalizeEthiopianPhone(params.recipientPhone);

  if (!normalizedPhone) {
    return {
      success: false,
      event: 'delivery_started',
      recipientMasked: maskPhone(params.recipientPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: `Invalid Ethiopian phone number: ${params.recipientPhone}`,
      timestamp,
    };
  }

  // Idempotency check: Do not send duplicate SMS if event is retried
  if (processedEvents.has(idempotencyKey)) {
    return {
      success: true,
      event: 'delivery_started',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'skipped_duplicate',
      timestamp,
    };
  }

  const message = `SwiftAddis Delivery: Hello ${params.recipientName}, your parcel (${params.trackingNumber}) is on its way with courier ${params.riderName} (${params.riderPhone}). Est. arrival: ~${params.estimatedMinutes} mins.`;

  try {
    const { isConfigured } = getAfroMessageConfig();
    if (!isConfigured && !mockDispatcher) {
      return {
        success: false,
        event: 'delivery_started',
        recipientMasked: maskPhone(normalizedPhone),
        idempotencyKey,
        providerStatus: 'unconfigured',
        errorMessage: 'AfroMessage credentials not configured on server.',
        timestamp,
      };
    }

    const res = await dispatchSMS({ to: normalizedPhone, message }, idempotencyKey);
    const success = res.acknowledge === 'success';

    if (success) {
      processedEvents.add(idempotencyKey);
    }

    return {
      success,
      event: 'delivery_started',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: success ? 'sent' : 'failed',
      providerMessageId: res.response?.id,
      errorMessage: res.error,
      timestamp,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[AfroMessage] Delivery started SMS error for ${maskPhone(normalizedPhone)}:`, errMsg);
    return {
      success: false,
      event: 'delivery_started',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: errMsg,
      timestamp,
    };
  }
}

/**
 * 2. ETA Updated SMS
 * Trigger: When road traffic or conditions cause significant arrival time changes.
 * Recipient: Recipient of the delivery.
 */
export async function sendETAUpdatedSMS(params: {
  deliveryId: string;
  trackingNumber: string;
  recipientPhone: string;
  newEtaMinutes: number;
  oldEtaMinutes: number;
}): Promise<SMSNotificationResult> {
  const timestamp = new Date().toISOString();
  // Idempotency key incorporates new ETA to allow valid updates while preventing duplicates
  const idempotencyKey = `${params.deliveryId}:eta_updated:${params.newEtaMinutes}`;
  const normalizedPhone = normalizeEthiopianPhone(params.recipientPhone);

  if (!normalizedPhone) {
    return {
      success: false,
      event: 'eta_updated',
      recipientMasked: maskPhone(params.recipientPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: 'Invalid Ethiopian phone number.',
      timestamp,
    };
  }

  if (processedEvents.has(idempotencyKey)) {
    return {
      success: true,
      event: 'eta_updated',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'skipped_duplicate',
      timestamp,
    };
  }

  const message = `SwiftAddis Delivery Update: Order ${params.trackingNumber} ETA adjusted. New estimated arrival is ~${params.newEtaMinutes} mins.`;

  try {
    const { isConfigured } = getAfroMessageConfig();
    if (!isConfigured && !mockDispatcher) {
      return {
        success: false,
        event: 'eta_updated',
        recipientMasked: maskPhone(normalizedPhone),
        idempotencyKey,
        providerStatus: 'unconfigured',
        errorMessage: 'AfroMessage credentials not configured.',
        timestamp,
      };
    }

    const res = await dispatchSMS({ to: normalizedPhone, message }, idempotencyKey);
    const success = res.acknowledge === 'success';

    if (success) {
      processedEvents.add(idempotencyKey);
    }

    return {
      success,
      event: 'eta_updated',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: success ? 'sent' : 'failed',
      providerMessageId: res.response?.id,
      errorMessage: res.error,
      timestamp,
    };
  } catch (err: unknown) {
    return {
      success: false,
      event: 'eta_updated',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      timestamp,
    };
  }
}

/**
 * 3. Delivery Completed SMS
 * Trigger: When recipient OTP is verified and parcel is successfully handed over.
 * Recipient: Recipient of the delivery.
 */
export async function sendDeliveryCompletedSMS(params: {
  deliveryId: string;
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  deliveredAt: string;
}): Promise<SMSNotificationResult> {
  const timestamp = new Date().toISOString();
  const idempotencyKey = `${params.deliveryId}:delivery_completed:v1`;
  const normalizedPhone = normalizeEthiopianPhone(params.recipientPhone);

  if (!normalizedPhone) {
    return {
      success: false,
      event: 'delivery_completed',
      recipientMasked: maskPhone(params.recipientPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: 'Invalid Ethiopian phone number.',
      timestamp,
    };
  }

  if (processedEvents.has(idempotencyKey)) {
    return {
      success: true,
      event: 'delivery_completed',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'skipped_duplicate',
      timestamp,
    };
  }

  const message = `SwiftAddis Delivery: Package ${params.trackingNumber} has been delivered successfully. Thank you for choosing SwiftAddis!`;

  try {
    const { isConfigured } = getAfroMessageConfig();
    if (!isConfigured && !mockDispatcher) {
      return {
        success: false,
        event: 'delivery_completed',
        recipientMasked: maskPhone(normalizedPhone),
        idempotencyKey,
        providerStatus: 'unconfigured',
        errorMessage: 'AfroMessage credentials not configured.',
        timestamp,
      };
    }

    const res = await dispatchSMS({ to: normalizedPhone, message }, idempotencyKey);
    const success = res.acknowledge === 'success';

    if (success) {
      processedEvents.add(idempotencyKey);
    }

    return {
      success,
      event: 'delivery_completed',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: success ? 'sent' : 'failed',
      providerMessageId: res.response?.id,
      errorMessage: res.error,
      timestamp,
    };
  } catch (err: unknown) {
    return {
      success: false,
      event: 'delivery_completed',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      timestamp,
    };
  }
}

/**
 * 4. Delivery Status SMS to Sender
 * Trigger: When a courier accepts the booking or when delivery begins.
 * Recipient: Sender of the delivery.
 */
export async function sendDeliveryStatusSMS(params: {
  deliveryId: string;
  trackingNumber: string;
  senderPhone: string;
  status: 'accepted' | 'started';
  riderName: string;
  riderPhone: string;
}): Promise<SMSNotificationResult> {
  const timestamp = new Date().toISOString();
  const idempotencyKey = `${params.deliveryId}:sender_status_${params.status}:v1`;
  const normalizedPhone = normalizeEthiopianPhone(params.senderPhone);

  if (!normalizedPhone) {
    return {
      success: false,
      event: 'delivery_status',
      recipientMasked: maskPhone(params.senderPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: 'Invalid Ethiopian phone number.',
      timestamp,
    };
  }

  if (processedEvents.has(idempotencyKey)) {
    return {
      success: true,
      event: 'delivery_status',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'skipped_duplicate',
      timestamp,
    };
  }

  const statusText =
    params.status === 'accepted'
      ? `Courier ${params.riderName} (${params.riderPhone}) has accepted your booking.`
      : `Courier ${params.riderName} has collected your parcel and started transit.`;

  const message = `SwiftAddis: Order ${params.trackingNumber} update: ${statusText}`;

  try {
    const { isConfigured } = getAfroMessageConfig();
    if (!isConfigured && !mockDispatcher) {
      return {
        success: false,
        event: 'delivery_status',
        recipientMasked: maskPhone(normalizedPhone),
        idempotencyKey,
        providerStatus: 'unconfigured',
        errorMessage: 'AfroMessage credentials not configured.',
        timestamp,
      };
    }

    const res = await dispatchSMS({ to: normalizedPhone, message }, idempotencyKey);
    const success = res.acknowledge === 'success';

    if (success) {
      processedEvents.add(idempotencyKey);
    }

    return {
      success,
      event: 'delivery_status',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: success ? 'sent' : 'failed',
      providerMessageId: res.response?.id,
      errorMessage: res.error,
      timestamp,
    };
  } catch (err: unknown) {
    return {
      success: false,
      event: 'delivery_status',
      recipientMasked: maskPhone(normalizedPhone),
      idempotencyKey,
      providerStatus: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      timestamp,
    };
  }
}
