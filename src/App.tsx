import { useState } from 'react';
import { Navbar, ActivePortal } from './components/Navbar';
import { MobileBottomNav, CustomerTab } from './components/MobileBottomNav';
import { MapBookingFlow } from './components/customer/MapBookingFlow';
import { DeliveriesList } from './components/customer/DeliveriesList';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { CourierJobBoardPreview } from './components/courier/CourierJobBoardPreview';
import { AdminAuditPreview } from './components/admin/AdminAuditPreview';
import { Delivery, DeliveryStatus } from './types/delivery';
import { INITIAL_MOCK_DELIVERIES } from './data/mockDeliveries';
import { CheckCircle, Info, Bike } from 'lucide-react';

export function App() {
  const [activePortal, setActivePortal] = useState<ActivePortal>('customer');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('book');
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_MOCK_DELIVERIES);
  const [notification, setNotification] = useState<string | null>(null);

  const isActiveStatus = (status: DeliveryStatus) =>
    ['requested', 'assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff'].includes(status);

  const activeDeliveriesCount = deliveries.filter((d) => isActiveStatus(d.status)).length;

  const handleCreateDelivery = (newDelivery: Delivery) => {
    setDeliveries((prev) => [newDelivery, ...prev]);
    setCustomerTab('deliveries');
    setNotification(
      `Delivery ${newDelivery.trackingNumber} booked! Broadcasted to nearby Addis Ababa couriers.`
    );
    setTimeout(() => setNotification(null), 6000);
  };

  const handleClaimDelivery = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'assigned',
              riderName: 'Yonas Getachew (Motorcycle)',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Navbar
        activePortal={activePortal}
        onPortalChange={setActivePortal}
        customerTab={customerTab}
        onCustomerTabChange={setCustomerTab}
        activeDeliveriesCount={activeDeliveriesCount}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
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

      {/* Role Banner if inside Courier or Admin portals */}
      {activePortal !== 'customer' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Viewing as <strong>{activePortal === 'courier' ? 'Courier Job Feed' : 'Admin Operations Audit'}</strong> (Internal Preview)
              </span>
            </span>
            <button
              type="button"
              onClick={() => setActivePortal('customer')}
              className="font-bold underline hover:text-white"
            >
              Switch back to Customer App
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-10">
        {/* Customer Portal Views */}
        {activePortal === 'customer' && (
          <>
            {customerTab === 'book' && (
              <MapBookingFlow
                onOrderCreated={handleCreateDelivery}
                onGoToDeliveries={() => setCustomerTab('deliveries')}
              />
            )}

            {customerTab === 'deliveries' && (
              <DeliveriesList
                deliveries={deliveries}
                onBookNew={() => setCustomerTab('book')}
              />
            )}

            {customerTab === 'profile' && <CustomerProfile />}
          </>
        )}

        {/* Courier Job Board Preview */}
        {activePortal === 'courier' && (
          <CourierJobBoardPreview
            deliveries={deliveries}
            onClaimDelivery={handleClaimDelivery}
          />
        )}

        {/* Admin Operations Audit Preview */}
        {activePortal === 'admin' && <AdminAuditPreview />}
      </main>

      {/* Mobile Bottom Navigation (Customer Portal only) */}
      {activePortal === 'customer' && (
        <MobileBottomNav
          activeTab={customerTab}
          onTabChange={setCustomerTab}
          activeDeliveriesCount={activeDeliveriesCount}
        />
      )}

      {/* Lightweight Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-6 px-4 text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-slate-300">SwiftAddis</span>
            <span>(Working Title Delivery Platform)</span>
            <span>•</span>
            <span>Addis Ababa, Ethiopia</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Motorcycle & Bicycle Urban Logistics</span>
            <span>•</span>
            <span>Mock Mode (Decoupled Client UI)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
