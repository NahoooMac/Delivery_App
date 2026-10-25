import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  DollarSign, 
  Plus
} from 'lucide-react';
import { Delivery } from '../../types/delivery';
import { INITIAL_MOCK_DELIVERIES } from '../../data/mockDeliveries';

interface SettlementItem {
  id: string;
  courierName: string;
  courierPhone: string;
  courierVehicle: 'Motorcycle' | 'Bicycle';
  amountETB: number;
  paymentMethod: 'telebirr' | 'cbe_birr';
  transactionReference: string;
  status: 'pending_verification' | 'settled' | 'rejected';
  submittedAt: string;
}

interface CourierFleetRecord {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'bicycle';
  plateNumber?: string;
  subcity: string;
  libreVerified: boolean;
  debtETB: number;
  status: 'active' | 'suspended';
  rating: number;
}

interface AdminAuditPreviewProps {
  deliveries?: Delivery[];
}

export const AdminAuditPreview: React.FC<AdminAuditPreviewProps> = ({
  deliveries = INITIAL_MOCK_DELIVERIES,
}) => {
  const [activeTab, setActiveTab] = useState<'settlements' | 'fleet' | 'deliveries'>('settlements');

  // Settlements Ledger State
  const [settlements, setSettlements] = useState<SettlementItem[]>([
    {
      id: 'set-001',
      courierName: 'Yonas Getachew',
      courierPhone: '+251912987654',
      courierVehicle: 'Motorcycle',
      amountETB: 350.0,
      paymentMethod: 'telebirr',
      transactionReference: 'TB-9283741920',
      status: 'pending_verification',
      submittedAt: '2026-10-25 10:30 AM',
    },
    {
      id: 'set-002',
      courierName: 'Kidus Haile',
      courierPhone: '+251920876543',
      courierVehicle: 'Bicycle',
      amountETB: 120.0,
      paymentMethod: 'cbe_birr',
      transactionReference: 'CBE-TX-81920381',
      status: 'pending_verification',
      submittedAt: '2026-10-25 09:45 AM',
    },
    {
      id: 'set-003',
      courierName: 'Biruk Solomon',
      courierPhone: '+251913765432',
      courierVehicle: 'Motorcycle',
      amountETB: 480.0,
      paymentMethod: 'telebirr',
      transactionReference: 'TB-7766554433',
      status: 'settled',
      submittedAt: '2026-10-24 04:15 PM',
    },
  ]);

  // Registered Couriers Fleet State
  const [fleet, setFleet] = useState<CourierFleetRecord[]>([
    {
      id: 'r-001',
      name: 'Yonas Getachew',
      phone: '+251912987654',
      vehicleType: 'motorcycle',
      plateNumber: 'AA-2-B48192',
      subcity: 'Bole',
      libreVerified: true,
      debtETB: 140.0,
      status: 'active',
      rating: 4.95,
    },
    {
      id: 'r-002',
      name: 'Kidus Haile',
      phone: '+251920876543',
      vehicleType: 'bicycle',
      subcity: 'Kirkos',
      libreVerified: true,
      debtETB: 85.0,
      status: 'active',
      rating: 4.88,
    },
    {
      id: 'r-003',
      name: 'Biruk Solomon',
      phone: '+251913765432',
      vehicleType: 'motorcycle',
      plateNumber: 'AA-2-B31940',
      subcity: 'Arada',
      libreVerified: false,
      debtETB: 510.0,
      status: 'suspended',
      rating: 4.75,
    },
    {
      id: 'r-004',
      name: 'Sara Desta',
      phone: '+251911998877',
      vehicleType: 'bicycle',
      subcity: 'Bole',
      libreVerified: true,
      debtETB: 45.0,
      status: 'active',
      rating: 4.92,
    },
  ]);

  const handleApproveSettlement = (id: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'settled' } : s))
    );
  };

  const handleRejectSettlement = (id: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
  };

  const handleToggleCourierStatus = (id: string) => {
    setFleet((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c
      )
    );
  };

  const handleToggleLibreVerified = (id: string) => {
    setFleet((prev) =>
      prev.map((c) => (c.id === id ? { ...c, libreVerified: !c.libreVerified } : c))
    );
  };

  const handleSimulateNewSettlement = () => {
    const randomRef = 'TB-' + Math.floor(1000000000 + Math.random() * 9000000000);
    const newSet: SettlementItem = {
      id: `set-${Date.now()}`,
      courierName: 'Yonas Getachew',
      courierPhone: '+251912987654',
      courierVehicle: 'Motorcycle',
      amountETB: 140.0,
      paymentMethod: 'telebirr',
      transactionReference: randomRef,
      status: 'pending_verification',
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSettlements((prev) => [newSet, ...prev]);
  };

  const pendingSettlementsCount = settlements.filter((s) => s.status === 'pending_verification').length;

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 overflow-y-auto select-none p-4 sm:p-6 space-y-5 text-neutral-900 font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">
              Platform Operations & Audit Console
            </h2>
            <span className="rounded-full bg-black text-white px-2 py-0.5 text-[10px] font-bold">
              Admin
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Addis Ababa Pilot • Courier vetting, debt reconciliations & delivery audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateNewSettlement}
            className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Simulate Telebirr Settlement</span>
          </button>
        </div>
      </div>

      {/* 2. Key Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Settlements */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
            Pending Bank Settlements
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {pendingSettlementsCount}
            </span>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              Awaiting Audit
            </span>
          </div>
        </div>

        {/* Active Couriers Online */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
            Active Fleet Online
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {fleet.filter((c) => c.status === 'active').length}
            </span>
            <span className="text-[10px] text-neutral-500">
              Registered: {fleet.length}
            </span>
          </div>
        </div>

        {/* Total Deliveries Tracked */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
            Deliveries In Platform
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {deliveries.length}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Live Feed
            </span>
          </div>
        </div>

        {/* Accrued Platform Commission */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
            Accrued Commission (Today)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              820.00
            </span>
            <span className="text-[10px] text-neutral-500">ETB</span>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('settlements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'settlements'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Commission Settlements</span>
          {pendingSettlementsCount > 0 && (
            <span className="h-4 px-1.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold flex items-center justify-center">
              {pendingSettlementsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'fleet'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Fleet Vetting & Libre</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'deliveries'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Live Dispatch Audit</span>
        </button>
      </div>

      {/* ================= TAB 1: SETTLEMENTS LEDGER ================= */}
      {activeTab === 'settlements' && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden space-y-2">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Offline Settlement Audit Queue
              </h3>
              <p className="text-[11px] text-neutral-500">
                Couriers pay platform commission via Telebirr or CBE Birr. Pending slips do not reduce rider debt until verified here.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Courier</th>
                  <th className="py-2.5 px-4 font-bold">Channel & Reference</th>
                  <th className="py-2.5 px-4 font-bold">Amount Due</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Admin Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{item.courierName}</div>
                      <div className="text-[11px] text-neutral-500">
                        {item.courierVehicle} • {item.courierPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="uppercase font-bold text-[10px] text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {item.paymentMethod.replace('_', ' ')}
                      </span>
                      <div className="font-mono text-neutral-600 text-[11px] mt-0.5">
                        {item.transactionReference}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-neutral-900 font-mono">
                        ETB {item.amountETB.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.submittedAt}</div>
                    </td>

                    <td className="py-3 px-4">
                      {item.status === 'pending_verification' ? (
                        <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                          Pending Audit
                        </span>
                      ) : item.status === 'settled' ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                          Approved & Credited
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 text-rose-900 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
                          Rejected / Void
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.status === 'pending_verification' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveSettlement(item.id)}
                            className="rounded-lg bg-black px-2.5 py-1 text-[11px] font-bold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectSettlement(item.id)}
                            className="rounded-lg bg-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-800 hover:bg-neutral-300 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Reconciled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FLEET VETTING ================= */}
      {activeTab === 'fleet' && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden space-y-2">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Registered Couriers & Libre Compliance
              </h3>
              <p className="text-[11px] text-neutral-500">
                Enforce motorcycle Libre document verification and monitor 500 ETB debt caps.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Courier</th>
                  <th className="py-2.5 px-4 font-bold">Vehicle & Plate</th>
                  <th className="py-2.5 px-4 font-bold">Libre Compliance</th>
                  <th className="py-2.5 px-4 font-bold">Debt Balance</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {fleet.map((courier) => (
                  <tr key={courier.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{courier.name}</div>
                      <div className="text-[11px] text-neutral-500">
                        {courier.phone} • ★ {courier.rating}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="capitalize font-semibold text-neutral-900">
                        {courier.vehicleType}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {courier.plateNumber || 'No Plate (Bicycle)'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLibreVerified(courier.id)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                          courier.libreVerified
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                        title="Click to toggle Libre verification"
                      >
                        {courier.libreVerified ? '✓ Libre Verified' : '⚠ Missing Libre'}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-neutral-900 font-mono">
                        ETB {courier.debtETB.toFixed(2)}
                      </div>
                      {courier.debtETB >= 500 && (
                        <span className="text-[9px] font-bold text-rose-600 block">
                          At 500 ETB Limit
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          courier.status === 'active'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {courier.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCourierStatus(courier.id)}
                        className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 transition-colors shadow-sm"
                      >
                        {courier.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DELIVERIES AUDIT ================= */}
      {activeTab === 'deliveries' && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden space-y-2">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Live Delivery Orders Dispatch Log
              </h3>
              <p className="text-[11px] text-neutral-500">
                Inspect real-time orders, rider confirmation audit trail (No OTP), and fare allocations across Addis Ababa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Tracking #</th>
                  <th className="py-2.5 px-4 font-bold">Route</th>
                  <th className="py-2.5 px-4 font-bold">Contacts</th>
                  <th className="py-2.5 px-4 font-bold">Fare & Payer</th>
                  <th className="py-2.5 px-4 font-bold">Status & Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deliveries.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-neutral-900">
                        {item.trackingNumber}
                      </div>
                      <div className="text-[10px] text-neutral-500 capitalize">
                        {item.vehicleType} • {item.packageWeightKg} kg
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="truncate font-semibold text-neutral-900 max-w-[200px]">
                        {item.pickupLandmark}
                      </div>
                      <div className="truncate text-neutral-500 text-[11px] max-w-[200px]">
                        → {item.dropoffLandmark}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-neutral-900">
                        From: <span className="font-medium">{item.pickupContactName}</span> ({item.pickupContactPhone})
                      </div>
                      <div className="text-neutral-500 text-[11px]">
                        To: {item.dropoffContactName} ({item.dropoffContactPhone})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-neutral-900 font-mono">
                        ETB {item.fareTotal.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-500 capitalize">
                        {item.payerType} pays • {item.paymentStatus}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold block w-fit">
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {item.auditTrail && item.auditTrail.length > 0 && (
                        <div className="text-[10px] text-neutral-500 mt-1 max-w-[220px]">
                          Latest: {item.auditTrail[item.auditTrail.length - 1].note}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
