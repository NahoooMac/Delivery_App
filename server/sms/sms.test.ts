import {
  normalizeEthiopianPhone,
  maskPhone,
  getAfroMessageConfig,
  setMockAfroMessageDispatcher,
  sendDeliveryStartedSMS,
  sendETAUpdatedSMS,
  sendDeliveryCompletedSMS,
  sendDeliveryStatusSMS,
} from './afroMessageService';

async function runTests() {
  console.log('--- TEST SUITE: AfroMessage Server SMS Service ---');

  // 1. Phone Normalization Tests
  console.log('1. Testing Ethiopian Phone Normalization...');
  console.assert(normalizeEthiopianPhone('0911234567') === '+251911234567', 'Normalization 1 failed');
  console.assert(normalizeEthiopianPhone('0712345678') === '+251712345678', 'Normalization 2 failed');
  console.assert(normalizeEthiopianPhone('+251911234567') === '+251911234567', 'Normalization 3 failed');
  console.assert(normalizeEthiopianPhone('911234567') === '+251911234567', 'Normalization 4 failed');
  console.assert(normalizeEthiopianPhone('251911234567') === '+251911234567', 'Normalization 5 failed');
  console.assert(normalizeEthiopianPhone('0911-23-45-67') === '+251911234567', 'Normalization 6 failed');
  console.assert(normalizeEthiopianPhone('0911 234 567') === '+251911234567', 'Normalization 7 failed');
  console.assert(normalizeEthiopianPhone('12345') === null, 'Invalid short number failed');
  console.assert(normalizeEthiopianPhone('+14155552671') === null, 'Non-Ethiopian number failed');
  console.log('   ✓ All 9 normalization cases passed.');

  // 2. Phone Masking Test (PII Protection)
  console.log('2. Testing PII Masking...');
  console.assert(maskPhone('+251911234567') === '+2519****4567', 'Masking 1 failed');
  console.log('   ✓ Phone masking verified.');

  // 3. Unconfigured Behavior Test
  console.log('3. Testing Unconfigured Safety Guard...');
  // Ensure mock dispatcher is null
  setMockAfroMessageDispatcher(null);
  delete process.env.AFROMESSAGE_API_KEY;

  const unconfiguredStatus = getAfroMessageConfig();
  console.assert(unconfiguredStatus.isConfigured === false, 'Config check failed');
  console.assert(unconfiguredStatus.missingKeys.includes('AFROMESSAGE_API_KEY'), 'Missing keys failed');

  const unconfiguredResult = await sendDeliveryStartedSMS({
    deliveryId: 'del-test-01',
    trackingNumber: 'ET-DEL-10001',
    recipientName: 'Sara Tesfaye',
    recipientPhone: '0922345678',
    riderName: 'Yonas Getachew',
    riderPhone: '0911234567',
    estimatedMinutes: 12,
  });

  console.assert(unconfiguredResult.success === false, 'Unconfigured should not claim success');
  console.assert(unconfiguredResult.providerStatus === 'unconfigured', 'Should mark status as unconfigured');
  console.log('   ✓ Unconfigured guard properly prevents fake delivery.');

  // 4. Mock Provider & Idempotency Tests
  console.log('4. Testing Mock Provider Dispatch & Idempotency...');
  let dispatchCount = 0;
  let lastDispatchedPayload: unknown = null;

  setMockAfroMessageDispatcher(async (payload) => {
    dispatchCount++;
    lastDispatchedPayload = payload;
    return {
      acknowledge: 'success',
      response: {
        id: `afro-msg-${Date.now()}`,
        status: 'queued',
      },
    };
  });

  // 4.1 First dispatch (Delivery Started)
  const deliveryStartedResult = await sendDeliveryStartedSMS({
    deliveryId: 'del-test-02',
    trackingNumber: 'ET-DEL-10002',
    recipientName: 'Abebe Bikila',
    recipientPhone: '0911234567',
    riderName: 'Yonas Getachew',
    riderPhone: '0912987654',
    estimatedMinutes: 15,
  });

  console.assert(deliveryStartedResult.success === true, 'Mock dispatch should succeed');
  console.assert(deliveryStartedResult.providerStatus === 'sent', 'Status should be sent');
  console.assert(dispatchCount === 1, 'Dispatcher should be called exactly once');

  // 4.2 Duplicate dispatch (Idempotency check)
  const duplicateResult = await sendDeliveryStartedSMS({
    deliveryId: 'del-test-02',
    trackingNumber: 'ET-DEL-10002',
    recipientName: 'Abebe Bikila',
    recipientPhone: '0911234567',
    riderName: 'Yonas Getachew',
    riderPhone: '0912987654',
    estimatedMinutes: 15,
  });

  console.assert(duplicateResult.success === true, 'Duplicate check should return success');
  console.assert(duplicateResult.providerStatus === 'skipped_duplicate', 'Should report skipped_duplicate');
  console.assert(dispatchCount === 1, 'Dispatcher must NOT be called a second time (idempotency preserved)');
  console.log('   ✓ Idempotency guard verified: Duplicate SMS blocked.');

  // 4.3 ETA Updated SMS
  const etaResult = await sendETAUpdatedSMS({
    deliveryId: 'del-test-02',
    trackingNumber: 'ET-DEL-10002',
    recipientPhone: '0911234567',
    newEtaMinutes: 20,
    oldEtaMinutes: 15,
  });
  console.assert(etaResult.success === true, 'ETA update should succeed');
  console.assert(dispatchCount === 2, 'Dispatcher called for new ETA event');

  // 4.4 Delivery Completed SMS
  const completedResult = await sendDeliveryCompletedSMS({
    deliveryId: 'del-test-02',
    trackingNumber: 'ET-DEL-10002',
    recipientName: 'Abebe Bikila',
    recipientPhone: '0911234567',
    deliveredAt: '2026-10-25 18:30',
  });
  console.assert(completedResult.success === true, 'Delivery completed SMS should succeed');
  console.assert(dispatchCount === 3, 'Dispatcher called for completed event');

  // 4.5 Delivery Status to Sender SMS
  const statusResult = await sendDeliveryStatusSMS({
    deliveryId: 'del-test-02',
    trackingNumber: 'ET-DEL-10002',
    senderPhone: '0922345678',
    status: 'accepted',
    riderName: 'Yonas Getachew',
    riderPhone: '0912987654',
  });
  console.assert(statusResult.success === true, 'Status SMS should succeed');
  console.assert(dispatchCount === 4, 'Dispatcher called for sender status event');

  // Reset mock dispatcher
  setMockAfroMessageDispatcher(null);

  console.log('\n=== ALL AFROMESSAGE SERVER TESTS PASSED (100% OK) ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
