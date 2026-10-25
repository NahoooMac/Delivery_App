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
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'assigned':
        return {
          label: 'Courier Assigned',
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 'arrived_pickup':
        return {
          label: 'At Pickup Location',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        };
      case 'picked_up':
        return {
          label: 'In Transit (En Route)',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'arrived_dropoff':
        return {
          label: 'At Drop-off Location',
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'cancelled':
      default:
        return {
          label: 'Cancelled',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>My Deliveries</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
              {deliveries.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track active orders, verify recipient OTPs, and review delivery receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={onBookNew}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Send New Package</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({deliveries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === 'active'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({deliveries.filter((d) => isActiveStatus(d.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('delivered')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === 'delivered'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivered ({deliveries.filter((d) => d.status === 'delivered').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking, landmark, item..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Deliveries List Cards */}
      {filteredDeliveries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No deliveries found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No packages match your search filter.'
              : 'You have no delivery history in this tab yet.'}
          </p>
          <button
            type="button"
            onClick={onBookNew}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            <span>Book a delivery now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedDelivery(item)}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 hover:border-slate-700 cursor-pointer transition-all shadow-sm group"
              >
                {/* Header: Tracking & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {item.trackingNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Route */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">{item.pickupLandmark}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-sm bg-amber-400 shrink-0"></span>
                    <span className="truncate">{item.dropoffLandmark}</span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5 text-amber-400" />
                    <span className="capitalize">{item.vehicleType}</span>
                    <span>•</span>
                    <span>{item.packageWeightKg} kg</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    {item.fareTotal.toFixed(2)} ETB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  Delivery Details
                </span>
                <h3 className="font-mono text-base font-bold text-white">
                  {selectedDelivery.trackingNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Progress */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Current Status</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    getStatusBadge(selectedDelivery.status).bg
                  }`}
                >
                  {getStatusBadge(selectedDelivery.status).label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedDelivery.status === 'requested' &&
                  'Order broadcasted to available couriers. Waiting for assignment.'}
                {selectedDelivery.status === 'assigned' &&
                  'Courier assigned! Courier is travelling to the pickup point.'}
                {selectedDelivery.status === 'picked_up' &&
                  'Package picked up! Recipient OTP has been generated for safe drop-off.'}
                {selectedDelivery.status === 'delivered' &&
                  'Successfully delivered. Recipient verified via drop-off OTP.'}
              </p>
            </div>

            {/* Route Details */}
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Pickup Location & Contact
                </span>
                <div className="text-white font-medium">{selectedDelivery.pickupLandmark}</div>
                <div className="text-slate-400 text-[11px]">{selectedDelivery.pickupSubcity} Sub-City</div>
                <div className="text-slate-400 text-[11px] pt-1">
                  Contact: <strong className="text-slate-300">{selectedDelivery.pickupContactName}</strong> ({selectedDelivery.pickupContactPhone})
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Drop-off Destination & Contact
                </span>
                <div className="text-white font-medium">{selectedDelivery.dropoffLandmark}</div>
                <div className="text-slate-400 text-[11px]">{selectedDelivery.dropoffSubcity} Sub-City</div>
                <div className="text-slate-400 text-[11px] pt-1">
                  Recipient: <strong className="text-slate-300">{selectedDelivery.dropoffContactName}</strong> ({selectedDelivery.dropoffContactPhone})
                </div>
              </div>
            </div>

            {/* Courier Assignment (if any) */}
            {selectedDelivery.riderName && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Assigned Courier
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{selectedDelivery.riderName}</span>
                  <span className="font-mono text-slate-400">{selectedDelivery.riderPhone}</span>
                </div>
                {selectedDelivery.riderPlate && (
                  <span className="text-[11px] text-slate-400 block">
                    Plate: <strong className="text-slate-300">{selectedDelivery.riderPlate}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Fare Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Total Fare</span>
                <span className="text-amber-400 font-mono font-bold text-base">
                  {selectedDelivery.fareTotal.toFixed(2)} ETB
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Payment Mode</span>
                <span className="text-slate-200 capitalize font-medium">
                  {selectedDelivery.payerType === 'sender' ? 'Sender Pays' : 'Receiver Pays'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
