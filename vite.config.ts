import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { 
  sendDeliveryStartedSMS, 
  sendDeliveryStatusSMS, 
  sendDeliveryCompletedSMS,
  sendETAUpdatedSMS,
  getAfroMessageConfig 
} from './server/sms/afroMessageService';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.AFROMESSAGE_API_KEY) {
    process.env.AFROMESSAGE_API_KEY = env.AFROMESSAGE_API_KEY;
  }
  if (env.AFROMESSAGE_IDENTIFIER_ID) {
    process.env.AFROMESSAGE_IDENTIFIER_ID = env.AFROMESSAGE_IDENTIFIER_ID;
  }
  if (env.AFROMESSAGE_SENDER_NAME) {
    process.env.AFROMESSAGE_SENDER_NAME = env.AFROMESSAGE_SENDER_NAME;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'afromessage-server-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/sms/status' && req.method === 'GET') {
              const status = getAfroMessageConfig();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ isConfigured: status.isConfigured }));
              return;
            }

            if (req.url === '/api/sms/notify' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const { event, delivery, rider } = data;
                  let result;

                  if (event === 'delivery_status') {
                    result = await sendDeliveryStatusSMS({
                      deliveryId: delivery.id,
                      trackingNumber: delivery.trackingNumber,
                      senderPhone: delivery.pickupContactPhone,
                      status: 'accepted',
                      riderName: rider?.name || 'Assigned Courier',
                      riderPhone: rider?.phone || '+251912987654',
                    });
                  } else if (event === 'delivery_started') {
                    result = await sendDeliveryStartedSMS({
                      deliveryId: delivery.id,
                      trackingNumber: delivery.trackingNumber,
                      recipientName: delivery.dropoffContactName,
                      recipientPhone: delivery.dropoffContactPhone,
                      riderName: rider?.name || 'Assigned Courier',
                      riderPhone: rider?.phone || '+251912987654',
                      estimatedMinutes: rider?.etaMinutes || 15,
                    });
                  } else if (event === 'delivery_completed') {
                    result = await sendDeliveryCompletedSMS({
                      deliveryId: delivery.id,
                      trackingNumber: delivery.trackingNumber,
                      recipientName: delivery.dropoffContactName,
                      recipientPhone: delivery.dropoffContactPhone,
                      deliveredAt: new Date().toISOString(),
                    });
                  } else if (event === 'eta_updated') {
                    result = await sendETAUpdatedSMS({
                      deliveryId: delivery.id,
                      trackingNumber: delivery.trackingNumber,
                      recipientPhone: delivery.dropoffContactPhone,
                      newEtaMinutes: rider?.etaMinutes || 20,
                      oldEtaMinutes: 15,
                    });
                  } else {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: `Unknown event: ${event}` }));
                    return;
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (err: unknown) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  const message = err instanceof Error ? err.message : 'Server SMS dispatch error';
                  res.end(JSON.stringify({ error: message }));
                }
              });
              return;
            }

            next();
          });
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
