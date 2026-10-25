import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ArrowUpDown, Crosshair, X, Check } from 'lucide-react';
import { SubCity, GeoPoint } from '../../types/delivery';
import { ADDIS_SUBCITIES, POPULAR_LANDMARKS, getCoordinatesForLandmark } from '../../data/addisLocations';

interface LocationSearchInputProps {
  pickupSubcity: SubCity;
  pickupLandmark: string;
  onSelectPickup: (subcity: SubCity, landmark: string, coords?: GeoPoint) => void;
  dropoffSubcity: SubCity;
  dropoffLandmark: string;
  onSelectDropoff: (subcity: SubCity, landmark: string, coords?: GeoPoint) => void;
  onSwapLocations: () => void;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  pickupSubcity,
  pickupLandmark,
  onSelectPickup,
  dropoffSubcity,
  dropoffLandmark,
  onSelectDropoff,
  onSwapLocations,
}) => {
  const [activePicker, setActivePicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubcity, setFilterSubcity] = useState<SubCity | 'all'>('all');
  const [gpsDemoNotice, setGpsDemoNotice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActivePicker(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter landmarks based on search text and subcity
  const filteredLandmarks: { subcity: SubCity; landmark: string }[] = [];
  ADDIS_SUBCITIES.forEach((sc) => {
    if (filterSubcity !== 'all' && filterSubcity !== sc) return;
    const items = POPULAR_LANDMARKS[sc] || [];
    items.forEach((lm) => {
      if (
        searchQuery === '' ||
        lm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        filteredLandmarks.push({ subcity: sc, landmark: lm });
      }
    });
  });

  const handleUseCurrentLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Honest: Explicitly note this is a pilot demo location, not fake real GPS
    const sampleCoords = getCoordinatesForLandmark('Bole', 'Bole Medhanealem Cathedral');
    onSelectPickup('Bole', 'Bole Medhanealem Cathedral', sampleCoords);
    setGpsDemoNotice(true);
    setTimeout(() => setGpsDemoNotice(false), 4000);
  };

  const handleSelect = (sc: SubCity, lm: string) => {
    const coords = getCoordinatesForLandmark(sc, lm);
    if (activePicker === 'pickup') {
      onSelectPickup(sc, lm, coords);
    } else {
      onSelectDropoff(sc, lm, coords);
    }
    setActivePicker(null);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Connected From / To inputs card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Vertical route line with dots */}
          <div className="flex flex-col items-center justify-between py-1 self-stretch">
            <span className="h-3 w-3 rounded-full border-2 border-emerald-400 bg-emerald-500/20"></span>
            <div className="w-0.5 flex-1 bg-slate-700 my-1"></div>
            <span className="h-3 w-3 rounded-sm border-2 border-amber-400 bg-amber-500/20"></span>
          </div>

          {/* Location inputs */}
          <div className="flex-1 space-y-2">
            {/* Pickup input */}
            <div
              onClick={() => {
                setActivePicker('pickup');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all ${
                activePicker === 'pickup'
                  ? 'border-emerald-500 bg-slate-850 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Pickup Location
                </span>
                <div className="truncate font-medium text-white text-[13px]">
                  {pickupLandmark || `${pickupSubcity} (Choose Landmark)`}
                </div>
                <span className="text-[10px] text-slate-400">{pickupSubcity} Sub-City</span>
              </div>

              {/* Demo current location button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="ml-2 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors shrink-0"
                title="Use sample Addis location (GPS not connected)"
              >
                <Crosshair className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">Sample Location</span>
              </button>
            </div>

            {/* Dropoff input */}
            <div
              onClick={() => {
                setActivePicker('dropoff');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all ${
                activePicker === 'dropoff'
                  ? 'border-amber-500 bg-slate-850 ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  Drop-off Destination
                </span>
                <div className="truncate font-medium text-white text-[13px]">
                  {dropoffLandmark || `${dropoffSubcity} (Choose Landmark)`}
                </div>
                <span className="text-[10px] text-slate-400">{dropoffSubcity} Sub-City</span>
              </div>
            </div>
          </div>

          {/* Swap button */}
          <button
            type="button"
            onClick={onSwapLocations}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 active:scale-95 transition-all shrink-0"
            title="Swap Pickup and Drop-off"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* GPS Demo Notice toast */}
        {gpsDemoNotice && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300">
            <span>📍 Sample demo location selected (Bole Medhanealem). GPS is not connected.</span>
            <button type="button" onClick={() => setGpsDemoNotice(false)}>
              <X className="h-3 w-3 text-emerald-400" />
            </button>
          </div>
        )}
      </div>

      {/* Searchable Landmarks Modal / Popover Dropdown */}
      {activePicker && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 max-h-96 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className={`h-3.5 w-3.5 ${activePicker === 'pickup' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>
                  Select {activePicker === 'pickup' ? 'Pickup Location' : 'Drop-off Destination'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmark, hotel, street, or sub-city..."
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Quick sub-city filters pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                type="button"
                onClick={() => setFilterSubcity('all')}
                className={`rounded-lg px-2.5 py-0.5 whitespace-nowrap font-medium transition-colors ${
                  filterSubcity === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Addis
              </button>
              {ADDIS_SUBCITIES.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setFilterSubcity(sc)}
                  className={`rounded-lg px-2 py-0.5 whitespace-nowrap transition-colors ${
                    filterSubcity === sc
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Landmarks list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredLandmarks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching landmarks found. Try another search or select a sub-city.
              </div>
            ) : (
              filteredLandmarks.map((item, idx) => {
                const isSelected =
                  activePicker === 'pickup'
                    ? pickupSubcity === item.subcity && pickupLandmark === item.landmark
                    : dropoffSubcity === item.subcity && dropoffLandmark === item.landmark;

                return (
                  <div
                    key={`${item.subcity}-${item.landmark}-${idx}`}
                    onClick={() => handleSelect(item.subcity, item.landmark)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 text-white'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{item.landmark}</div>
                        <div className="text-[11px] text-slate-400">{item.subcity} Sub-City</div>
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-amber-400 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
