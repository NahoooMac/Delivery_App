import React, { useState } from 'react';
import { 
  Package, 
  Bike, 
  Search, 
  Plus,
  ArrowRight,
  X
} from 'lucide-react';
import { Delivery, DeliveryStatus } from '../../types/delivery';

interface DeliveriesListProps {
  deliveries: Delivery[];
  onBookNew: () => void;
}

export const DeliveriesList: React.FC<DeliveriesListProps> = ({
  deliveries,
  onBookNew,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Status mapping
  const isActiveStatus = (status: DeliveryStatus) =>
    ['requested', 'assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff'].includes(status);

  const filteredDeliveries = deliveries.filter((item) => {
    const matchesFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? isActiveStatus(item.status)
        : item.status === 'delivered';

    const matchesSearch =
      item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickupLandmark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dropoffLandmark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'requested':
        return {
          label: 'Finding Courier',
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'assigned':
        return {
          label: 'Courier Assigned',
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'arrived_pickup':
        return {
          label: 'At Pickup Location',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        };
      case 'picked_up':
        return {
          label: 'In Transit',
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
        };
      case 'arrived_dropoff':
        return {
          label: 'At Drop-off Location',
          bg: 'bg-teal-100 text-teal-900 border-teal-200',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      case 'failed':
        return {
          label: 'Delivery Failed',
          bg: 'bg-rose-100 text-rose-900 border-rose-200',
        };
      case 'returned':
        return {
          label: 'Returned to Sender',
          bg: 'bg-orange-100 text-orange-900 border-orange-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        };
      default:
        return {
          label: 'Unknown',
          bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        };
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 overflow-y-auto p-4 space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Activity
          </h2>
          <p className="text-xs text-neutral-500">
            Track past and active package deliveries
          </p>
        </div>

        <button
          type="button"
          onClick={onBookNew}
          className="flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Delivery</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-neutral-200 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-3 py-1 font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-black text-white'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            All ({deliveries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-full px-3 py-1 font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-black text-white'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Active ({deliveries.filter((d) => isActiveStatus(d.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('delivered')}
            className={`rounded-full px-3 py-1 font-bold transition-all ${
              statusFilter === 'delivered'
                ? 'bg-black text-white'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Completed ({deliveries.filter((d) => d.status === 'delivered').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-60">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking or place..."
            className="w-full rounded-full border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No activity found</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            {searchQuery
              ? 'No packages match your search filter.'
              : 'You have no deliveries in this tab yet.'}
          </p>
          <button
            type="button"
            onClick={onBookNew}
            className="inline-flex items-center gap-1 text-xs font-bold text-black underline pt-1"
          >
            <span>Book a delivery now</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDeliveries.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedDelivery(item)}
                className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-2 hover:border-neutral-400 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
              >
                {/* Header: Tracking & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-neutral-900">
                    {item.trackingNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Route */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <span className="h-2 w-2 rounded-[1.5px] bg-black shrink-0"></span>
                    <span className="truncate font-semibold">{item.pickupLandmark}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <span className="h-2 w-2 rounded-full border border-black bg-white shrink-0"></span>
                    <span className="truncate font-semibold">{item.dropoffLandmark}</span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5 text-neutral-800" />
                    <span className="capitalize font-medium">{item.vehicleType}</span>
                    <span>•</span>
                    <span>{item.packageWeightKg} kg</span>
                  </div>
                  <span className="font-extrabold text-xs text-neutral-900">
                    ETB {item.fareTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Delivery Details
                </span>
                <h3 className="font-mono text-sm font-extrabold text-neutral-900">
                  {selectedDelivery.trackingNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-full p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Progress */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Current Status</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    getStatusBadge(selectedDelivery.status).bg
                  }`}
                >
                  {getStatusBadge(selectedDelivery.status).label}
                </span>
              </div>
              <p className="text-[11px] text-neutral-600">
                {selectedDelivery.status === 'requested' &&
                  'Demo delivery created. Courier matching is not connected yet.'}
                {selectedDelivery.status === 'assigned' &&
                  'Courier assigned! Courier is travelling to pickup.'}
                {selectedDelivery.status === 'picked_up' &&
                  'Package picked up! Recipient OTP required for drop-off.'}
                {selectedDelivery.status === 'delivered' &&
                  'Successfully delivered. Recipient verified via drop-off OTP.'}
                {selectedDelivery.status === 'failed' &&
                  'Delivery attempt failed. Recipient was unreachable.'}
              </p>
            </div>

            {/* Route Details */}
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Pickup Location & Contact
                </span>
                <div className="text-neutral-900 font-semibold">{selectedDelivery.pickupLandmark}</div>
                <div className="text-neutral-500 text-[11px]">
                  Contact: {selectedDelivery.pickupContactName} ({selectedDelivery.pickupContactPhone})
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Drop-off Destination & Recipient
                </span>
                <div className="text-neutral-900 font-semibold">{selectedDelivery.dropoffLandmark}</div>
                <div className="text-neutral-500 text-[11px]">
                  Recipient: {selectedDelivery.dropoffContactName} ({selectedDelivery.dropoffContactPhone})
                </div>
              </div>
            </div>

            {/* Fare */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-xs font-bold text-neutral-600">Total Fare:</span>
              <span className="text-sm font-black text-neutral-900">
                ETB {selectedDelivery.fareTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDelivery(null)}
              className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
