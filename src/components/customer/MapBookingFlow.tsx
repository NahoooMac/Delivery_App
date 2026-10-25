import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Crosshair,
  AlertCircle, 
  Loader2,
  Phone,
  X,
  ShieldAlert,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin
} from 'lucide-react';
import { SubCity, VehicleType, PayerType, PackageCategory, Delivery, GeoPoint } from '../../types/delivery';
import { calculateFareQuote, getCoordinatesForLandmark, findNearestLandmark } from '../../data/addisLocations';
import { LeafletMap } from './LeafletMap';
import { LocationSearchInput } from './LocationSearchInput';
import { RouteResult, fetchRoadRoute } from '../../services/routingService';
import { MotorcycleGraphic, BicycleGraphic } from '../common/VehicleGraphics';
import { notifyDeliveryEvent } from '../../services/smsClient';

// Validation for Ethiopian mobile numbers (+2519..., +2517..., 09..., 07..., 9..., 7...)
export function isValidEthiopianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+251[79]\d{8}|0[79]\d{8}|[79]\d{8})$/.test(cleaned);
}

export type BookingStep = 'route' | 'vehicle' | 'details' | 'review';

interface MapBookingFlowProps {
  onOrderCreated: (delivery: Delivery) => void;
  onGoToDeliveries?: () => void;
}

