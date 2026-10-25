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
    setTimeout(() => setGpsDemoNotice(false), 3500);
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
      {/* Uber Route Input Box */}
      <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/90 p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Vertical Uber indicator dots */}
          <div className="flex flex-col items-center justify-between py-1.5 self-stretch">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-black"></span>
            <div className="w-[1.5px] flex-1 bg-neutral-300 my-1"></div>
            <span className="h-2.5 w-2.5 rounded-full border-2 border-black bg-white"></span>
          </div>

          {/* Location inputs */}
          <div className="flex-1 space-y-2">
            {/* Pickup input */}
            <div
              onClick={() => {
                setActivePicker('pickup');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition-all ${
                activePicker === 'pickup'
                  ? 'border border-black bg-white shadow-sm'
                  : 'bg-white border border-neutral-200/70 hover:border-neutral-400'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500 block tracking-wider">
                  Pickup Location
                </span>
                <div className="truncate font-bold text-neutral-900 text-xs">
                  {pickupLandmark || `${pickupSubcity} (Choose Landmark)`}
                </div>
                <span className="text-[10px] text-neutral-500">{pickupSubcity} Sub-City</span>
              </div>

              {/* Sample Location button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="ml-2 flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors shrink-0"
                title="Use sample Addis location (GPS demo)"
              >
                <Crosshair className="h-3 w-3 text-black" />
                <span className="hidden sm:inline">Sample Location</span>
              </button>
            </div>

            {/* Dropoff input */}
            <div
              onClick={() => {
                setActivePicker('dropoff');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition-all ${
                activePicker === 'dropoff'
                  ? 'border border-black bg-white shadow-sm'
                  : 'bg-white border border-neutral-200/70 hover:border-neutral-400'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500 block tracking-wider">
                  Drop-off Destination
                </span>
                <div className="truncate font-bold text-neutral-900 text-xs">
                  {dropoffLandmark || `${dropoffSubcity} (Choose Landmark)`}
                </div>
                <span className="text-[10px] text-neutral-500">{dropoffSubcity} Sub-City</span>
              </div>
            </div>
          </div>

          {/* Swap button */}
          <button
            type="button"
            onClick={onSwapLocations}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:text-black hover:border-neutral-300 active:scale-95 transition-all shrink-0 shadow-sm"
            title="Swap Pickup and Drop-off"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* GPS Demo Notice toast */}
        {gpsDemoNotice && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-neutral-900 text-white px-2.5 py-1.5 text-[11px] font-medium">
            <span>📍 Sample demo location selected (Bole Medhanealem). GPS is not connected.</span>
            <button type="button" onClick={() => setGpsDemoNotice(false)}>
              <X className="h-3 w-3 text-neutral-400 hover:text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Searchable Landmarks Modal / Popover Dropdown */}
      {activePicker && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-96 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
          <div className="p-3 border-b border-neutral-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-black" />
                <span>
                  Select {activePicker === 'pickup' ? 'Pickup Location' : 'Drop-off Destination'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmark, hotel, street, or sub-city..."
                autoFocus
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Quick sub-city filters pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                type="button"
                onClick={() => setFilterSubcity('all')}
                className={`rounded-full px-2.5 py-0.5 whitespace-nowrap font-medium transition-colors ${
                  filterSubcity === 'all'
                    ? 'bg-black text-white font-bold'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All Addis
              </button>
              {ADDIS_SUBCITIES.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setFilterSubcity(sc)}
                  className={`rounded-full px-2 py-0.5 whitespace-nowrap transition-colors ${
                    filterSubcity === sc
                      ? 'bg-black text-white font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Landmarks list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 p-1">
            {filteredLandmarks.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
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
                        ? 'bg-neutral-100 text-black font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-black" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-neutral-900">{item.landmark}</div>
                        <div className="text-[11px] text-neutral-500">{item.subcity} Sub-City</div>
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-black shrink-0" />}
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
