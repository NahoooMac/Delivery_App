import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Bike, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Info,
  Loader2
} from 'lucide-react';
import { SubCity, VehicleType, PayerType, PackageCategory, Delivery, GeoPoint } from '../../types/delivery';
import { calculateFareQuote, getCoordinatesForLandmark } from '../../data/addisLocations';
import { LeafletMap } from './LeafletMap';
import { LocationSearchInput } from './LocationSearchInput';
import { RouteResult, fetchRoadRoute } from '../../services/routingService';

// Validation for Ethiopian mobile numbers (+2519..., +2517..., 09..., 07..., 9..., 7...)
export function isValidEthiopianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+251[79]\d{8}|0[79]\d{8}|[79]\d{8})$/.test(cleaned);
}

interface MapBookingFlowProps {
  onOrderCreated: (delivery: Delivery) => void;
  onGoToDeliveries: () => void;
}

export const MapBookingFlow: React.FC<MapBookingFlowProps> = ({
  onOrderCreated,
  onGoToDeliveries,
}) => {
  // Booking step: 1 = Route & Vehicle, 2 = Package & Contacts, 3 = Payer & Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Route State: Sub-city, landmark label, and exact GPS coordinates
  const [pickupSubcity, setPickupSubcity] = useState<SubCity>('Bole');
  const [pickupLandmark, setPickupLandmark] = useState('Bole Medhanealem Cathedral');
  const [pickupCoords, setPickupCoords] = useState<GeoPoint>(() =>
    getCoordinatesForLandmark('Bole', 'Bole Medhanealem Cathedral')
  );

  const [dropoffSubcity, setDropoffSubcity] = useState<SubCity>('Kirkos');
  const [dropoffLandmark, setDropoffLandmark] = useState('Kazanchis, ECA / UNECA Headquarters');
  const [dropoffCoords, setDropoffCoords] = useState<GeoPoint>(() =>
    getCoordinatesForLandmark('Kirkos', 'Kazanchis, ECA / UNECA Headquarters')
  );

  // Road route and distance state
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | undefined>(undefined);

  // Vehicle Type
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');

  // Contact details - started empty with helpful placeholders
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  // Package details
  const [packageCategory, setPackageCategory] = useState<PackageCategory>('documents');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeightKg, setPackageWeightKg] = useState<number>(1.5);
  const [isFragile, setIsFragile] = useState(false);

  // Payer rule
  const [payerType, setPayerType] = useState<PayerType>('sender');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Monotonic sequence request ID to prevent race conditions where a slower old response overwrites a newer one
  const routeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recalculate road route when either coordinate changes (avoids refetching on unrelated state changes)
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const reqId = ++routeRequestIdRef.current;
    setIsLoadingRoute(true);

    fetchRoadRoute(pickupCoords, dropoffCoords, controller.signal)
      .then((route) => {
        // Discard older, superseded response
        if (reqId !== routeRequestIdRef.current) return;
        setCurrentRoute(route);
        setRoadDistanceKm(route.distanceKm);
        setIsLoadingRoute(false);
      })
      .catch(() => {
        if (reqId !== routeRequestIdRef.current) return;
        setIsLoadingRoute(false);
      });

    return () => {
      controller.abort();
    };
  }, [pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng]);

  const handleSelectPickup = useCallback((sc: SubCity, lm: string, coords?: GeoPoint) => {
    setPickupSubcity(sc);
    setPickupLandmark(lm);
    if (coords) {
      setPickupCoords(coords);
    } else {
      setPickupCoords(getCoordinatesForLandmark(sc, lm));
    }
  }, []);

  const handleSelectDropoff = useCallback((sc: SubCity, lm: string, coords?: GeoPoint) => {
    setDropoffSubcity(sc);
    setDropoffLandmark(lm);
    if (coords) {
      setDropoffCoords(coords);
    } else {
      setDropoffCoords(getCoordinatesForLandmark(sc, lm));
    }
  }, []);

  // Quotes for both vehicles to display in the vehicle cards connected to actual road distance
  const motorcycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'motorcycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const bicycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'bicycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const selectedQuote = vehicleType === 'motorcycle' ? motorcycleQuote : bicycleQuote;

  // Swapping locations swaps both human-friendly labels and exact coordinates
  const handleSwapLocations = useCallback(() => {
    const tempSc = pickupSubcity;
    const tempLm = pickupLandmark;
    const tempCoords = pickupCoords;

    setPickupSubcity(dropoffSubcity);
    setPickupLandmark(dropoffLandmark);
    setPickupCoords(dropoffCoords);

    setDropoffSubcity(tempSc);
    setDropoffLandmark(tempLm);
    setDropoffCoords(tempCoords);
  }, [pickupSubcity, pickupLandmark, pickupCoords, dropoffSubcity, dropoffLandmark, dropoffCoords]);

  const handleStep1Next = () => {
    if (selectedQuote.exceedsLimit) {
      setValidationError(selectedQuote.exceedsLimit);
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!senderName.trim()) {
      setValidationError('Please enter the sender contact name.');
      return;
    }
    if (!senderPhone.trim()) {
      setValidationError('Please enter the sender phone number.');
      return;
    }
    if (!isValidEthiopianPhone(senderPhone)) {
      setValidationError('Please enter a valid Ethiopian phone number for sender (e.g. 0911234567 or +251911234567).');
      return;
    }
    if (!receiverName.trim()) {
      setValidationError('Please enter the recipient contact name.');
      return;
    }
    if (!receiverPhone.trim()) {
      setValidationError('Please enter the recipient phone number.');
      return;
    }
    if (!isValidEthiopianPhone(receiverPhone)) {
      setValidationError('Please enter a valid Ethiopian phone number for recipient (e.g. 0922345678 or +251922345678).');
      return;
    }
    setValidationError(null);
    setStep(3);
  };

  const handleConfirmOrder = () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const trackingNumber = `ET-DEL-${randomSuffix}`;

    const newDelivery: Delivery = {
      id: `del-${Date.now()}`,
      trackingNumber,
      vehicleType,
      status: 'requested',
      pickupAddress: `${pickupLandmark}, ${pickupSubcity}`,
      pickupLandmark,
      pickupSubcity,
      pickupCoords,
      pickupContactName: senderName,
      pickupContactPhone: senderPhone,
      dropoffAddress: `${dropoffLandmark}, ${dropoffSubcity}`,
      dropoffLandmark,
      dropoffSubcity,
      dropoffCoords,
      dropoffContactName: receiverName,
      dropoffContactPhone: receiverPhone,
      packageCategory,
      packageDescription: packageDescription || `${packageCategory.replace('_', ' ')} parcel`,
      packageWeightKg,
      isFragile,
      payerType,
      fareBase: selectedQuote.baseFare,
      fareDistance: selectedQuote.distanceFare,
      fareTotal: selectedQuote.totalFare,
      commissionAmount: selectedQuote.commissionAmount,
      estimatedDistanceKm: selectedQuote.estimatedDistanceKm,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    onOrderCreated(newDelivery);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout: Booking Flow Left, Map Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Yango-Style Guided Booking Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setStep((s) => (s - 1) as 1 | 2);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Step {step} of 3
                  </span>
                  <h2 className="text-sm font-bold text-white">
                    {step === 1 && 'Where to & Vehicle'}
                    {step === 2 && 'Package & Contacts'}
                    {step === 3 && 'Payment & Confirmation'}
                  </h2>
                </div>
              </div>

              {/* Progress Stepper Dots */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s === step
                        ? 'w-6 bg-amber-400'
                        : s < step
                        ? 'w-2 bg-emerald-400'
                        : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Validation Message */}
            {validationError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP 1: ROUTE & VEHICLE SELECTION */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Compact Searchable Route Picker */}
                <LocationSearchInput
                  pickupSubcity={pickupSubcity}
                  pickupLandmark={pickupLandmark}
                  onSelectPickup={handleSelectPickup}
                  dropoffSubcity={dropoffSubcity}
                  dropoffLandmark={dropoffLandmark}
                  onSelectDropoff={handleSelectDropoff}
                  onSwapLocations={handleSwapLocations}
                />

                {/* Vehicle Selection Cards (Yango style) */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Choose Delivery Vehicle
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Motorcycle Card */}
                    <button
                      type="button"
                      aria-pressed={vehicleType === 'motorcycle'}
                      onClick={() => setVehicleType('motorcycle')}
                      className={`relative rounded-2xl border p-3.5 text-left w-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        vehicleType === 'motorcycle'
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              vehicleType === 'motorcycle'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Bike className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Motorcycle</span>
                            <span className="text-[10px] text-slate-400">Up to 30 kg</span>
                          </div>
                        </div>

                        {vehicleType === 'motorcycle' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/80 pt-2">
                        <span className="text-[10px] text-slate-400">
                          {isLoadingRoute ? 'Calculating...' : 'Est. Fare'}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-amber-300">
                          {isLoadingRoute ? (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>...</span>
                            </span>
                          ) : (
                            `${motorcycleQuote.totalFare.toFixed(2)} ETB`
                          )}
                        </span>
                      </div>
                    </button>

                    {/* Bicycle Card */}
                    <button
                      type="button"
                      aria-pressed={vehicleType === 'bicycle'}
                      aria-disabled={Boolean(bicycleQuote.exceedsLimit)}
                      disabled={Boolean(bicycleQuote.exceedsLimit)}
                      onClick={() => {
                        if (!bicycleQuote.exceedsLimit) {
                          setVehicleType('bicycle');
                        }
                      }}
                      className={`relative rounded-2xl border p-3.5 text-left w-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        bicycleQuote.exceedsLimit
                          ? 'border-slate-800/60 bg-slate-950/30 opacity-60 cursor-not-allowed'
                          : vehicleType === 'bicycle'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40 cursor-pointer'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              vehicleType === 'bicycle'
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Bike className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">Bicycle Eco</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Max 5 kg • 7 km</span>
                          </div>
                        </div>

                        {vehicleType === 'bicycle' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between border-t border-slate-800/80 pt-2">
                        <span className="text-[10px] text-slate-400">
                          {isLoadingRoute
                            ? 'Calculating...'
                            : bicycleQuote.exceedsLimit
                            ? 'Not Available'
                            : 'Est. Fare'}
                        </span>
                        <span
                          className={`font-mono text-sm font-extrabold ${
                            bicycleQuote.exceedsLimit ? 'text-slate-500 text-xs' : 'text-emerald-300'
                          }`}
                        >
                          {isLoadingRoute ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>...</span>
                            </span>
                          ) : bicycleQuote.exceedsLimit ? (
                            '> 7 km limit'
                          ) : (
                            `${bicycleQuote.totalFare.toFixed(2)} ETB`
                          )}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleStep1Next}
                  disabled={isLoadingRoute || !roadDistanceKm || Boolean(selectedQuote.exceedsLimit)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingRoute ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating Route & Fare...</span>
                    </>
                  ) : !roadDistanceKm ? (
                    <span>Route Distance Unavailable</span>
                  ) : (
                    <>
                      <span>
                        Continue with {vehicleType === 'motorcycle' ? 'Motorcycle' : 'Bicycle'} •{' '}
                        {selectedQuote.totalFare.toFixed(2)} ETB
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: PACKAGE AND CONTACTS */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Contacts Section */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Contact Information
                  </span>

                  {/* Sender Contact */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Sender (Pickup Contact)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. Abebe Kebede"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="e.g. 0911234567 or +251911..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiver Contact */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Recipient (Drop-off Contact)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          value={receiverName}
                          onChange={(e) => setReceiverName(e.target.value)}
                          placeholder="e.g. Tsedey Alemu"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={receiverPhone}
                          onChange={(e) => setReceiverPhone(e.target.value)}
                          placeholder="e.g. 0922345678 or +251922..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Package Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                      <select
                        value={packageCategory}
                        onChange={(e) => setPackageCategory(e.target.value as PackageCategory)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="documents">Documents / Envelopes</option>
                        <option value="food_perishables">Food & Bakery</option>
                        <option value="electronics">Electronics & Tech</option>
                        <option value="clothing">Clothes & Accessories</option>
                        <option value="fragile_goods">Fragile Merchandise</option>
                        <option value="other">Other Package</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Weight: <strong className="text-amber-400">{packageWeightKg} kg</strong>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max={vehicleType === 'bicycle' ? 5.0 : 30.0}
                        step="0.1"
                        value={packageWeightKg}
                        onChange={(e) => setPackageWeightKg(parseFloat(e.target.value) || 0.1)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="Optional note: e.g. Passport envelope, 2nd floor office"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="fragile-item"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="fragile-item" className="text-xs text-slate-300 cursor-pointer">
                      Fragile package (handle with care)
                    </label>
                  </div>
                </div>

                {/* Next button */}
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition-all"
                >
                  <span>Continue to Payer & Confirmation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 3: PAYER & CONFIRMATION */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Designated Payer Segmented Control */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Who Pays Delivery Fare?
                  </span>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1.5">
                    <button
                      type="button"
                      onClick={() => setPayerType('sender')}
                      className={`rounded-lg py-2 text-xs font-bold transition-all ${
                        payerType === 'sender'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sender Pays
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayerType('receiver')}
                      className={`rounded-lg py-2 text-xs font-bold transition-all ${
                        payerType === 'receiver'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Receiver Pays
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      {payerType === 'sender'
                        ? 'Courier collects fare from sender upon pickup (Cash or Telebirr).'
                        : 'Courier collects fare from receiver before parcel handover (Cash or Telebirr).'}
                    </span>
                  </p>
                </div>

                {/* Final Fare & Route Summary */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                    <span className="text-slate-400">Selected Vehicle</span>
                    <span className="font-semibold text-white capitalize">
                      {vehicleType === 'motorcycle' ? 'Motorcycle (Fast)' : 'Bicycle (Eco)'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Fare</span>
                      <span className="font-mono text-slate-200">
                        {selectedQuote.baseFare.toFixed(2)} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>
                        Distance Charge (~{selectedQuote.estimatedDistanceKm.toFixed(1)} km
                        {currentRoute?.source === 'fallback_estimate' ? ' approx.' : ''})
                      </span>
                      <span className="font-mono text-slate-200">
                        {isLoadingRoute ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>...</span>
                          </span>
                        ) : (
                          `${selectedQuote.distanceFare.toFixed(2)} ETB`
                        )}
                      </span>
                    </div>
                  </div>

                  {currentRoute?.source === 'fallback_estimate' && !isLoadingRoute && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">Approximate Estimate</strong>
                        <span>
                          Road route server is currently unreachable. Displaying approximate straight-line estimate with road curvature factor.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">Total Delivery Fare</span>
                      <span className="text-[10px] text-slate-400">
                        Paid by: <strong className="text-slate-200 capitalize">{payerType}</strong>
                      </span>
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-amber-400">
                      {isLoadingRoute ? (
                        <span className="flex items-center gap-1 text-sm text-amber-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </span>
                      ) : (
                        `${selectedQuote.totalFare.toFixed(2)} ETB`
                      )}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Final delivery fare. No additional platform fee.
                  </p>
                </div>

                {/* Order Confirmation Primary Action */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isLoadingRoute || !roadDistanceKm || roadDistanceKm <= 0}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 px-4 text-xs font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingRoute ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Recalculating Route & Fare...</span>
                    </>
                  ) : !roadDistanceKm ? (
                    <span>Route Distance Unavailable</span>
                  ) : (
                    <>
                      <span>Confirm & Order Delivery • {selectedQuote.totalFare.toFixed(2)} ETB</span>
                      <Check className="h-4 w-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Real OpenStreetMap Map */}
        <div className="lg:col-span-7 space-y-3">
          <LeafletMap
            pickupCoords={pickupCoords}
            pickupSubcity={pickupSubcity}
            pickupLandmark={pickupLandmark}
            onSelectPickup={handleSelectPickup}
            dropoffCoords={dropoffCoords}
            dropoffSubcity={dropoffSubcity}
            dropoffLandmark={dropoffLandmark}
            onSelectDropoff={handleSelectDropoff}
            vehicleType={vehicleType}
            currentRoute={currentRoute}
            isLoadingRoute={isLoadingRoute}
          />

          {/* Quick info bar below map */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Available in all 11 Addis Ababa Sub-Cities</span>
            </div>
            <button
              type="button"
              onClick={onGoToDeliveries}
              className="text-amber-400 hover:text-amber-300 hover:underline text-[11px] font-medium"
            >
              View Active & Past Deliveries →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
