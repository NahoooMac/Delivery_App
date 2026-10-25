import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ArrowRight,
  Phone,
  Power,
  CheckCircle,
  MapPin,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { Delivery, DeliveryAuditEntry, PaymentMethod } from '../../types/delivery';
import { getCoordinatesForLandmark } from '../../data/addisLocations';
import { SlideToConfirm } from './SlideToConfirm';
import { RiderDeliveryMap } from './RiderDeliveryMap';
import { notifyDeliveryEvent } from '../../services/smsClient';

interface CourierJobBoardPreviewProps {
  deliveries: Delivery[];
  onClaimDelivery: (deliveryId: string) => void;
  onUpdateDelivery?: (delivery: Delivery) => void;
}

// 8-step lifecycle:
// 1: Accept delivery (Trip Radar claim)
// 2: Navigate to pickup (Show sender's location, call button, navigation map)
// 3: Arrived at pickup (Rider confirms arrival at pickup)
// 4: Package picked up (Slide to confirm, without OTP)
// 5: Navigate to recipient (Show drop-off location, recipient phone, call button, navigation map)
// 6: Arrived at drop-off (Rider confirms arrival at recipient)
// 7: Delivered (Slide to confirm delivery, without OTP)
// 8: Payment confirmation (Fare breakdown, who pays, payment record)
type RiderTripStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const CourierJobBoardPreview: React.FC<CourierJobBoardPreviewProps> = ({
  deliveries,
  onClaimDelivery,
  onUpdateDelivery,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'motorcycle' | 'bicycle'>('all');
  const [courierDebt, setCourierDebt] = useState<number>(140.0);
  const [activeJobId, setActiveJobId] = useState<string | null>('mock-del-001');

  // 8-step lifecycle progression
  const [tripStep, setTripStep] = useState<RiderTripStep>(2);

  // Today's earnings ticker
  const [todayEarnings, setTodayEarnings] = useState<number>(1240.0);
  const [tripsCompleted, setTripsCompleted] = useState<number>(4);

  // Payment Confirmation State (Step 8)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [collectedAmount, setCollectedAmount] = useState<number>(133.0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<'collected' | 'pending'>('collected');

  // Toggle for Audit Trail Drawer
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(false);

  // Active delivery object
  const activeDelivery = deliveries.find((d) => d.id === activeJobId) || (activeJobId === 'mock-del-001' ? {
    id: 'mock-del-001',
    trackingNumber: 'ET-DEL-89241',
    vehicleType: 'motorcycle' as const,
    status: 'assigned' as const,
    pickupAddress: 'Namibia Street, Atlas Area',
    pickupLandmark: 'Atlas Hotel Junction, Namibia St',
    pickupSubcity: 'Bole' as const,
    pickupCoords: { lat: 9.0142, lng: 38.7825 },
    pickupContactName: 'Abebe Tadesse',
    pickupContactPhone: '+251911234567',
    dropoffAddress: 'ECA Road, Kazanchis',
    dropoffLandmark: 'Kazanchis, ECA / UNECA Headquarters',
    dropoffSubcity: 'Kirkos' as const,
    dropoffCoords: { lat: 9.0177, lng: 38.7686 },
    dropoffContactName: 'Hiwot Bekele',
    dropoffContactPhone: '+251922345678',
    packageCategory: 'documents' as const,
    packageDescription: 'Signed legal contract documents in sealed envelope',
    packageWeightKg: 0.8,
    isFragile: false,
    payerType: 'sender' as const,
    fareBase: 85.0,
    fareDistance: 48.0,
    fareTotal: 133.0,
    commissionAmount: 20.0,
    estimatedDistanceKm: 4.2,
    paymentStatus: 'pending' as const,
    createdAt: new Date().toISOString(),
    acceptedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        action: 'order_accepted',
        note: 'Delivery accepted by courier Yonas Getachew (Motorcycle)',
        actor: 'Rider: Yonas Getachew',
      },
    ],
  } as Delivery : null);

  // Sync initial tripStep based on existing delivery status
  useEffect(() => {
    if (!activeDelivery) return;

    if (activeDelivery.status === 'assigned') {
      setTripStep(2);
    } else if (activeDelivery.status === 'arrived_pickup') {
      setTripStep(3);
    } else if (activeDelivery.status === 'picked_up') {
      setTripStep(5);
    } else if (activeDelivery.status === 'arrived_dropoff') {
      setTripStep(6);
    } else if (activeDelivery.status === 'delivered') {
      setTripStep(8);
    }

    if (activeDelivery.fareTotal) {
      setCollectedAmount(activeDelivery.fareTotal);
    }
  }, [activeDelivery?.status, activeDelivery?.fareTotal]);

  const availableJobs = deliveries.filter(
    (d) => d.status === 'requested' && (vehicleFilter === 'all' || d.vehicleType === vehicleFilter)
  );

  // Helper to add audit trail entry and trigger state update
  const logAuditAndSync = (
    action: string,
    note: string,
    extraFields: Partial<Delivery>
  ) => {
    if (!activeDelivery) return;

    const now = new Date().toISOString();
    const newEntry: DeliveryAuditEntry = {
      timestamp: now,
      action,
      note,
      actor: 'Rider: Yonas Getachew (AA-2-B48192)',
    };

    const currentTrail = activeDelivery.auditTrail || [];
    const updatedDelivery: Delivery = {
      ...activeDelivery,
      ...extraFields,
      auditTrail: [...currentTrail, newEntry],
    };

    if (onUpdateDelivery) {
      onUpdateDelivery(updatedDelivery);
    }
  };

  // 1. Accept Delivery: Rider accepts the request
  const handleClaim = (id: string) => {
    if (!isOnline) {
      alert('You are currently Offline. Tap the ONLINE toggle at the top to receive delivery requests.');
      return;
    }
    if (activeJobId) {
      alert('Concurrency Guard Active: You already hold 1 active delivery. Under platform rules, couriers may only hold exactly one active delivery.');
      return;
    }
    if (courierDebt >= 500) {
      alert('Debt Ceiling Exceeded: Verified commission debt >= 500.00 ETB. Settle commission with admin before claiming new jobs.');
      return;
    }

    const claimedJob = deliveries.find((d) => d.id === id);
    setActiveJobId(id);
    setTripStep(2); // Jump directly to Step 2: Navigate to pickup

    const now = new Date().toISOString();
    const newEntry: DeliveryAuditEntry = {
      timestamp: now,
      action: 'accepted',
      note: 'Delivery accepted by courier Yonas Getachew (Motorcycle)',
      actor: 'Rider: Yonas Getachew',
    };

    if (claimedJob && onUpdateDelivery) {
      onUpdateDelivery({
        ...claimedJob,
        status: 'assigned',
        acceptedAt: now,
        riderName: 'Yonas Getachew',
        riderPhone: '+251912987654',
        riderPlate: 'AA-2-B48192',
        auditTrail: [...(claimedJob.auditTrail || []), newEntry],
      });
    }

    onClaimDelivery(id);

    // Notify customer via SMS (AfroMessage)
    if (claimedJob) {
      notifyDeliveryEvent('delivery_status', claimedJob, {
        name: 'Yonas Getachew',
        phone: '+251912987654',
      });
    }
  };

  // 3. Arrived at pickup: Rider confirms arrival
  const handleArrivedPickup = () => {
    setTripStep(3);
    logAuditAndSync('arrived_pickup', `Rider arrived at pickup landmark: ${activeDelivery?.pickupLandmark}`, {
      status: 'arrived_pickup',
      arrivedPickupAt: new Date().toISOString(),
    });
  };

  // 4. Package picked up: Rider slides to confirm pickup, WITHOUT OTP
  const handleConfirmPickup = () => {
    setTripStep(5); // Advance to Step 5: Navigate to recipient

    const now = new Date().toISOString();
    logAuditAndSync(
      'package_picked_up_no_otp',
      'Package handover confirmed by rider via slider confirmation (No OTP required). Rider takes physical custody of the package.',
      {
        status: 'picked_up',
        pickedUpAt: now,
      }
    );

    // Notify customer via SMS that package is in transit
    if (activeDelivery) {
      notifyDeliveryEvent('delivery_started', activeDelivery, {
        name: 'Yonas Getachew',
        phone: '+251912987654',
        etaMinutes: 15,
      });
    }
  };

  // 6. Arrived at drop-off: Rider confirms arrival
  const handleArrivedDropoff = () => {
    setTripStep(6);
    logAuditAndSync('arrived_dropoff', `Rider arrived at recipient drop-off landmark: ${activeDelivery?.dropoffLandmark}`, {
      status: 'arrived_dropoff',
      arrivedDropoffAt: new Date().toISOString(),
    });
  };

  // 7. Delivered: Rider slides to confirm delivery, WITHOUT OTP
  const handleConfirmDelivery = () => {
    setTripStep(8); // Advance to Step 8: Payment confirmation

    const now = new Date().toISOString();
    logAuditAndSync(
      'delivered_no_otp',
      'Delivery confirmed by rider via slider confirmation (No OTP required). Package handed to recipient.',
      {
        status: 'delivered',
        deliveredAt: now,
      }
    );
  };

  // 8. Payment confirmation: Rider records whether payment was collected
  const handleConfirmPayment = () => {
    if (!activeDelivery) return;

    const now = new Date().toISOString();
    const finalPaymentStatus =
      paymentStatusChoice === 'collected'
        ? paymentMethod === 'cash'
          ? 'collected_cash_rider_confirmed'
          : 'verified'
        : 'pending';

    logAuditAndSync(
      'payment_recorded',
      `Payment status recorded as ${finalPaymentStatus} (${paymentMethod}) by rider. Amount: ETB ${collectedAmount.toFixed(2)}. ${paymentNotes ? 'Notes: ' + paymentNotes : ''}`,
      {
        paymentStatus: finalPaymentStatus,
        paymentCollectedAt: now,
        paymentCollectedMethod: paymentMethod,
        paymentCollectedBy: activeDelivery.payerType,
        paymentAmountCollected: collectedAmount,
        paymentNotes: paymentNotes || undefined,
      }
    );

    // Credit earnings & add commission to debt
    const netEarnings = activeDelivery.fareTotal - activeDelivery.commissionAmount;
    setTodayEarnings((prev) => prev + netEarnings);
    setTripsCompleted((prev) => prev + 1);
    setCourierDebt((prev) => Math.min(500, prev + activeDelivery.commissionAmount));

    // Notify customer via SMS that delivery & payment are complete
    notifyDeliveryEvent('delivery_completed', activeDelivery);

    // Release concurrency lock & reset
    setActiveJobId(null);
    setTripStep(1);
    alert(`Delivery ${activeDelivery.trackingNumber} successfully completed and closed!`);
  };

  // Rider position coordinates (Bole / central corridor)
  const riderCoords = { lat: 9.0108, lng: 38.7613 };
  const pickupCoords =
    activeDelivery?.pickupCoords ||
    (activeDelivery ? getCoordinatesForLandmark(activeDelivery.pickupSubcity, activeDelivery.pickupLandmark) : { lat: 9.0142, lng: 38.7825 });
  const dropoffCoords =
    activeDelivery?.dropoffCoords ||
    (activeDelivery ? getCoordinatesForLandmark(activeDelivery.dropoffSubcity, activeDelivery.dropoffLandmark) : { lat: 9.0177, lng: 38.7686 });

  return (
    <div className="w-full h-full flex flex-col bg-neutral-100 overflow-y-auto select-none p-3 sm:p-4 space-y-4 text-neutral-900 font-sans">
      {/* 1. Rider Top Bar: Profile, Vehicle & Online Switch */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white font-extrabold text-sm shadow-md">
                YG
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-neutral-900">Yonas Getachew</h3>
                <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                  ★ 4.95
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Motorcycle • AA-2-B48192 • Libre Verified
              </p>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-sm transition-all active:scale-95 ${
              isOnline
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>

        {/* Daily Stats Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs">
          <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-200/70">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Today's Net Earnings</span>
            <span className="text-base font-black text-neutral-900 font-mono">
              ETB {todayEarnings.toFixed(2)}
            </span>
          </div>
          <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-200/70">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Trips Completed</span>
            <span className="text-base font-black text-neutral-900 font-mono">
              {tripsCompleted} deliveries
            </span>
          </div>
        </div>

        {/* Commission Debt Indicator */}
        <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-600">
              Platform Commission Debt
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Limit: 500.00 ETB
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-extrabold text-neutral-900 font-mono">
              ETB {courierDebt.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-500 font-bold">
              {courierDebt >= 500 ? 'Ceiling Reached' : `${(500 - courierDebt).toFixed(2)} ETB available`}
            </span>
          </div>

          <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                courierDebt >= 500 ? 'bg-rose-500' : courierDebt > 350 ? 'bg-amber-500' : 'bg-black'
              }`}
              style={{ width: `${Math.min(100, (courierDebt / 500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active 8-Step Rider Workflow Card */}
      {activeDelivery && (
        <div className="rounded-2xl border-2 border-black bg-white p-3.5 sm:p-4 shadow-md space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Active Order
              </span>
              <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                {activeDelivery.trackingNumber}
              </span>
            </div>
            <span className="text-[11px] font-bold text-neutral-500">
              Step {tripStep} of 8
            </span>
          </div>

          {/* 8-Step Visual Lifecycle Timeline */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
            {[
              { num: 1, label: '1. Accept' },
              { num: 2, label: '2. To Pickup' },
              { num: 3, label: '3. At Pickup' },
              { num: 4, label: '4. Pick Up' },
              { num: 5, label: '5. To Drop-off' },
              { num: 6, label: '6. At Drop-off' },
              { num: 7, label: '7. Delivered' },
              { num: 8, label: '8. Payment' },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-1 px-0.5 rounded-lg text-[9px] font-bold truncate transition-colors ${
                  tripStep === s.num
                    ? 'bg-black text-white shadow-xs'
                    : tripStep > s.num
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {tripStep > s.num ? '✓ ' : ''}{s.label}
              </div>
            ))}
          </div>

          {/* ============================================================ */}
          {/* STEP 2: Navigate to pickup (Show sender's location, call button) */}
          {/* ============================================================ */}
          {tripStep === 2 && (
            <div className="space-y-3">
              {/* Interactive Yandex / Mapbox Route to Pickup */}
              <RiderDeliveryMap
                currentStage="to_pickup"
                originCoords={riderCoords}
                originName="Courier Location (Bole)"
                destinationCoords={pickupCoords}
                destinationName={activeDelivery.pickupLandmark}
                vehicleType={activeDelivery.vehicleType}
              />

              {/* Sender Location & Direct Call Card */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider block">
                      Pickup Destination • Sender Contact
                    </span>
                    <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                      {activeDelivery.pickupLandmark}
                    </h4>
                    <p className="text-xs text-neutral-600">
                      {activeDelivery.pickupAddress} ({activeDelivery.pickupSubcity} Sub-City)
                    </p>
                  </div>
                </div>

                {/* Sender Call Button */}
                <div className="flex items-center justify-between border-t border-neutral-200/70 pt-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-neutral-500 block">Sender Name</span>
                    <span className="font-bold text-xs text-neutral-900 block truncate">
                      {activeDelivery.pickupContactName}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-600">
                      {activeDelivery.pickupContactPhone}
                    </span>
                  </div>

                  <a
                    href={`tel:${activeDelivery.pickupContactPhone}`}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-black shadow hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Sender</span>
                  </a>
                </div>
              </div>

              {/* Package Detail Pills */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 bg-neutral-100 rounded-xl px-3 py-2">
                <span className="font-medium">
                  📦 {activeDelivery.packageDescription} ({activeDelivery.packageWeightKg} kg)
                </span>
                <span className="font-bold text-neutral-700">
                  {activeDelivery.isFragile ? '⚠️ Fragile' : 'Standard'}
                </span>
              </div>

              {/* Action Button: Confirm Arrival at Pickup */}
              <button
                type="button"
                onClick={handleArrivedPickup}
                className="w-full bg-black text-white font-extrabold py-3.5 rounded-xl text-xs hover:bg-neutral-800 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                <span>I Have Arrived at Pickup</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Arrived at pickup: Rider confirms arrival */}
          {/* STEP 4: Package picked up: Rider slides to confirm pickup, WITHOUT OTP */}
          {/* ============================================================ */}
          {(tripStep === 3 || tripStep === 4) && (
            <div className="space-y-3 animate-in fade-in">
              {/* Pickup Arrival Confirmation Banner */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Arrived at Pickup Location</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Contact sender <span className="font-bold">{activeDelivery.pickupContactName}</span> to receive the package. Verify that package is intact.
                </p>
              </div>

              {/* Sender Details & Call */}
              <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Sender</span>
                  <span className="font-bold text-xs text-neutral-900 block">
                    {activeDelivery.pickupContactName}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-600">
                    {activeDelivery.pickupContactPhone}
                  </span>
                </div>
                <a
                  href={`tel:${activeDelivery.pickupContactPhone}`}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-black transition-all"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* OTP Elimination Notice & Slide to Confirm */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>No OTP Required • Slide Below to Confirm Custody</span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Package receipt is validated by your explicit confirmation and logged into the platform audit ledger.
                </p>

                {/* Tactile Slider Button */}
                <SlideToConfirm
                  label="Slide to Confirm Pickup >>>"
                  confirmedLabel="Package Picked Up!"
                  colorScheme="emerald"
                  onConfirm={handleConfirmPickup}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: Navigate to recipient (Show drop-off location, recipient's phone, call button) */}
          {/* ============================================================ */}
          {tripStep === 5 && (
            <div className="space-y-3 animate-in fade-in">
              {/* Interactive Map from Pickup to Recipient */}
              <RiderDeliveryMap
                currentStage="to_dropoff"
                originCoords={pickupCoords}
                originName={activeDelivery.pickupLandmark}
                destinationCoords={dropoffCoords}
                destinationName={activeDelivery.dropoffLandmark}
                vehicleType={activeDelivery.vehicleType}
              />

              {/* Recipient Destination Card */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">
                    Drop-off Destination • Recipient
                  </span>
                  <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                    {activeDelivery.dropoffLandmark}
                  </h4>
                  <p className="text-xs text-neutral-600">
                    {activeDelivery.dropoffAddress} ({activeDelivery.dropoffSubcity} Sub-City)
                  </p>
                </div>

                {/* Recipient Contact & Call Button */}
                <div className="flex items-center justify-between border-t border-neutral-200/70 pt-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-neutral-500 block">Recipient Name</span>
                    <span className="font-bold text-xs text-neutral-900 block truncate">
                      {activeDelivery.dropoffContactName}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-600">
                      {activeDelivery.dropoffContactPhone}
                    </span>
                  </div>

                  <a
                    href={`tel:${activeDelivery.dropoffContactPhone}`}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-black shadow hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Recipient</span>
                  </a>
                </div>
              </div>

              {/* Action Button: Arrived at Drop-off */}
              <button
                type="button"
                onClick={handleArrivedDropoff}
                className="w-full bg-black text-white font-extrabold py-3.5 rounded-xl text-xs hover:bg-neutral-800 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                <span>I Have Arrived at Drop-off</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: Arrived at drop-off: Rider confirms arrival */}
          {/* STEP 7: Delivered: Rider slides to confirm delivery, WITHOUT OTP */}
          {/* ============================================================ */}
          {(tripStep === 6 || tripStep === 7) && (
            <div className="space-y-3 animate-in fade-in">
              {/* Arrived at Drop-off Banner */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Arrived at Recipient Destination</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Deliver package to <span className="font-bold">{activeDelivery.dropoffContactName}</span> at {activeDelivery.dropoffLandmark}.
                </p>
              </div>

              {/* Recipient Details & Call */}
              <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Recipient</span>
                  <span className="font-bold text-xs text-neutral-900 block">
                    {activeDelivery.dropoffContactName}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-600">
                    {activeDelivery.dropoffContactPhone}
                  </span>
                </div>
                <a
                  href={`tel:${activeDelivery.dropoffContactPhone}`}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-black transition-all"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* OTP Elimination Notice & Slide to Confirm Delivery */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>No OTP Required • Slide Below to Confirm Delivery</span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Hand over the package to the recipient and slide to record successful delivery.
                </p>

                {/* Tactile Slider Button */}
                <SlideToConfirm
                  label="Slide to Confirm Delivery >>>"
                  confirmedLabel="Delivery Handed Over!"
                  colorScheme="black"
                  onConfirm={handleConfirmDelivery}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 8: Payment confirmation: Fare breakdown, who pays & record */}
          {/* ============================================================ */}
          {tripStep === 8 && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Fare Breakdown Card */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                    Delivery Fare Breakdown
                  </span>
                  <span className="font-black text-base text-neutral-900 font-mono">
                    ETB {activeDelivery.fareTotal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Base Fare (First km allowance)</span>
                    <span className="font-mono font-medium">ETB {activeDelivery.fareBase.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Fare ({activeDelivery.estimatedDistanceKm} km)</span>
                    <span className="font-mono font-medium">ETB {activeDelivery.fareDistance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 text-[11px]">
                    <span>Platform Commission ({activeDelivery.vehicleType === 'motorcycle' ? '15%' : '10%'})</span>
                    <span className="font-mono">- ETB {activeDelivery.commissionAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t border-neutral-200/60 pt-1.5">
                    <span>Your Net Payout (Courier)</span>
                    <span className="font-mono text-sm">
                      ETB {(activeDelivery.fareTotal - activeDelivery.commissionAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WHO PAYS Indicator Banner */}
              <div
                className={`rounded-xl p-3 border text-xs space-y-1 ${
                  activeDelivery.payerType === 'sender'
                    ? 'bg-blue-50 border-blue-200 text-blue-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black uppercase text-[11px]">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {activeDelivery.payerType === 'sender'
                      ? 'Payer Rule: Sender Pays at Pickup'
                      : 'Payer Rule: Recipient Pays at Delivery'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {activeDelivery.payerType === 'sender'
                    ? `The sender (${activeDelivery.pickupContactName}) was designated to pay the fare at pickup.`
                    : `The recipient (${activeDelivery.dropoffContactName}) must pay the courier ETB ${activeDelivery.fareTotal.toFixed(2)} now.`}
                </p>
              </div>

              {/* Payment Record Options */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">
                  Select Payment Collection Method
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'telebirr', label: '📱 Telebirr' },
                    { id: 'cbe_birr', label: '🏦 CBE Birr' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Amount and Status */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                      Amount Collected (ETB)
                    </label>
                    <input
                      type="number"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatusChoice}
                      onChange={(e) => setPaymentStatusChoice(e.target.value as 'collected' | 'pending')}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none"
                    >
                      <option value="collected">Payment Received</option>
                      <option value="pending">Pay Later / Credit</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional reference / txn note (e.g. Telebirr Txn #)"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                />
              </div>

              {/* Complete & Finalize Button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Confirm Payment & Complete Order</span>
              </button>
            </div>
          )}

          {/* Expandable Audit Trail Viewer */}
          <div className="border-t border-neutral-100 pt-2">
            <button
              type="button"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center justify-between w-full text-xs text-neutral-500 font-bold hover:text-black py-1"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-neutral-400" />
                <span>Audit Trail & Timestamps ({activeDelivery.auditTrail?.length || 0} records)</span>
              </div>
              {showAuditTrail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAuditTrail && (
              <div className="mt-2 space-y-2 rounded-xl bg-neutral-50 p-3 border border-neutral-200 text-xs font-mono max-h-48 overflow-y-auto">
                {activeDelivery.auditTrail && activeDelivery.auditTrail.length > 0 ? (
                  activeDelivery.auditTrail.map((entry, idx) => (
                    <div key={idx} className="border-b border-neutral-200/60 pb-1.5 last:border-b-0 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span className="font-bold text-neutral-700 uppercase">{entry.action}</span>
                      </div>
                      <p className="text-[11px] text-neutral-800">{entry.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400 text-center text-[10px]">No audit entries yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Available Delivery Trip Radar (Jobs Feed) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800">
              Trip Radar: Available Jobs
            </h4>
            <span className="h-4 px-1.5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
              {availableJobs.length}
            </span>
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-neutral-200 text-[10px]">
            <button
              type="button"
              onClick={() => setVehicleFilter('all')}
              className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                vehicleFilter === 'all' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter('motorcycle')}
              className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                vehicleFilter === 'motorcycle' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
              }`}
            >
              Moto
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter('bicycle')}
              className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                vehicleFilter === 'bicycle' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
              }`}
            >
              Bike
            </button>
          </div>
        </div>

        {/* List of Incoming Requests */}
        {availableJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center space-y-1">
            <Clock className="mx-auto h-6 w-6 text-neutral-400" />
            <p className="text-xs font-bold text-neutral-700">No unassigned delivery requests</p>
            <p className="text-[10px] text-neutral-400">
              Go to User Side to request a delivery and test rider acceptance.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {availableJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-2.5 shadow-sm hover:border-neutral-400 transition-all"
              >
                {/* Header: Vehicle & Estimated Payout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-neutral-900 font-mono">
                      {job.trackingNumber}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                      {job.vehicleType === 'motorcycle' ? 'Motorcycle' : 'Bicycle Eco'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-neutral-900 font-mono block">
                      ETB {job.fareTotal.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      Net: {(job.fareTotal - job.commissionAmount).toFixed(2)} ETB
                    </span>
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-[1.5px] bg-black shrink-0"></span>
                    <span className="truncate font-medium text-neutral-800">
                      {job.pickupLandmark} ({job.pickupSubcity})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full border border-black bg-white shrink-0"></span>
                    <span className="truncate font-medium text-neutral-800">
                      {job.dropoffLandmark} ({job.dropoffSubcity})
                    </span>
                  </div>
                </div>

                {/* Package & Payment Summary */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5">
                  <span>{job.packageDescription} ({job.packageWeightKg} kg)</span>
                  <span className="font-semibold text-neutral-700">
                    {job.payerType === 'sender' ? 'Sender Pays' : 'Recipient Pays'}
                  </span>
                </div>

                {/* Accept Button (Step 1) */}
                <button
                  type="button"
                  onClick={() => handleClaim(job.id)}
                  disabled={!isOnline || !!activeJobId || courierDebt >= 500}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                    !isOnline || !!activeJobId || courierDebt >= 500
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]'
                  }`}
                >
                  <span>Accept Delivery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
