import React, { useState } from 'react';
import { 
  Clock, 
  ArrowRight,
  Phone,
  KeyRound,
  Power
} from 'lucide-react';
import { Delivery, VehicleType } from '../../types/delivery';

interface CourierJobBoardPreviewProps {
  deliveries: Delivery[];
  onClaimDelivery: (deliveryId: string) => void;
}

export const CourierJobBoardPreview: React.FC<CourierJobBoardPreviewProps> = ({
  deliveries,
  onClaimDelivery,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'motorcycle' | 'bicycle'>('all');
  const [courierDebt, setCourierDebt] = useState<number>(140.0);
  const [activeJobId, setActiveJobId] = useState<string | null>('mock-del-001'); // holds mock-del-001 initially

  // In-progress delivery progression step:
  // 1: Heading to pickup, 2: At pickup (Enter Sender OTP), 3: In transit, 4: At drop-off (Enter Recipient OTP & Collect Fare)
  const [tripStep, setTripStep] = useState<1 | 2 | 3 | 4>(1);
  const [senderOtpInput, setSenderOtpInput] = useState<string>('');
  const [receiverOtpInput, setReceiverOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Today's earnings ticker
  const [todayEarnings, setTodayEarnings] = useState<number>(1240.0);
  const [tripsCompleted, setTripsCompleted] = useState<number>(4);

  // Active delivery object
  const activeDelivery = deliveries.find((d) => d.id === activeJobId) || (activeJobId === 'mock-del-001' ? {
    id: 'mock-del-001',
    trackingNumber: 'ET-DEL-89241',
    vehicleType: 'motorcycle' as VehicleType,
    status: 'assigned',
    pickupAddress: 'Bole Medhanealem, Cameroon St',
    pickupLandmark: 'Bole Medhanealem Cathedral',
    pickupSubcity: 'Bole',
    pickupContactName: 'Abebe Bikila',
    pickupContactPhone: '+251911234567',
    dropoffAddress: 'Kazanchis, ECA Headquarters',
    dropoffLandmark: 'Kazanchis, ECA / UNECA Headquarters',
    dropoffSubcity: 'Kirkos',
    dropoffContactName: 'Sara Tesfaye',
    dropoffContactPhone: '+251922345678',
    packageCategory: 'documents',
    packageDescription: 'Legal agreement documents folder',
    packageWeightKg: 1.5,
    isFragile: false,
    payerType: 'sender',
    fareBase: 80,
    fareDistance: 105,
    fareTotal: 185,
    commissionAmount: 27.75,
    estimatedDistanceKm: 3.5,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
  } as Delivery : null);

  const availableJobs = deliveries.filter(
    (d) => d.status === 'requested' && (vehicleFilter === 'all' || d.vehicleType === vehicleFilter)
  );

  const handleClaim = (id: string) => {
    if (!isOnline) {
      alert('You are currently Offline. Tap the ONLINE toggle at the top to receive delivery requests.');
      return;
    }
    if (activeJobId) {
      alert('Concurrency Guard Active: You already hold 1 active delivery (ET-DEL-89241). Under platform rules, couriers may only hold exactly one active delivery.');
      return;
    }
    if (courierDebt >= 500) {
      alert('Debt Ceiling Exceeded: Verified commission debt >= 500.00 ETB. Settle commission with admin before claiming new jobs.');
      return;
    }
    setActiveJobId(id);
    setTripStep(1);
    setSenderOtpInput('');
    setReceiverOtpInput('');
    setOtpError(null);
    onClaimDelivery(id);
  };

  // State progression handlers
  const handleArrivedPickup = () => {
    setTripStep(2);
    setOtpError(null);
  };

  const handleVerifySenderOtp = () => {
    if (senderOtpInput.length < 4) {
      setOtpError('Please enter the 4-digit OTP provided by the sender.');
      return;
    }
    setOtpError(null);
    setTripStep(3);
  };

  const handleArrivedDropoff = () => {
    setTripStep(4);
    setOtpError(null);
  };

  const handleCompleteDelivery = () => {
    if (receiverOtpInput.length < 4) {
      setOtpError('Please enter the 4-digit OTP provided by the recipient.');
      return;
    }
    if (!activeDelivery) return;

    // Credit earnings & add commission to debt
    const netEarnings = activeDelivery.fareTotal - activeDelivery.commissionAmount;
    setTodayEarnings((prev) => prev + netEarnings);
    setTripsCompleted((prev) => prev + 1);
    setCourierDebt((prev) => Math.min(500, prev + activeDelivery.commissionAmount));

    // Release concurrency lock
    setActiveJobId(null);
    setTripStep(1);
    setSenderOtpInput('');
    setReceiverOtpInput('');
    setOtpError(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-100 overflow-y-auto select-none p-3 sm:p-4 space-y-3.5 text-neutral-900 font-sans">
      {/* 1. Uber Driver Top Bar: Profile, Status & Online Toggle */}
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

          {/* Big Online/Offline Switcher Button */}
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

        {/* Today's Earnings Bar */}
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

        {/* Commission Debt Ceiling Indicator */}
        <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-600">
              Platform Commission Debt
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCourierDebt((d) => (d >= 500 ? 140 : 520))}
                className="text-[10px] font-bold text-neutral-500 hover:text-black underline"
                title="Simulate reaching debt limit"
              >
                {courierDebt >= 500 ? 'Reset Limit' : 'Simulate Limit (520 ETB)'}
              </button>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-extrabold text-neutral-900 font-mono">
              ETB {courierDebt.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-500">
              Limit: 500.00 ETB
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                courierDebt >= 500 ? 'bg-rose-500' : courierDebt > 350 ? 'bg-amber-500' : 'bg-black'
              }`}
              style={{ width: `${Math.min(100, (courierDebt / 500) * 100)}%` }}
            />
          </div>

          {courierDebt >= 500 && (
            <p className="text-[10px] font-bold text-rose-600">
              ⚠️ Debt limit reached. Settle commission with admin to claim new deliveries.
            </p>
          )}
        </div>
      </div>

      {/* 2. Active Job Mode (In-Progress Delivery Tracker) */}
      {activeDelivery && (
        <div className="rounded-2xl border-2 border-black bg-white p-3.5 shadow-md space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Active Delivery in Progress
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-neutral-700">
              {activeDelivery.trackingNumber}
            </span>
          </div>

          {/* Step Progress Indicators */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { num: 1, label: 'To Pickup' },
              { num: 2, label: 'Pickup OTP' },
              { num: 3, label: 'In Transit' },
              { num: 4, label: 'Drop-off' },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-1 rounded-lg text-[9px] font-bold ${
                  tripStep === s.num
                    ? 'bg-black text-white'
                    : tripStep > s.num
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {tripStep > s.num ? '✓ ' : ''}{s.label}
              </div>
            ))}
          </div>

          {/* Dynamic Step Content */}
          {tripStep === 1 && (
            <div className="space-y-2 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                  Pickup Destination
                </span>
                <div className="font-bold text-neutral-900 text-sm">
                  {activeDelivery.pickupLandmark}
                </div>
                <div className="text-[11px] text-neutral-500">{activeDelivery.pickupSubcity} Sub-City</div>
                <div className="mt-2 flex items-center justify-between border-t border-neutral-200/60 pt-1.5">
                  <span className="font-medium text-neutral-700">
                    Sender: {activeDelivery.pickupContactName}
                  </span>
                  <a
                    href={`tel:${activeDelivery.pickupContactPhone}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-black bg-neutral-200 px-2 py-0.5 rounded-lg"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleArrivedPickup}
                className="w-full bg-black text-white font-bold py-3 rounded-xl text-xs hover:bg-neutral-800 transition-all shadow-sm"
              >
                I Have Arrived at Pickup
              </button>
            </div>
          )}

          {tripStep === 2 && (
            <div className="space-y-2 text-xs">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <KeyRound className="h-4 w-4 text-amber-700" />
                  <span>Ask Sender for 4-Digit Pickup OTP</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Verify package receipt before starting transit to protect delivery custody.
                </p>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  maxLength={4}
                  value={senderOtpInput}
                  onChange={(e) => setSenderOtpInput(e.target.value)}
                  placeholder="Enter 4-digit OTP (e.g. 4819)"
                  className="w-full text-center tracking-widest font-mono text-base font-bold py-2.5 rounded-xl border border-neutral-300 focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSenderOtpInput('4819')}
                  className="text-[10px] text-neutral-500 hover:text-black underline block text-center w-full"
                >
                  Auto-fill demo OTP (4819)
                </button>
              </div>

              {otpError && (
                <p className="text-[11px] font-bold text-rose-600 text-center">{otpError}</p>
              )}

              <button
                type="button"
                onClick={handleVerifySenderOtp}
                className="w-full bg-black text-white font-bold py-3 rounded-xl text-xs hover:bg-neutral-800 transition-all shadow-sm"
              >
                Verify OTP & Start Trip
              </button>
            </div>
          )}

          {tripStep === 3 && (
            <div className="space-y-2 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                  Drop-off Destination
                </span>
                <div className="font-bold text-neutral-900 text-sm">
                  {activeDelivery.dropoffLandmark}
                </div>
                <div className="text-[11px] text-neutral-500">{activeDelivery.dropoffSubcity} Sub-City</div>
                <div className="mt-2 flex items-center justify-between border-t border-neutral-200/60 pt-1.5">
                  <span className="font-medium text-neutral-700">
                    Recipient: {activeDelivery.dropoffContactName}
                  </span>
                  <a
                    href={`tel:${activeDelivery.dropoffContactPhone}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-black bg-neutral-200 px-2 py-0.5 rounded-lg"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleArrivedDropoff}
                className="w-full bg-black text-white font-bold py-3 rounded-xl text-xs hover:bg-neutral-800 transition-all shadow-sm"
              >
                I Have Arrived at Drop-off
              </button>
            </div>
          )}

          {tripStep === 4 && (
            <div className="space-y-2 text-xs">
              {/* Payment collect banner */}
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    {activeDelivery.payerType === 'sender' ? 'Sender Pre-paid' : 'Collect from Recipient'}
                  </span>
                  <span className="font-black text-base text-emerald-900 font-mono">
                    ETB {activeDelivery.fareTotal.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900">
                  Cash / Telebirr
                </span>
              </div>

              {/* Recipient OTP */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                  Enter Recipient Drop-off OTP
                </span>
                <input
                  type="text"
                  maxLength={4}
                  value={receiverOtpInput}
                  onChange={(e) => setReceiverOtpInput(e.target.value)}
                  placeholder="Enter recipient OTP (e.g. 7192)"
                  className="w-full text-center tracking-widest font-mono text-base font-bold py-2 rounded-xl border border-neutral-300 focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setReceiverOtpInput('7192')}
                  className="text-[10px] text-neutral-500 hover:text-black underline block text-center w-full"
                >
                  Auto-fill demo OTP (7192)
                </button>
              </div>

              {otpError && (
                <p className="text-[11px] font-bold text-rose-600 text-center">{otpError}</p>
              )}

              <button
                type="button"
                onClick={handleCompleteDelivery}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-emerald-700 transition-all shadow-md"
              >
                Complete Delivery & Release Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Incoming Delivery Trip Radar (Available Jobs Feed) */}
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

          {/* Vehicle Type Filter Pills */}
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
              Switch to Customer App and book a delivery to test the driver feed.
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
                    {job.payerType === 'sender' ? 'Sender Pays Cash' : 'Recipient Pays Cash/Telebirr'}
                  </span>
                </div>

                {/* Accept Button */}
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
