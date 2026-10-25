import { Delivery } from '../types/delivery';

export interface SMSClientResult {
  success: boolean;
  event: string;
  recipientMasked?: string;
  providerStatus: 'sent' | 'skipped_duplicate' | 'unconfigured' | 'failed';
  errorMessage?: string;
  providerMessageId?: string;
}

/**
 * Triggers server-side SMS dispatch via backend API (/api/sms/notify).
 * 
 * SECURITY:
 * Never interacts directly with AfroMessage API credentials from browser.
 * All credentials remain securely on the server.
 */
export async function notifyDeliveryEvent(
  event: 'delivery_status' | 'delivery_started' | 'delivery_completed' | 'eta_updated',
  delivery: Delivery,
  rider?: { name: string; phone: string; etaMinutes?: number }
): Promise<SMSClientResult | null> {
  try {
    const res = await fetch('/api/sms/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, delivery, rider }),
    });

    if (!res.ok) {
      console.warn(`[SMS Client] Server SMS endpoint responded with HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as SMSClientResult;
    return data;
  } catch (err) {
    console.warn('[SMS Client] SMS notification dispatch error:', err);
    return null;
  }
}
