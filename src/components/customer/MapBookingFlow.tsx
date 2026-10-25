import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Calendar,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Edit3
} from 'lucide-react';
import { SubCity, VehicleType, PayerType, PackageCategory, Delivery, GeoPoint } from '../../types/delivery';
import { calculateFareQuote, getCoordinatesForLandmark } from '../../data/addisLocations';
import { LeafletMap } from './LeafletMap';
import { LocationSearchInput } from './LocationSearchInput';
import { RouteResult, fetchRoadRoute } from '../../services/routingService';
import { MotorcycleGraphic, BicycleGraphic } from '../common/VehicleGraphics';

// Validation for Ethiopian mobile numbers (+2519..., +2517..., 09..., 07..., 9..., 7...)
export function isValidEthiopianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+251[79]\d{8}|0[79]\d{8}|[79]\d{8})$/.test(cleaned);
}

interface MapBookingFlowProps {
  onOrderCreated: (delivery: Delivery) => void;
  onGoToDeliveries?: () => void;
}

export const MapBookingFlow: React.FC<MapBookingFlowProps> = ({
  onOrderCreated,
  onGoToDeliveries: _onGoToDeliveries,
}) => {
  // Booking step: 1 = Route & Vehicle (Uber Map & Bottom Sheet), 2 = Package & Contacts, 3 = Payment & Confirmation
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

  // Toggle location search editor drawer in Step 1
  const [showLocationEditor, setShowLocationEditor] = useState<boolean>(false);

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

  // Monotonic sequence request ID to prevent race conditions
  const routeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recalculate road route when either coordinate changes
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

  // Quotes for both vehicles connected to actual road distance
  const motorcycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'motorcycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const bicycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'bicycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const selectedQuote = vehicleType === 'motorcycle' ? motorcycleQuote : bicycleQuote;

  // Swapping locations
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

  // Compute dynamic arrival times
  const estMotoMinutes = currentRoute ? Math.max(3, Math.round(currentRoute.durationMinutes * 0.9)) : 10;
  const estBikeMinutes = currentRoute ? Math.max(8, Math.round(currentRoute.distanceKm * 4.5 + 8)) : 22;

  const formatArrival = (mins: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + mins);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

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
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none">
      {/* ================= STEP 1: UBER RIDES MAP & CONFIRM DETAILS SHEET ================= */}
      {step === 1 && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Full Screen Mapbox Leaflet Canvas */}
          <div className="flex-1 w-full relative min-h-[300px]">
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
              showBackButton={false}
            />

            {/* Quick Location Edit Floating Pill at Top */}
            <div className="absolute top-16 left-4 right-4 z-[450]">
              <button
                type="button"
                onClick={() => setShowLocationEditor(!showLocationEditor)}
                className="w-full flex items-center justify-between rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg border border-neutral-200/90 backdrop-blur-md text-left transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-2 w-2 rounded-[1.5px] bg-black"></span>
                    <span className="h-2 w-2 rounded-full border border-black bg-white"></span>
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="truncate font-semibold text-neutral-900">
                      {pickupLandmark.split(',')[0]}
                    </div>
                    <div className="truncate text-neutral-500 text-[11px]">
                      → {dropoffLandmark.split(',')[0]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-lg shrink-0">
                  <Edit3 className="h-3 w-3" />
                  <span>{showLocationEditor ? 'Close' : 'Change'}</span>
                </div>
              </button>

              {/* Expandable Location Editor Drawer */}
              {showLocationEditor && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                  <LocationSearchInput
                    pickupSubcity={pickupSubcity}
                    pickupLandmark={pickupLandmark}
                    onSelectPickup={handleSelectPickup}
                    dropoffSubcity={dropoffSubcity}
                    dropoffLandmark={dropoffLandmark}
                    onSelectDropoff={handleSelectDropoff}
                    onSwapLocations={handleSwapLocations}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Authentic Uber Rides White Bottom Sheet ("Confirm details") */}
          <div className="relative z-[550] bg-white rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.14)] border-t border-neutral-100 px-4 pt-2.5 pb-4 flex flex-col shrink-0">
            {/* Grab handle indicator */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-2" />

            {/* Header: Confirm details */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                Confirm details
              </h2>
              <span className="text-xs text-neutral-500 font-medium">
                {currentRoute ? `~${currentRoute.distanceKm.toFixed(1)} km` : 'Calculating...'}
              </span>
            </div>

            {/* Uber One / Pilot Promo Banner */}
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 text-xs font-semibold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Final delivery fare. No additional platform fee.</span>
            </div>

            {/* Vehicle Selection List (UberX style cards) */}
            <div className="space-y-2 mb-3">
              {/* Option 1: Motorcycle Express */}
              <div
                onClick={() => {
                  setVehicleType('motorcycle');
                  setValidationError(null);
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                  vehicleType === 'motorcycle'
                    ? 'border-2 border-black bg-neutral-50 shadow-sm'
                    : 'border border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 flex items-center justify-center w-14 h-12">
                    <MotorcycleGraphic className="w-14 h-12" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-neutral-900">Motorcycle</span>
                      <span className="text-[11px] font-bold text-neutral-700 bg-neutral-200 px-1.5 py-0.2 rounded">
                        👤 1
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-neutral-800">
                      {formatArrival(estMotoMinutes)} • {estMotoMinutes} min
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">
                      Affordable direct delivery up to 30 kg
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-extrabold text-neutral-900">
                    ETB {motorcycleQuote.totalFare}
                  </div>
                  <div className="text-[11px] text-neutral-400 line-through">
                    ETB {Math.round(motorcycleQuote.totalFare * 1.15)}
                  </div>
                </div>
              </div>

              {/* Option 2: Bicycle Eco */}
              <div
                onClick={() => {
                  setVehicleType('bicycle');
                  setValidationError(null);
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                  vehicleType === 'bicycle'
                    ? 'border-2 border-black bg-neutral-50 shadow-sm'
                    : 'border border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 flex items-center justify-center w-14 h-12">
                    <BicycleGraphic className="w-14 h-12" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-neutral-900">Bicycle Eco</span>
                      <span className="text-[11px] font-bold text-neutral-700 bg-neutral-200 px-1.5 py-0.2 rounded">
                        👤 1
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-neutral-800">
                      {formatArrival(estBikeMinutes)} • {estBikeMinutes} min
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">
                      Zero emissions for parcels up to 5 kg (≤ 7 km)
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-extrabold text-neutral-900">
                    ETB {bicycleQuote.totalFare}
                  </div>
                  {bicycleQuote.exceedsLimit && (
                    <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Limit Exceeded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Validation or Limit Warning */}
            {(validationError || selectedQuote.exceedsLimit) && (
              <div className="mb-2.5 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{validationError || selectedQuote.exceedsLimit}</span>
              </div>
            )}

            {/* Payment Method Selector Pill (Uber style) */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-neutral-900" />
                <span className="font-semibold text-neutral-900">
                  Cash or Telebirr to courier
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </div>

            {/* Signature Uber Solid Black CTA Button */}
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={isLoadingRoute || !!selectedQuote.exceedsLimit}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-center shadow-md transition-all ${
                isLoadingRoute || !!selectedQuote.exceedsLimit
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-neutral-900 active:scale-[0.99]'
              }`}
            >
              {isLoadingRoute ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Calculating Route...</span>
                </span>
              ) : selectedQuote.exceedsLimit ? (
                'Distance Limit Exceeded'
              ) : (
                `Choose ${vehicleType === 'motorcycle' ? 'Motorcycle' : 'Bicycle'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: SCHEDULE AHEAD / DELIVERY DETAILS ================= */}
      {step === 2 && (
        <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
          {/* Header with back arrow */}
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep(1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Delivery details
              </h2>
              <p className="text-[11px] text-neutral-500 truncate max-w-[260px]">
                from {pickupLandmark.split(',')[0]}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {/* Sender Contact Card */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sender Contact (Pickup)
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Sender Full Name (e.g., Abebe Bikila)"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="Sender Phone (0911... or +2519...)"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Recipient Contact Card */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recipient Contact (Drop-off)
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Recipient Full Name (e.g., Sara Tesfaye)"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
                <input
                  type="tel"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Recipient Phone (0922... or +2519...)"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Package Information
              </h3>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'documents', label: 'Documents' },
                  { id: 'food_groceries', label: 'Food / Bakery' },
                  { id: 'electronics', label: 'Electronics' },
                  { id: 'clothing', label: 'Clothes' },
                  { id: 'fragile_items', label: 'Fragile Box' },
                  { id: 'other', label: 'Other Parcel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPackageCategory(cat.id as PackageCategory)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      packageCategory === cat.id
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Weight Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Estimated Weight:</span>
                  <span className="font-extrabold text-neutral-900">{packageWeightKg} kg</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1.5, 3, 5, 10, 20].map((w) => (
                    <button
                      key={w}
                      type="button"
                      disabled={vehicleType === 'bicycle' && w > 5}
                      onClick={() => setPackageWeightKg(w)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        packageWeightKg === w
                          ? 'bg-black text-white'
                          : vehicleType === 'bicycle' && w > 5
                          ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {w}k
                    </button>
                  ))}
                </div>
                {vehicleType === 'bicycle' && (
                  <p className="text-[10px] text-neutral-500">
                    Bicycle fleet is restricted to light packages ≤ 5 kg.
                  </p>
                )}
              </div>

              <input
                type="text"
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Item description (e.g. Contract folder, birthday cake)"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
              />

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-neutral-800">
                <input
                  type="checkbox"
                  checked={isFragile}
                  onChange={(e) => setIsFragile(e.target.checked)}
                  className="rounded border-neutral-300 text-black focus:ring-black h-4 w-4"
                />
                <span className="font-semibold">Fragile or delicate items (Handle with extra care)</span>
              </label>
            </div>

            {/* Uber Feature Info Items (matching Screenshot 2 list style) */}
            <div className="divide-y divide-neutral-100 border-t border-b border-neutral-100 py-2">
              <div className="flex items-start gap-3 py-2.5 text-xs">
                <Calendar className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">Direct courier dispatch</div>
                  <div className="text-[11px] text-neutral-500">
                    Your request is immediately broadcast to nearby couriers.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">OTP code required at pickup</div>
                  <div className="text-[11px] text-neutral-500">
                    Courier must enter sender OTP to unlock package transit.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2.5 text-xs">
                <CreditCard className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">Pay directly to courier</div>
                  <div className="text-[11px] text-neutral-500">
                    Pay in cash or Telebirr upon pickup or delivery.
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
            <button
              type="button"
              onClick={handleStep2Next}
              className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md hover:bg-neutral-900 active:scale-[0.99] transition-all"
            >
              Continue to Payment & Review
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: PAYMENT & CONFIRMATION ================= */}
      {step === 3 && (
        <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep(2);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Review & Confirm
              </h2>
              <p className="text-[11px] text-neutral-500">
                Step 3 of 3 • Ready to dispatch
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Route & Vehicle Summary Card */}
            <div className="rounded-2xl border border-neutral-200 p-3.5 bg-neutral-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-10 flex items-center justify-center">
                    {vehicleType === 'motorcycle' ? (
                      <MotorcycleGraphic className="w-12 h-10" />
                    ) : (
                      <BicycleGraphic className="w-12 h-10" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-neutral-900 text-xs">
                      {vehicleType === 'motorcycle' ? 'Motorcycle Express' : 'Bicycle Eco'}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ~{selectedQuote.estimatedDistanceKm.toFixed(1)} km road distance
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-neutral-900">
                    ETB {selectedQuote.totalFare}
                  </div>
                  <div className="text-[10px] text-neutral-400">Total Fare</div>
                </div>
              </div>

              {/* Route checkpoints */}
              <div className="pt-2 border-t border-neutral-200 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-[1.5px] bg-black mt-1"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-neutral-900 block truncate">
                      {pickupLandmark}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Contact: {senderName} ({senderPhone})
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full border border-black bg-white mt-1"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-neutral-900 block truncate">
                      {dropoffLandmark}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Recipient: {receiverName} ({receiverPhone})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Who Pays Courier Selection */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Who pays the courier?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayerType('sender')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payerType === 'sender'
                      ? 'border-black bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="font-extrabold text-xs text-neutral-900">Sender Pays</div>
                  <div className="text-[10px] text-neutral-500">At pickup location</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayerType('receiver')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    payerType === 'receiver'
                      ? 'border-black bg-neutral-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="font-extrabold text-xs text-neutral-900">Recipient Pays</div>
                  <div className="text-[10px] text-neutral-500">Upon drop-off delivery</div>
                </button>
              </div>
            </div>

            {/* Honest Fare Breakdown */}
            <div className="rounded-2xl border border-neutral-200 p-3.5 bg-white space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Base Fare:</span>
                <span className="font-semibold text-neutral-900">ETB {selectedQuote.baseFare}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Distance Fare (~{selectedQuote.estimatedDistanceKm.toFixed(1)} km):</span>
                <span className="font-semibold text-neutral-900">ETB {selectedQuote.distanceFare}</span>
              </div>
              <div className="pt-2 border-t border-neutral-100 flex justify-between font-extrabold text-sm text-neutral-900">
                <span>Final Delivery Fare:</span>
                <span>ETB {selectedQuote.totalFare}</span>
              </div>
              <p className="text-[10px] text-neutral-400 pt-1">
                Final delivery fare. No additional platform fee. Paid directly to courier via Cash or Telebirr.
              </p>
            </div>
          </div>

          {/* Bottom Confirm Action */}
          <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
            <button
              type="button"
              onClick={handleConfirmOrder}
              className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md hover:bg-neutral-900 active:scale-[0.99] transition-all"
            >
              Confirm Delivery (ETB {selectedQuote.totalFare})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
