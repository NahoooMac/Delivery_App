import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bike, 
  MapPin, 
  Package, 
  AlertCircle, 
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';
import { 
  SubCity, 
  VehicleType, 
  PayerType, 
  PackageCategory, 
  Delivery 
} from '../../types/delivery';
import { 
  ADDIS_SUBCITIES, 
  POPULAR_LANDMARKS, 
  calculateFareQuote 
} from '../../data/addisLocations';

interface SendDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newDelivery: Delivery) => void;
}

export const SendDeliveryModal: React.FC<SendDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Form State
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [pickupSubcity, setPickupSubcity] = useState<SubCity>('Bole');
  const [pickupLandmark, setPickupLandmark] = useState('Atlas Hotel Junction, Namibia St');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('+251911');

  const [dropoffSubcity, setDropoffSubcity] = useState<SubCity>('Kirkos');
  const [dropoffLandmark, setDropoffLandmark] = useState('Kazanchis, ECA / UNECA Headquarters');
  const [dropoffContactName, setDropoffContactName] = useState('');
  const [dropoffContactPhone, setDropoffContactPhone] = useState('+251922');

  const [packageCategory, setPackageCategory] = useState<PackageCategory>('documents');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeightKg, setPackageWeightKg] = useState<number>(1.5);
  const [isFragile, setIsFragile] = useState(false);
  const [payerType, setPayerType] = useState<PayerType>('sender');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Fare Quote Calculation
  const quote = useMemo(() => {
    return calculateFareQuote(pickupSubcity, dropoffSubcity, vehicleType, packageWeightKg);
  }, [pickupSubcity, dropoffSubcity, vehicleType, packageWeightKg]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (quote.exceedsLimit) {
      setErrorMessage(quote.exceedsLimit);
      return;
    }
    if (!pickupLandmark.trim()) {
      setErrorMessage('Please provide a specific landmark for pickup.');
      return;
    }
    if (!dropoffLandmark.trim()) {
      setErrorMessage('Please provide a specific landmark for drop-off.');
      return;
    }
    if (!pickupContactName.trim() || !pickupContactPhone.trim()) {
      setErrorMessage('Sender name and Ethiopian phone number are required.');
      return;
    }
    if (!dropoffContactName.trim() || !dropoffContactPhone.trim()) {
      setErrorMessage('Recipient name and Ethiopian phone number are required.');
      return;
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const trackingNumber = `ET-DEL-${randomSuffix}`;

    const newDelivery: Delivery = {
      id: `mock-del-${Date.now()}`,
      trackingNumber,
      vehicleType,
      status: 'requested',
      pickupAddress: `${pickupLandmark}, ${pickupSubcity}`,
      pickupLandmark,
      pickupSubcity,
      pickupContactName,
      pickupContactPhone,
      dropoffAddress: `${dropoffLandmark}, ${dropoffSubcity}`,
      dropoffLandmark,
      dropoffSubcity,
      dropoffContactName,
      dropoffContactPhone,
      packageCategory,
      packageDescription: packageDescription || `${packageCategory.replace('_', ' ')} parcel`,
      packageWeightKg,
      isFragile,
      payerType,
      fareBase: quote.baseFare,
      fareDistance: quote.distanceFare,
      fareTotal: quote.totalFare,
      commissionAmount: quote.commissionAmount,
      estimatedDistanceKm: quote.estimatedDistanceKm,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSubmit(newDelivery);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Delivery</h2>
              <p className="text-xs text-slate-400">
                Point-to-Point Courier Dispatch • Addis Ababa Pilot
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Vehicle Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Courier Vehicle Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Motorcycle */}
              <button
                type="button"
                onClick={() => setVehicleType('motorcycle')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                  vehicleType === 'motorcycle'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${vehicleType === 'motorcycle' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  <Bike className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Motorcycle Delivery</span>
                    <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-amber-300 font-mono">Fast & Citywide</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Up to 30 kg • Up to 30 km range
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Base: 85 ETB (inc. 2 km) + 22 ETB/km
                  </p>
                </div>
              </button>

              {/* Bicycle */}
              <button
                type="button"
                onClick={() => setVehicleType('bicycle')}
                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                  vehicleType === 'bicycle'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${vehicleType === 'bicycle' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  <Bike className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Bicycle Eco Delivery</span>
                    <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300 font-mono">Local Eco</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Max 5.0 kg • Max 7.0 km radius
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Base: 45 ETB (inc. 1.5 km) + 15 ETB/km
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Route & Landmark Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
            {/* Pickup */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <MapPin className="h-4 w-4" />
                <span>1. Origin / Pickup (Addis Ababa)</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Pickup Sub-City
                </label>
                <select
                  value={pickupSubcity}
                  onChange={(e) => {
                    const sub = e.target.value as SubCity;
                    setPickupSubcity(sub);
                    if (POPULAR_LANDMARKS[sub]?.[0]) {
                      setPickupLandmark(POPULAR_LANDMARKS[sub][0]);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {ADDIS_SUBCITIES.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} Sub-City
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Known Landmark or Prominent Building
                </label>
                <input
                  type="text"
                  value={pickupLandmark}
                  onChange={(e) => setPickupLandmark(e.target.value)}
                  placeholder="e.g., Near Atlas Hotel, Cameroun St"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={pickupContactName}
                    onChange={(e) => setPickupContactName(e.target.value)}
                    placeholder="Sender Name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Sender Phone
                  </label>
                  <input
                    type="text"
                    value={pickupContactPhone}
                    onChange={(e) => setPickupContactPhone(e.target.value)}
                    placeholder="+251911..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Drop-off */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <MapPin className="h-4 w-4" />
                <span>2. Destination / Drop-Off (Addis Ababa)</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Drop-Off Sub-City
                </label>
                <select
                  value={dropoffSubcity}
                  onChange={(e) => {
                    const sub = e.target.value as SubCity;
                    setDropoffSubcity(sub);
                    if (POPULAR_LANDMARKS[sub]?.[0]) {
                      setDropoffLandmark(POPULAR_LANDMARKS[sub][0]);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {ADDIS_SUBCITIES.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} Sub-City
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Drop-Off Landmark or Building
                </label>
                <input
                  type="text"
                  value={dropoffLandmark}
                  onChange={(e) => setDropoffLandmark(e.target.value)}
                  placeholder="e.g., ECA Gate 2, Kazanchis"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={dropoffContactName}
                    onChange={(e) => setDropoffContactName(e.target.value)}
                    placeholder="Recipient Name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Recipient Phone
                  </label>
                  <input
                    type="text"
                    value={dropoffContactPhone}
                    onChange={(e) => setDropoffContactPhone(e.target.value)}
                    placeholder="+251922..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Package Details & Payer Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Package Category
              </label>
              <select
                value={packageCategory}
                onChange={(e) => setPackageCategory(e.target.value as PackageCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="documents">Documents / Envelopes</option>
                <option value="food_perishables">Food & Bakery</option>
                <option value="electronics">Electronics & Parts</option>
                <option value="clothing">Clothing & Apparel</option>
                <option value="fragile_goods">Fragile Merchandise</option>
                <option value="other">Other Package</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Weight: <span className="font-mono text-amber-400">{packageWeightKg} kg</span>
              </label>
              <input
                type="number"
                min="0.1"
                max={vehicleType === 'bicycle' ? 5.0 : 30.0}
                step="0.1"
                value={packageWeightKg}
                onChange={(e) => setPackageWeightKg(parseFloat(e.target.value) || 0.1)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Designated Fare Payer
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-700 bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setPayerType('sender')}
                  className={`rounded-md py-1 text-xs font-semibold transition-all ${
                    payerType === 'sender'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sender Pays
                </button>
                <button
                  type="button"
                  onClick={() => setPayerType('receiver')}
                  className={`rounded-md py-1 text-xs font-semibold transition-all ${
                    payerType === 'receiver'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Receiver Pays
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Package Description / Handling Notes (Optional)
            </label>
            <input
              type="text"
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="e.g. Legal documents in brown envelope, or fresh pastries"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Fragile checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fragile-check"
              checked={isFragile}
              onChange={(e) => setIsFragile(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="fragile-check" className="text-xs text-slate-300">
              Handle with care (Fragile contents)
            </label>
          </div>

          {/* Section 4: Live Transparent Fare Quote Breakdown */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Calculator className="h-4 w-4" />
                <span>Estimated Fare Breakdown ({pickupSubcity} $\rightarrow$ {dropoffSubcity})</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Est. Distance: <strong className="text-slate-200">{quote.estimatedDistanceKm} km</strong>
              </span>
            </div>

            {quote.exceedsLimit ? (
              <div className="text-xs text-rose-400 flex items-center gap-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <span>{quote.exceedsLimit}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Base Fare</span>
                  <span className="font-mono font-semibold text-slate-200">{quote.baseFare.toFixed(2)} ETB</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Distance Charge</span>
                  <span className="font-mono font-semibold text-slate-200">{quote.distanceFare.toFixed(2)} ETB</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Platform Fee ({quote.commissionRatePct}%)</span>
                  <span className="font-mono text-slate-400">{quote.commissionAmount.toFixed(2)} ETB</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="text-amber-400 font-semibold text-[11px] block">Total Delivery Fare</span>
                  <span className="font-mono text-base font-extrabold text-amber-300">
                    {quote.totalFare.toFixed(2)} ETB
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>
                {payerType === 'sender'
                  ? 'Payment collected from sender at pickup point via Cash / Telebirr.'
                  : 'Payment collected from recipient before drop-off handover via Cash / Telebirr.'}
              </span>
            </div>
          </div>

          {/* Modal Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(quote.exceedsLimit)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>Broadcast Delivery Order</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
