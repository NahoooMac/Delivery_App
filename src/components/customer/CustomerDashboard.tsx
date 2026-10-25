import React, { useState } from 'react';
import { 
  Package, 
  Bike, 
  CheckCircle2, 
  MapPin, 
  Plus, 
  Search, 
  Eye, 
  AlertCircle,
  User,
  Phone,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Delivery, DeliveryStatus } from '../../types/delivery';

interface CustomerDashboardProps {
  deliveries: Delivery[];
  onOpenBooking: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  deliveries,
  onOpenBooking,
}) => {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = 
      item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickupLandmark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dropoffLandmark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Aggregated quick metrics
  const totalDeliveries = deliveries.length;
  const activeDeliveries = deliveries.filter(
    (d) => ['requested', 'assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff'].includes(d.status)
  ).length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'delivered').length;
  const totalSpentETB = deliveries
    .filter((d) => d.payerType === 'sender')
    .reduce((acc, curr) => acc + curr.fareTotal, 0);

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            Awaiting Courier
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
            Courier Assigned
          </span>
        );
      case 'arrived_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Courier at Pickup
          </span>
        );
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            In Transit
          </span>
        );
      case 'arrived_dropoff':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
            At Destination
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed Handover
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Action Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>On-Demand Dispatch Across All 11 Addis Ababa Sub-Cities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Fast, Reliable Motorcycle & Bicycle Deliveries in Addis Ababa
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transparent, fixed ETB pricing with landmark-guided navigation and secure OTP confirmation. 
              Choose motorcycle for heavy packages citywide, or eco-friendly bicycle for short sub-city hops.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onOpenBooking}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
              <span>Send a Delivery</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-slate-800/80 pt-6">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Total Bookings</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">{totalDeliveries}</span>
              <span className="text-[10px] text-slate-500">Orders</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Active In-Progress</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">{activeDeliveries}</span>
              <span className="text-[10px] text-amber-500/80">Live</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Completed Deliveries</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{completedDeliveries}</span>
              <span className="text-[10px] text-emerald-500/80">Delivered</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] font-medium text-slate-400">Total Spent (Sender Paid)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">{totalSpentETB.toFixed(0)}</span>
              <span className="text-[10px] text-slate-400">ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-400" />
              <span>Recent Deliveries</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-400">
                {filteredDeliveries.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Mock client demonstration dataset • Real backend API decoupled
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search tracking or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="requested">Awaiting Courier</option>
              <option value="picked_up">In Transit</option>
              <option value="arrived_pickup">Courier at Pickup</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Deliveries Card List */}
        <div className="grid grid-cols-1 gap-3">
          {filteredDeliveries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No deliveries match your criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or create a new delivery order.</p>
              <button
                type="button"
                onClick={onOpenBooking}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Send a Delivery Now</span>
              </button>
            </div>
          ) : (
            filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Tracking & Vehicle */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white tracking-wide">
                        {delivery.trackingNumber}
                      </span>
                      {getStatusBadge(delivery.status)}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          delivery.vehicleType === 'motorcycle'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        <Bike className="h-3 w-3" />
                        {delivery.vehicleType === 'motorcycle' ? 'Motorcycle' : 'Bicycle Eco'}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {delivery.payerType === 'sender' ? 'Sender Paid' : 'Receiver Paid'}
                      </span>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Pickup</span>
                          <span className="font-medium text-slate-200">{delivery.pickupLandmark}</span>
                          <span className="text-slate-400 text-[11px]"> ({delivery.pickupSubcity})</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Drop-off</span>
                          <span className="font-medium text-slate-200">{delivery.dropoffLandmark}</span>
                          <span className="text-slate-400 text-[11px]"> ({delivery.dropoffSubcity})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Fare & Action Button */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t border-slate-800 lg:border-t-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] text-slate-500 block">Total Fare</span>
                      <span className="font-mono text-base font-extrabold text-amber-300">
                        {delivery.fareTotal.toFixed(2)} ETB
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ~{delivery.estimatedDistanceKm} km
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDelivery(delivery)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Courier snapshot if in progress */}
                {delivery.riderName && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 text-xs border border-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      <span>Assigned Courier: <strong className="text-white">{delivery.riderName}</strong></span>
                      {delivery.riderPlate && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] text-slate-400 border border-slate-700">
                          {delivery.riderPlate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Phone className="h-3 w-3 text-emerald-400" />
                      <span>{delivery.riderPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delivery Inspection Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">Delivery Details</span>
                <h3 className="text-lg font-bold text-white font-mono">{selectedDelivery.trackingNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status & Payer */}
              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">Fee Payer</span>
                  <span className="font-semibold text-slate-200">
                    {selectedDelivery.payerType === 'sender' ? 'Sender (at pickup)' : 'Receiver (at dropoff)'}
                  </span>
                </div>
              </div>

              {/* Package description */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Package Contents</span>
                <p className="font-semibold text-slate-200">{selectedDelivery.packageDescription}</p>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] pt-1">
                  <span>Weight: <strong className="text-slate-200">{selectedDelivery.packageWeightKg} kg</strong></span>
                  <span>Category: <strong className="text-slate-200">{selectedDelivery.packageCategory}</strong></span>
                  <span>Fragile: <strong className={selectedDelivery.isFragile ? 'text-amber-400' : 'text-slate-200'}>{selectedDelivery.isFragile ? 'Yes' : 'No'}</strong></span>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 p-3 bg-slate-950/40">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Sender</span>
                  <p className="font-bold text-slate-200 mt-1">{selectedDelivery.pickupContactName}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{selectedDelivery.pickupContactPhone}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{selectedDelivery.pickupLandmark}, {selectedDelivery.pickupSubcity}</p>
                </div>

                <div className="rounded-xl border border-slate-800 p-3 bg-slate-950/40">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Recipient</span>
                  <p className="font-bold text-slate-200 mt-1">{selectedDelivery.dropoffContactName}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{selectedDelivery.dropoffContactPhone}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{selectedDelivery.dropoffLandmark}, {selectedDelivery.dropoffSubcity}</p>
                </div>
              </div>

              {/* Fare breakdown */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Base Fare ({selectedDelivery.vehicleType}):</span>
                  <span className="font-mono text-slate-200">{selectedDelivery.fareBase.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distance Fare (~{selectedDelivery.estimatedDistanceKm} km):</span>
                  <span className="font-mono text-slate-200">{selectedDelivery.fareDistance.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold border-t border-slate-800 pt-2 text-sm">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">{selectedDelivery.fareTotal.toFixed(2)} ETB</span>
                </div>
              </div>

              {/* Security & OTP notice */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-slate-400 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Proof of Delivery (OTP) Protocol</span>
                </div>
                <p>
                  {selectedDelivery.status === 'delivered'
                    ? 'Handover completed and verified via recipient 4-digit OTP. Commission accrued to platform.'
                    : selectedDelivery.status === 'picked_up'
                    ? '4-Digit Recipient OTP was generated at package pickup and sent via SMS to recipient. Courier requires this code at drop-off.'
                    : 'Recipient OTP is generated exclusively when courier collects package at pickup.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
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
