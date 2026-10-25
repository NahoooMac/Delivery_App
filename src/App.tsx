import { useState } from 'react';
import { Navbar, ActivePortal } from './components/Navbar';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { SendDeliveryModal } from './components/customer/SendDeliveryModal';
import { CourierJobBoardPreview } from './components/courier/CourierJobBoardPreview';
import { AdminAuditPreview } from './components/admin/AdminAuditPreview';
import { Delivery } from './types/delivery';
import { INITIAL_MOCK_DELIVERIES } from './data/mockDeliveries';
import { Bike, CheckCircle, Info } from 'lucide-react';

export function App() {
  const [activePortal, setActivePortal] = useState<ActivePortal>('customer');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_MOCK_DELIVERIES);
  const [notification, setNotification] = useState<string | null>(null);

  const handleCreateDelivery = (newDelivery: Delivery) => {
    setDeliveries((prev) => [newDelivery, ...prev]);
    setNotification(`Order ${newDelivery.trackingNumber} successfully broadcasted to available Addis Ababa couriers!`);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleClaimDelivery = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'assigned',
              riderName: 'Yonas Getachew',
              riderPhone: '+251912987654',
              riderPlate: 'AA-2-B48192',
            }
          : d
      )
    );
    setNotification(`Job claimed successfully! Order locked to courier Yonas Getachew.`);
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activePortal={activePortal}
        onPortalChange={setActivePortal}
        onOpenBooking={() => setIsBookingOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mock Notice Banner */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Platform Foundation:</strong> Interactive client prototype demonstrating delivery booking, motorcycle/bicycle rate engine, single active courier guard, and admin reconciliation.
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
            Mock Mode • Backend Decoupled
          </span>
        </div>

        {/* Portal Views */}
        {activePortal === 'customer' && (
          <CustomerDashboard
            deliveries={deliveries}
            onOpenBooking={() => setIsBookingOpen(true)}
          />
        )}

        {activePortal === 'courier' && (
          <CourierJobBoardPreview
            deliveries={deliveries}
            onClaimDelivery={handleClaimDelivery}
          />
        )}

        {activePortal === 'admin' && <AdminAuditPreview />}
      </main>

      {/* Interactive Booking Modal */}
      <SendDeliveryModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSubmit={handleCreateDelivery}
      />

      {/* Platform Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-slate-300">SwiftAddis</span>
            <span>(Working Title Delivery Platform)</span>
            <span>•</span>
            <span>Addis Ababa, Ethiopia</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>11 Sub-Cities Supported</span>
            <span>•</span>
            <span>Motorcycle (Up to 30kg)</span>
            <span>•</span>
            <span>Bicycle Eco (Up to 5kg)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
