import { useState, useEffect, useCallback } from 'react';
import { MapBookingFlow } from './components/customer/MapBookingFlow';
import { DeliveriesList } from './components/customer/DeliveriesList';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { MobileBottomNav, CustomerTab } from './components/MobileBottomNav';
import { CourierJobBoardPreview } from './components/courier/CourierJobBoardPreview';
import { AdminAuditPreview } from './components/admin/AdminAuditPreview';
import { Delivery, DeliveryStatus } from './types/delivery';
import { INITIAL_MOCK_DELIVERIES } from './data/mockDeliveries';
import { CheckCircle, Bike, Shield, ArrowUpRight } from 'lucide-react';

export type ActivePortal = 'customer' | 'courier' | 'admin';

function getInitialPortal(): ActivePortal {
  if (typeof window === 'undefined') return 'customer';
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/riders') || path.startsWith('/rider')) return 'courier';
  if (path.startsWith('/admin')) return 'admin';
  return 'customer'; // default / or /users
}

export function App() {
  const [activePortal, setActivePortal] = useState<ActivePortal>(getInitialPortal);
  const [customerTab, setCustomerTab] = useState<CustomerTab>('book');
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_MOCK_DELIVERIES);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state with browser History / URL
  useEffect(() => {
    const handlePopState = () => {
      setActivePortal(getInitialPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigatePortal = useCallback((portal: ActivePortal) => {
    const targetPath = portal === 'customer' ? '/users' : portal === 'courier' ? '/riders' : '/admin';
    window.history.pushState({}, '', targetPath);
    setActivePortal(portal);
  }, []);

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
      {/* 1. CUSTOMER PORTAL HEADER (/users or /) */}
      {activePortal === 'customer' && (
        <header className="fixed top-0 left-0 right-0 z-40 h-13 bg-black/85 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs shadow-sm">
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
          <div className="text-[11px] text-neutral-400 font-medium hidden sm:block">
            Motorcycle & Bicycle Package Dispatch
          </div>
        </header>
      )}

      {/* 2. RIDERS PORTAL HEADER (/riders) */}
      {activePortal === 'courier' && (
        <header className="fixed top-0 left-0 right-0 z-40 h-13 bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-xs shadow-sm">
              <Bike className="h-4 w-4 text-black stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                SwiftAddis Courier
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/50 font-bold px-2 py-0.5 rounded-full">
                Riders Side
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigatePortal('customer')}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <span>User Side</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <span className="text-neutral-700">|</span>
            <button
              type="button"
              onClick={() => navigatePortal('admin')}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Admin</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </header>
      )}

      {/* 3. ADMIN PORTAL HEADER (/admin) */}
      {activePortal === 'admin' && (
        <header className="fixed top-0 left-0 right-0 z-40 h-13 bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                SwiftAddis Operations
              </span>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/50 font-bold px-2 py-0.5 rounded-full">
                Admin Console
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigatePortal('customer')}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <span>User Side</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <span className="text-neutral-700">|</span>
            <button
              type="button"
              onClick={() => navigatePortal('courier')}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Riders Side</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </header>
      )}

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
      <main className="w-full flex-1 flex flex-col pt-13">
        {/* USERS SIDE */}
        {activePortal === 'customer' && (
          <div className="w-full flex-1 flex flex-col relative">
            {customerTab === 'book' && (
              <div className="w-full h-[calc(100dvh-3.25rem)] relative overflow-hidden">
                <MapBookingFlow
                  onOrderCreated={handleCreateDelivery}
                  onGoToDeliveries={() => setCustomerTab('deliveries')}
                />
              </div>
            )}

            {customerTab === 'deliveries' && (
              <div className="w-full flex-1 min-h-[calc(100dvh-3.25rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-20">
                <div className="w-full max-w-3xl flex-1">
                  <DeliveriesList
                    deliveries={deliveries}
                    onBookNew={() => setCustomerTab('book')}
                  />
                </div>
              </div>
            )}

            {customerTab === 'profile' && (
              <div className="w-full flex-1 min-h-[calc(100dvh-3.25rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-20">
                <div className="w-full max-w-xl flex-1">
                  <CustomerProfile onNavigate={navigatePortal} />
                </div>
              </div>
            )}

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
              activeTab={customerTab}
              onTabChange={setCustomerTab}
              activeDeliveriesCount={activeDeliveriesCount}
            />
          </div>
        )}

        {/* RIDERS SIDE */}
        {activePortal === 'courier' && (
          <div className="w-full flex-1 min-h-[calc(100dvh-3.25rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-12">
            <div className="w-full max-w-2xl flex-1">
              <CourierJobBoardPreview
                deliveries={deliveries}
                onClaimDelivery={handleClaimDelivery}
              />
            </div>
          </div>
        )}

        {/* ADMIN PAGE */}
        {activePortal === 'admin' && (
          <div className="w-full flex-1 min-h-[calc(100dvh-3.25rem)] bg-neutral-100 flex flex-col items-center p-3 sm:p-6 pb-12">
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
