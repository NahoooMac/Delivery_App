import { useState } from 'react';
import { MapBookingFlow } from './components/customer/MapBookingFlow';
import { DeliveriesList } from './components/customer/DeliveriesList';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { MobileBottomNav, CustomerTab } from './components/MobileBottomNav';
import { CourierJobBoardPreview } from './components/courier/CourierJobBoardPreview';
import { AdminAuditPreview } from './components/admin/AdminAuditPreview';
import { Delivery, DeliveryStatus } from './types/delivery';
import { INITIAL_MOCK_DELIVERIES } from './data/mockDeliveries';
import { CheckCircle } from 'lucide-react';

export type ActivePortal = 'customer' | 'courier' | 'admin';

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
    setNotification(
      `Delivery booked (${newDelivery.trackingNumber})! Courier dispatch initiated.`
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
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-neutral-100 font-sans flex flex-col overflow-x-hidden selection:bg-neutral-800 selection:text-white">
      {/* Sleek Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/85 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm shadow-md">
            S
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              SwiftAddis
            </span>
            <span className="text-[10px] bg-neutral-800 text-neutral-300 font-semibold px-2 py-0.5 rounded-full hidden xs:inline-block">
              Addis Delivery
            </span>
          </div>
        </div>

        {/* Development Portals Switcher */}
        <div className="flex items-center bg-neutral-900/90 p-1 rounded-full border border-neutral-800 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setActivePortal('customer')}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              activePortal === 'customer'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Customer App
          </button>
          <button
            type="button"
            onClick={() => setActivePortal('courier')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              activePortal === 'courier'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Courier Feed
          </button>
          <button
            type="button"
            onClick={() => setActivePortal('admin')}
            className={`px-2.5 sm:px-3 py-1 rounded-full font-semibold transition-all ${
              activePortal === 'admin'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 text-xs font-bold shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-top-3 max-w-[90vw]">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="truncate">{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-neutral-400 hover:text-black font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Experience */}
      <main className="w-full flex-1 flex flex-col pt-14">
        {activePortal === 'customer' && (
          <div className="w-full flex-1 flex flex-col relative">
            {customerTab === 'book' && (
              <div className="w-full h-[calc(100dvh-3.5rem)] relative overflow-hidden">
                <MapBookingFlow
                  onOrderCreated={handleCreateDelivery}
                  onGoToDeliveries={() => setCustomerTab('deliveries')}
                />
              </div>
            )}

            {customerTab === 'deliveries' && (
              <div className="w-full flex-1 min-h-[calc(100dvh-3.5rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-20">
                <div className="w-full max-w-3xl flex-1">
                  <DeliveriesList
                    deliveries={deliveries}
                    onBookNew={() => setCustomerTab('book')}
                  />
                </div>
              </div>
            )}

            {customerTab === 'profile' && (
              <div className="w-full flex-1 min-h-[calc(100dvh-3.5rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-20">
                <div className="w-full max-w-xl flex-1">
                  <CustomerProfile />
                </div>
              </div>
            )}

            {/* Mobile Bottom Navigation (Always accessible in Customer view) */}
            <MobileBottomNav
              activeTab={customerTab}
              onTabChange={setCustomerTab}
              activeDeliveriesCount={activeDeliveriesCount}
            />
          </div>
        )}

        {activePortal === 'courier' && (
          <div className="w-full flex-1 min-h-[calc(100dvh-3.5rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-12">
            <div className="w-full max-w-2xl flex-1">
              <CourierJobBoardPreview
                deliveries={deliveries}
                onClaimDelivery={handleClaimDelivery}
              />
            </div>
          </div>
        )}

        {activePortal === 'admin' && (
          <div className="w-full flex-1 min-h-[calc(100dvh-3.5rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-12">
            <div className="w-full max-w-7xl flex-1">
              <AdminAuditPreview deliveries={deliveries} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
