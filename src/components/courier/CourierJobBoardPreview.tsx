import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { Delivery } from '../../types/delivery';

interface CourierJobBoardPreviewProps {
  deliveries: Delivery[];
  onClaimDelivery: (deliveryId: string) => void;
}

export const CourierJobBoardPreview: React.FC<CourierJobBoardPreviewProps> = ({
  deliveries,
  onClaimDelivery,
}) => {
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'motorcycle' | 'bicycle'>('all');
  const [courierDebt, setCourierDebt] = useState(140.0);
  const [activeJobId, setActiveJobId] = useState<string | null>('mock-del-001'); // holds mock-del-001 initially

  const availableJobs = deliveries.filter(
    (d) => d.status === 'requested' && (vehicleFilter === 'all' || d.vehicleType === vehicleFilter)
  );

  const handleClaim = (id: string) => {
    if (activeJobId) {
      alert('Concurrency Guard Active: You already hold 1 active delivery (ET-DEL-89241). Under platform rules, couriers may only hold exactly one active delivery.');
      return;
    }
    if (courierDebt >= 500) {
      alert('Debt Ceiling Exceeded: Verified commission debt >= 500.00 ETB. Settle commission with admin before claiming new jobs.');
      return;
    }
    setActiveJobId(id);
    onClaimDelivery(id);
  };

  return (
    <div className="space-y-6">
      {/* Courier Profile & Concurrency Status Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Yonas Getachew</h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Approved Courier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vehicle: Motorcycle (Plate: AA-2-B48192) • Libre Verified
              </p>
            </div>
          </div>

          {/* Debt ceiling indicator */}
          <div className="flex items-center gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 block uppercase">Verified Commission Debt</span>
                <button
                  type="button"
                  onClick={() => setCourierDebt((d) => (d >= 500 ? 140 : 520))}
                  className="text-[10px] text-amber-400 hover:underline"
                  title="Toggle debt simulation"
                >
                  {courierDebt >= 500 ? 'Reset' : 'Simulate Cap'}
                </button>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-bold text-amber-400">{courierDebt.toFixed(2)}</span>
                <span className="text-slate-400 text-[10px]">/ 500.00 ETB Ceiling</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 block uppercase">Single Active Job Guard</span>
                {activeJobId && (
                  <button
                    type="button"
                    onClick={() => setActiveJobId(null)}
                    className="text-[10px] text-emerald-400 hover:underline"
                    title="Simulate job completion"
                  >
                    Release
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-2 w-2 rounded-full ${activeJobId ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className="font-semibold text-white">
                  {activeJobId ? '1 Job Active (Locked)' : '0 Active (Ready)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informational banner about Stage 2 architecture */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Courier Job Board Protocol:</strong> Deliveries are claimed atomically using row-level locks on <code className="text-amber-300 font-mono">rider_profiles</code> and enforced at the database level by <code className="text-amber-300 font-mono">idx_single_active_delivery_per_rider</code> across active statuses.
          </span>
        </div>
      </div>

      {/* Available Jobs Header & Vehicle Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Available Delivery Jobs (Job Feed)</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
              {availableJobs.length} Available
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time broadcast stream filtered by courier vehicle type
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setVehicleFilter('all')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              vehicleFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Vehicles
          </button>
          <button
            type="button"
            onClick={() => setVehicleFilter('motorcycle')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              vehicleFilter === 'motorcycle' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Motorcycle Only
          </button>
          <button
            type="button"
            onClick={() => setVehicleFilter('bicycle')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              vehicleFilter === 'bicycle' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bicycle Only
          </button>
        </div>
      </div>

      {/* Job Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableJobs.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No unassigned orders on the Job Board right now</p>
            <p className="text-xs text-slate-500 mt-1">
              Switch to Customer Portal and click "Send a Delivery" to broadcast a mock order!
            </p>
          </div>
        ) : (
          availableJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-300">{job.trackingNumber}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    job.vehicleType === 'motorcycle'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {job.vehicleType === 'motorcycle' ? 'Motorcycle' : 'Bicycle Eco'}
                </span>
              </div>

              {/* Route */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Pickup</span>
                    <span className="font-medium text-white">{job.pickupLandmark}</span>
                    <span className="text-slate-400 text-[11px]"> ({job.pickupSubcity})</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Drop-off</span>
                    <span className="font-medium text-white">{job.dropoffLandmark}</span>
                    <span className="text-slate-400 text-[11px]"> ({job.dropoffSubcity})</span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-400 flex justify-between">
                <span>{job.packageDescription}</span>
                <span className="font-mono text-slate-300">{job.packageWeightKg} kg</span>
              </div>

              {/* Earnings & Claim Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Gross Delivery Fare</span>
                  <span className="font-mono text-base font-extrabold text-amber-300">
                    {job.fareTotal.toFixed(2)} ETB
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Platform Fee: -{job.commissionAmount.toFixed(2)} ETB
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaim(job.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Claim Delivery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
