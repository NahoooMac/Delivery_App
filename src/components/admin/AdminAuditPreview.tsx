import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

interface SettlementItem {
  id: string;
  courierName: string;
  courierPhone: string;
  amountETB: number;
  paymentMethod: 'telebirr' | 'cbe_birr';
  transactionReference: string;
  status: 'pending_verification' | 'settled' | 'rejected';
  submittedAt: string;
}

export const AdminAuditPreview: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementItem[]>([
    {
      id: 'set-001',
      courierName: 'Yonas Getachew (Motorcycle)',
      courierPhone: '+251912987654',
      amountETB: 350.0,
      paymentMethod: 'telebirr',
      transactionReference: 'TB-9283741920',
      status: 'pending_verification',
      submittedAt: '2026-10-25 10:30 AM',
    },
    {
      id: 'set-002',
      courierName: 'Kidus Haile (Bicycle)',
      courierPhone: '+251920876543',
      amountETB: 120.0,
      paymentMethod: 'cbe_birr',
      transactionReference: 'CBE-TX-81920381',
      status: 'pending_verification',
      submittedAt: '2026-10-25 09:45 AM',
    },
    {
      id: 'set-003',
      courierName: 'Biruk Solomon (Motorcycle)',
      courierPhone: '+251913765432',
      amountETB: 480.0,
      paymentMethod: 'telebirr',
      transactionReference: 'TB-7766554433',
      status: 'settled',
      submittedAt: '2026-10-24 04:15 PM',
    },
  ]);

  const handleApprove = (id: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'settled' } : s))
    );
  };

  const handleReject = (id: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Platform Operations & Audit Dashboard</h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Admin Preview
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile offline Telebirr/CBE settlements, vet courier Libre documents, and audit platform commission ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
            Pilot City: <strong className="text-white">Addis Ababa</strong>
          </span>
        </div>
      </div>

      {/* Admin KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Pending Settlements</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {settlements.filter((s) => s.status === 'pending_verification').length}
            </span>
            <span className="text-[10px] text-slate-500">Awaiting Bank Audit</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Active Couriers Online</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">18</span>
            <span className="text-[10px] text-slate-500">12 Moto / 6 Bike</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Courier Vetting Queue</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">4</span>
            <span className="text-[10px] text-slate-500">Libre / ID Pending</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400">Platform Commission (Today)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">820.00</span>
            <span className="text-[10px] text-slate-400">ETB Accrued</span>
          </div>
        </div>
      </div>

      {/* Manual Settlement Audit Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <span>Offline Commission Settlement Audit Queue</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Rule: Pending references DO NOT credit rider debt until approved by an administrator following bank statement check.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-medium">Courier</th>
                <th className="pb-2.5 font-medium">Channel & Reference</th>
                <th className="pb-2.5 font-medium">Amount Due</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {settlements.map((item) => (
                <tr key={item.id} className="text-slate-300 hover:bg-slate-800/30">
                  <td className="py-3">
                    <span className="font-semibold text-white block">{item.courierName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{item.courierPhone}</span>
                  </td>
                  <td className="py-3">
                    <span className="uppercase font-semibold text-amber-300 block">{item.paymentMethod}</span>
                    <span className="font-mono text-slate-400">{item.transactionReference}</span>
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-white">{item.amountETB.toFixed(2)} ETB</span>
                    <span className="text-[10px] text-slate-500 block">{item.submittedAt}</span>
                  </td>
                  <td className="py-3">
                    {item.status === 'pending_verification' ? (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        Pending Verification
                      </span>
                    ) : item.status === 'settled' ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Approved & Credited
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                        Rejected / Void
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {item.status === 'pending_verification' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className="rounded-lg bg-rose-600/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Audit Complete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