export const MapBookingFlow: React.FC<MapBookingFlowProps> = ({
  onOrderCreated,
}) => {
  // Mode: 'booking' (step-by-step sheet) or 'tracking' (post-request tracking screen)
  const [viewMode, setViewMode] = useState<'booking' | 'tracking'>('booking');
  const [bookingStep, setBookingStep] = useState<BookingStep>('route');

  // Real GPS Geolocation & Permission State
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [showGpsPrompt, setShowGpsPrompt] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

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

  // Expandable location selector drawer
  const [isEditingLocations, setIsEditingLocations] = useState<boolean>(false);

  // Road route and distance state
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | undefined>(undefined);

  // Vehicle Type
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');

  // Minimum required delivery details
  const packageCategory: PackageCategory = 'documents';
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeightKg, setPackageWeightKg] = useState<number>(1.5);
  const isFragile = false;

  // Contacts
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Who pays rule
  const [payerType, setPayerType] = useState<PayerType>('sender');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active tracking state (post-request)
  const [activeOrder, setActiveOrder] = useState<Delivery | null>(null);
  const [assignedRider, setAssignedRider] = useState<{
    name: string;
    phone: string;
    plate: string;
    rating: number;
    etaMinutes: number;
  } | null>(null);

  // Sequence request ID for road routing
  const routeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Location Permission & Real GPS Handling
  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setShowGpsPrompt(false);
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setShowGpsPrompt(false);
        const { latitude: lat, longitude: lng } = position.coords;
        setUserLocation({ lat, lng });

        // Check if user location is approximately within Addis Ababa metropolitan area
        // (lat ~ 8.8 to 9.2, lng ~ 38.6 to 38.9)
        const isWithinAddis = lat >= 8.8 && lat <= 9.2 && lng >= 38.6 && lng <= 38.95;

        if (isWithinAddis) {
          const nearest = findNearestLandmark(lat, lng);
          setPickupCoords({ lat, lng });
          setPickupSubcity(nearest.subcity);
          setPickupLandmark(`Current Location near ${nearest.landmark}`);
        } else {
          // Do NOT fake GPS coordinates! Honestly inform the user
          setGpsError(
            `Detected GPS coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) are outside Addis Ababa. Defaulted pickup to Addis center (Bole). You can adjust pickup manually.`
          );
        }
      },
      (err) => {
        setIsLocating(false);
        setShowGpsPrompt(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location access was denied. You can select your pickup manually on the map.');
        } else {
          setGpsError('Unable to detect GPS position. Please select pickup location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Recalculate road route when coordinates change
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

  // Quotes for both vehicles
  const motorcycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'motorcycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const bicycleQuote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, 'bicycle', packageWeightKg, roadDistanceKm);
  }, [pickupSubcity, dropoffSubcity, packageWeightKg, roadDistanceKm]);

  const selectedQuote = vehicleType === 'motorcycle' ? motorcycleQuote : bicycleQuote;

  // Location swapping
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

  // Step 3 -> Step 4 Transition Validation
  const handleProceedToReview = () => {
    if (!recipientName.trim()) {
      setValidationError('Please enter the recipient full name.');
      return;
    }
    if (!recipientPhone.trim()) {
      setValidationError('Please enter the recipient phone number.');
      return;
    }
    if (!isValidEthiopianPhone(recipientPhone)) {
      setValidationError('Please enter a valid Ethiopian phone number for recipient (e.g. 0922345678 or +251922345678).');
      return;
    }
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

    setValidationError(null);
    setBookingStep('review');
  };

  // Step 4: Final Request Delivery Handler
  const handleRequestDelivery = () => {
    if (selectedQuote.exceedsLimit) {
      setValidationError(selectedQuote.exceedsLimit);
      return;
    }

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
      dropoffContactName: recipientName,
      dropoffContactPhone: recipientPhone,
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

    setActiveOrder(newDelivery);
    setViewMode('tracking');
    onOrderCreated(newDelivery);

    // Trigger backend AfroMessage SMS notification to sender (accepted)
    notifyDeliveryEvent('delivery_status', newDelivery).catch(() => {});

    // Simulate demo rider assignment after 2.5 seconds
    setTimeout(() => {
      const assigned = {
        name: vehicleType === 'motorcycle' ? 'Yonas Getachew' : 'Kidus Haile',
        phone: '+251912987654',
        plate: vehicleType === 'motorcycle' ? 'AA-2-B48192' : 'Bicycle Eco Fleet',
        rating: 4.95,
        etaMinutes: 10,
      };
      setAssignedRider(assigned);

      // Trigger backend AfroMessage SMS notification to recipient (delivery started)
      notifyDeliveryEvent('delivery_started', newDelivery, assigned).catch(() => {});
    }, 2500);
  };

  const handleCancelOrder = () => {
    setActiveOrder(null);
    setAssignedRider(null);
    setBookingStep('route');
    setViewMode('booking');
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] flex flex-col bg-neutral-100 overflow-hidden select-none">
      {/* 1. FULL-SCREEN ADDIS ABABA MAP (Background Canvas) */}
      <div className="absolute inset-0 w-full h-full z-0">
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
          userLocation={userLocation}
          onRequestLocation={handleRequestLocation}
          isLocating={isLocating}
        />
      </div>

      {/* 2. REAL GPS LOCATION PERMISSION PROMPT BANNER */}
      {showGpsPrompt && (
        <div className="absolute top-20 left-4 right-4 sm:left-6 sm:max-w-md z-[500] animate-in fade-in slide-in-from-top-4">
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shrink-0">
                  <Crosshair className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-neutral-900">
                    Enable Location for Fast Pickup
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Automatically detect your pickup address in Addis Ababa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGpsPrompt(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={isLocating}
                className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <span>Use My Location</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowGpsPrompt(false)}
                className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-black border border-neutral-200 rounded-xl"
              >
                Set Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Notice / Warning if outside Addis or denied */}
      {gpsError && (
        <div className="absolute top-20 left-4 right-4 sm:left-6 sm:max-w-md z-[500] animate-in fade-in">
          <div className="flex items-center justify-between rounded-xl bg-neutral-900 text-white px-3.5 py-2.5 text-xs shadow-xl">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="truncate">{gpsError}</span>
            </div>
            <button type="button" onClick={() => setGpsError(null)}>
              <X className="h-3.5 w-3.5 text-neutral-400 hover:text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 3. STEP-BY-STEP USER BOOKING SHEET */}
      {viewMode === 'booking' && (
        <div className="relative z-20 mt-auto sm:ml-6 mb-16 sm:mb-6 sm:max-w-md w-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.18)] border border-neutral-200/80 p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
            {/* Grab Notch Handle */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

            {/* Step Progress Bar Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                {(['route', 'vehicle', 'details', 'review'] as BookingStep[]).map((step, idx) => {
                  const stepOrder: BookingStep[] = ['route', 'vehicle', 'details', 'review'];
                  const currentIdx = stepOrder.indexOf(bookingStep);
                  const isDone = currentIdx > idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div key={step} className="flex items-center gap-1">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                          isCurrent
                            ? 'bg-black text-white shadow-sm'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
                      </div>
                      {idx < 3 && (
                        <div
                          className={`h-0.5 w-3.5 rounded-full ${
                            isDone ? 'bg-emerald-600' : 'bg-neutral-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tight">
                {bookingStep === 'route' && '1. Set Route'}
                {bookingStep === 'vehicle' && '2. Vehicle'}
                {bookingStep === 'details' && '3. Details'}
                {bookingStep === 'review' && '4. Review'}
              </span>
            </div>

            {/* STEP 1: ROUTE SELECTION */}
            {bookingStep === 'route' && (
              <div className="space-y-3 animate-in fade-in">
                {/* Compact Pickup & Destination Fields */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-2.5 space-y-1.5">
                  {/* Pickup Row */}
                  <div
                    onClick={() => setIsEditingLocations(true)}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200 cursor-pointer hover:border-black transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-600 shrink-0"></span>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">Pickup</span>
                        <span className="text-xs font-bold text-neutral-900 block truncate">
                          {pickupLandmark.split(',')[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      Change
                    </span>
                  </div>

                  {/* Drop-off Row */}
                  <div
                    onClick={() => setIsEditingLocations(true)}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200 cursor-pointer hover:border-black transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-black bg-white shrink-0"></span>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">Destination</span>
                        <span className="text-xs font-bold text-neutral-900 block truncate">
                          {dropoffLandmark.split(',')[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      Change
                    </span>
                  </div>
                </div>

                {/* Location Search Modal/Drawer */}
                {isEditingLocations && (
                  <div className="relative z-30 animate-in fade-in">
                    <LocationSearchInput
                      pickupSubcity={pickupSubcity}
                      pickupLandmark={pickupLandmark}
                      onSelectPickup={handleSelectPickup}
                      dropoffSubcity={dropoffSubcity}
                      dropoffLandmark={dropoffLandmark}
                      onSelectDropoff={handleSelectDropoff}
                      onSwapLocations={handleSwapLocations}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingLocations(false)}
                      className="mt-2 w-full text-center text-xs font-bold text-neutral-600 hover:text-black py-1.5 bg-neutral-100 rounded-xl"
                    >
                      Done Editing Route
                    </button>
                  </div>
                )}

                {/* Distance & Route Estimation Chip */}
                <div className="flex items-center justify-between px-1 text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    {isLoadingRoute ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                        <span>Calculating route...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-black" />
                        <span>Road distance: ~{roadDistanceKm?.toFixed(1) || '4.0'} km</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-black underline"
                  >
                    Swap Ends
                  </button>
                </div>

                {/* Step 1 Continue CTA */}
                <button
                  type="button"
                  onClick={() => setBookingStep('vehicle')}
                  disabled={isLoadingRoute}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2 ${
                    isLoadingRoute
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-900 active:scale-[0.99]'
                  }`}
                >
                  <span>Continue: Choose Vehicle</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 2: VEHICLE SELECTION */}
            {bookingStep === 'vehicle' && (
              <div className="space-y-3 animate-in fade-in">
                {/* Route Summary Chip */}
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-2.5 border border-neutral-200/80 text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-neutral-900">{pickupLandmark.split(',')[0]}</span>
                    <span className="text-neutral-400 mx-1">→</span>
                    <span className="font-bold text-neutral-900">{dropoffLandmark.split(',')[0]}</span>
                    <span className="text-[11px] text-neutral-500 ml-1.5">
                      (~{roadDistanceKm?.toFixed(1) || '4'} km)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingStep('route')}
                    className="text-[11px] font-bold text-neutral-600 hover:text-black shrink-0 underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Vehicle Choice Cards */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Choose Delivery Type
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Motorcycle Card */}
                    <div
                      onClick={() => {
                        setVehicleType('motorcycle');
                        setValidationError(null);
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        vehicleType === 'motorcycle'
                          ? 'border-2 border-black bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-neutral-900">Motorcycle</span>
                        <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1 rounded">
                          ≤ 30kg
                        </span>
                      </div>
                      <div className="w-12 h-9 flex items-center justify-center my-1">
                        <MotorcycleGraphic className="w-12 h-9" />
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-black text-neutral-900 font-mono">
                          ETB {motorcycleQuote.totalFare}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          ~{currentRoute ? Math.round(currentRoute.durationMinutes * 0.9) : 10} min
                        </span>
                      </div>
                    </div>

                    {/* Bicycle Card */}
                    <div
                      onClick={() => {
                        setVehicleType('bicycle');
                        setValidationError(null);
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        vehicleType === 'bicycle'
                          ? 'border-2 border-black bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-neutral-900">Bicycle Eco</span>
                        <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1 rounded">
                          ≤ 5kg
                        </span>
                      </div>
                      <div className="w-12 h-9 flex items-center justify-center my-1">
                        <BicycleGraphic className="w-12 h-9" />
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-black text-neutral-900 font-mono">
                          ETB {bicycleQuote.totalFare}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          ~{currentRoute ? Math.round(currentRoute.distanceKm * 4.5 + 8) : 22} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {bicycleQuote.exceedsLimit && vehicleType === 'bicycle' && (
                    <p className="text-[10px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      ⚠️ {bicycleQuote.exceedsLimit} (Switch to Motorcycle)
                    </p>
                  )}
                </div>

                {/* Step 2 Navigation Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBookingStep('route')}
                    className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep('details')}
                    disabled={!!selectedQuote.exceedsLimit}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs text-center shadow-md transition-all flex items-center justify-center gap-1.5 ${
                      selectedQuote.exceedsLimit
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-neutral-900'
                    }`}
                  >
                    <span>Continue: Package Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PACKAGE & CONTACT DETAILS */}
            {bookingStep === 'details' && (
              <div className="space-y-3 animate-in fade-in text-xs">
                {/* Package Weight & Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Package Weight
                    </span>
                    <span className="font-extrabold text-neutral-900 text-xs">
                      {packageWeightKg} kg
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    {[0.5, 1.5, 3, 5, 10, 20].map((w) => (
                      <button
                        key={w}
                        type="button"
                        disabled={vehicleType === 'bicycle' && w > 5}
                        onClick={() => setPackageWeightKg(w)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
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

                  <input
                    type="text"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="Item description (e.g. Legal documents, Clothes, Food)"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Recipient Contact */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Recipient Contact (Drop-off)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Recipient Full Name"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Phone (09... or +251...)"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sender Contact */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Sender Contact (Pickup)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Sender Name"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="Phone (09... or +251...)"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Who Pays Rule Toggle */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Who pays the courier?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayerType('sender')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        payerType === 'sender'
                          ? 'border-black bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-neutral-900">Sender Pays</div>
                      <div className="text-[10px] text-neutral-500">At pickup</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayerType('receiver')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        payerType === 'receiver'
                          ? 'border-black bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-neutral-900">Recipient Pays</div>
                      <div className="text-[10px] text-neutral-500">Upon drop-off</div>
                    </button>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-800">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Step 3 Navigation Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBookingStep('vehicle')}
                    className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-bold text-xs text-center shadow-md hover:bg-neutral-900 flex items-center justify-center gap-1.5"
                  >
                    <span>Continue: Review Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & REQUEST DELIVERY */}
            {bookingStep === 'review' && (
              <div className="space-y-3 animate-in fade-in text-xs">
                {/* Order Summary Card */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
                  <div className="font-bold text-neutral-900 text-xs border-b border-neutral-200/60 pb-1">
                    Delivery Summary
                  </div>

                  {/* Route & Contacts */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="h-2 w-2 rounded-[1.5px] bg-emerald-600 shrink-0 mt-1"></span>
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-900 block truncate">
                          {pickupLandmark}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Pickup Contact: {senderName} ({senderPhone})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full border border-black bg-white shrink-0 mt-1"></span>
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-900 block truncate">
                          {dropoffLandmark}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Drop-off Recipient: {recipientName} ({recipientPhone})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle, Package & Payer */}
                  <div className="pt-2 border-t border-neutral-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-neutral-400 block">Vehicle:</span>
                      <span className="font-bold text-neutral-800">
                        {vehicleType === 'motorcycle' ? 'Motorcycle (Speed)' : 'Bicycle (Eco)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Package:</span>
                      <span className="font-bold text-neutral-800">
                        {packageWeightKg} kg • {packageDescription || 'Parcel'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-neutral-400 block">Payment Responsibility:</span>
                      <span className="font-bold text-neutral-800">
                        {payerType === 'sender' ? 'Sender pays at pickup' : 'Recipient pays upon drop-off'} (Cash or Telebirr)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fare Summary */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-3 space-y-1.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>Base Fare:</span>
                    <span className="font-semibold text-neutral-900">ETB {selectedQuote.baseFare}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Distance Fare (~{selectedQuote.estimatedDistanceKm.toFixed(1)} km):</span>
                    <span className="font-semibold text-neutral-900">ETB {selectedQuote.distanceFare}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex justify-between font-black text-sm text-neutral-900">
                    <span>Final Delivery Fare:</span>
                    <span>ETB {selectedQuote.totalFare}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 pt-0.5">
                    Final delivery fare. No additional platform fee. Paid directly to courier via Cash or Telebirr.
                  </p>
                </div>

                {/* Step 4 CTA Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBookingStep('details')}
                    className="flex items-center justify-center gap-1 px-4 py-3.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestDelivery}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-black text-white font-bold text-sm text-center shadow-md hover:bg-neutral-900 active:scale-[0.99] transition-all"
                  >
                    Request Delivery — ETB {selectedQuote.totalFare}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TRACKING SCREEN (POST-REQUEST LIVE DISPATCH PREVIEW) */}
      {viewMode === 'tracking' && activeOrder && (
        <div className="relative z-20 mt-auto sm:ml-6 mb-16 sm:mb-6 sm:max-w-md w-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.18)] border border-neutral-200/80 p-4 space-y-3.5">
            {/* Grab notch */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

            {/* Request Status Bar */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                {!assignedRider ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span className="text-xs font-black text-neutral-900">
                      Searching for nearby courier...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-black text-neutral-900">
                      Courier Assigned & En Route
                    </span>
                  </>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-neutral-600">
                {activeOrder.trackingNumber}
              </span>
            </div>

            {/* Assigned Rider Details Card */}
            {assignedRider ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white font-extrabold text-sm">
                      {assignedRider.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-neutral-900">
                        {assignedRider.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {assignedRider.plate} • ★ {assignedRider.rating}
                      </div>
                    </div>
                  </div>

                  {/* Direct Call Option */}
                  <a
                    href={`tel:${assignedRider.phone}`}
                    className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/60">
                  <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-black" />
                    <span>Est. Pickup: ~{assignedRider.etaMinutes} mins</span>
                  </div>
                  <span className="font-mono font-black text-neutral-900">
                    ETB {activeOrder.fareTotal}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-4 text-center space-y-1">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400 mx-auto" />
                <p className="text-xs font-bold text-neutral-700">Broadcasting to Addis Couriers</p>
                <p className="text-[10px] text-neutral-400">
                  Matching with nearby {activeOrder.vehicleType === 'motorcycle' ? 'motorcycle' : 'bicycle'} couriers in {activeOrder.pickupSubcity}.
                </p>
              </div>
            )}

            {/* Route Summary */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-2.5 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-[1.5px] bg-emerald-600 shrink-0"></span>
                <span className="truncate text-neutral-800 font-medium">
                  {activeOrder.pickupLandmark}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-black bg-white shrink-0"></span>
                <span className="truncate text-neutral-800 font-medium">
                  {activeOrder.dropoffLandmark}
                </span>
              </div>
            </div>

            {/* Honest Demo Mode Disclaimer Banner */}
            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Demo Tracking Mode</strong>
                <span>
                  Real-time rider matching and AfroMessage SMS dispatch run via backend service.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Cancel Request
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

