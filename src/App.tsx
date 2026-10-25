import { useState } from 'react';
import { MapBookingFlow } from './components/customer/MapBookingFlow';
import { DeliveriesList } from './components/customer/DeliveriesList';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { MobileBottomNav, CustomerTab } from './components/MobileBottomNav';
import { CourierJobBoardPreview } from './components/courier/CourierJobBoardPreview';
import { AdminAuditPreview } from './components/admin/AdminAuditPreview';
import { Delivery, DeliveryStatus } from './types/delivery';
import { INITIAL_MOCK_DELIVERIES } from './data/mockDeliveries';
import { 
  CheckCircle, 
  Smartphone, 
  Maximize2, 
  Wifi, 
  Battery, 
  Signal
} from 'lucide-react';

export type ActivePortal = 'customer' | 'courier' | 'admin';

export function App() {
  const [activePortal, setActivePortal] = useState<ActivePortal>('customer');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('book');
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_MOCK_DELIVERIES);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'phone' | 'fullscreen'>('phone');

  const isActiveStatus = (status: DeliveryStatus) =>
    ['requested', 'assigned', 'arrived_pickup', 'picked_up', 'arrived_dropoff'].includes(status);

  const activeDeliveriesCount = deliveries.filter((d) => isActiveStatus(d.status)).length;

  const handleCreateDelivery = (newDelivery: Delivery) => {
    setDeliveries((prev) => [newDelivery, ...prev]);
    setCustomerTab('deliveries');
    setNotification(
      `Delivery booked (${newDelivery.trackingNumber})! Courier dispatch initiated.`
    );
    setTimeout(() => setNotification(null), 5000);
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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center selection:bg-neutral-800 selection:text-white">
      {/* Top Desktop Controls Bar */}
      <header className="w-full z-40 border-b border-neutral-900 bg-black/90 backdrop-blur-md px-4 py-2.5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs">
              U
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">
                SwiftAddis
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-semibold px-2 py-0.5 rounded-full">
                Uber Rides UI
              </span>
            </div>
          </div>

          {/* Desktop Portal & Frame Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Desktop only) */}
            <div className="hidden md:flex items-center bg-neutral-900 p-0.5 rounded-full border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('phone')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
                  viewMode === 'phone'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Uber Smartphone Mockup View"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Phone Frame</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('fullscreen')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
                  viewMode === 'fullscreen'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Full Screen View"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </button>
            </div>

            {/* Portal Switcher */}
            <div className="flex items-center bg-neutral-900 p-0.5 rounded-full border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setActivePortal('customer')}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  activePortal === 'customer'
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Customer App
              </button>
              <button
                type="button"
                onClick={() => setActivePortal('courier')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  activePortal === 'courier'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Courier Feed
              </button>
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className={`hidden sm:inline-block px-2.5 py-1 rounded-full font-semibold transition-all ${
                  activePortal === 'admin'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 text-xs font-bold shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-neutral-400 hover:text-black font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-start py-4 sm:py-6 px-2 sm:px-4">
        {/* Phone Frame View on Desktop (Matching user screenshot) */}
        {viewMode === 'phone' ? (
          <div className="flex flex-col items-center justify-center w-full max-w-md">
            {/* Desktop Top Title & Icon (Matching Screenshot 1 & 2) */}
            <div className="hidden md:flex flex-col items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl mb-3">
                <svg width="34" height="24" viewBox="0 0 120 80" fill="none">
                  <ellipse cx="60" cy="72" rx="46" ry="6" fill="#000000" fillOpacity="0.2" />
                  <circle cx="28" cy="56" r="14" stroke="#000000" strokeWidth="5" fill="#f3f4f6" />
                  <circle cx="92" cy="56" r="14" stroke="#000000" strokeWidth="5" fill="#f3f4f6" />
                  <path d="M26 56L44 42L66 42L82 28L92 56" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                  <rect x="18" y="24" width="22" height="20" rx="3" fill="#000000" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Go anywhere
              </h1>
            </div>

            {/* Smartphone Device Mockup Frame */}
            <div className="w-full max-w-[390px] h-[780px] max-h-[88vh] bg-white text-black rounded-[46px] border-[10px] border-[#202020] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden relative flex flex-col ring-1 ring-white/10">
              {/* iPhone Status Bar (9:41, Notch, Icons) */}
              <div className="h-11 bg-white flex items-center justify-between px-6 pt-1 select-none z-30 shrink-0 border-b border-neutral-100">
                <span className="font-bold text-xs text-neutral-900 font-mono tracking-tight">
                  9:41
                </span>
                {/* Notch */}
                <div className="w-24 h-4 bg-[#202020] rounded-b-xl flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#111111] mr-3"></div>
                  <div className="w-2 h-2 rounded-full bg-[#1a1a1a]"></div>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-800">
                  <Signal className="h-3 w-3 stroke-[2.5]" />
                  <Wifi className="h-3 w-3 stroke-[2.5]" />
                  <Battery className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              </div>

              {/* Inside Screen Content Area */}
              <div className="flex-1 w-full relative flex flex-col overflow-hidden pb-14">
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

                    <MobileBottomNav
                      activeTab={customerTab}
                      onTabChange={setCustomerTab}
                      activeDeliveriesCount={activeDeliveriesCount}
                    />
                  </>
                )}

                {activePortal === 'courier' && (
                  <div className="h-full overflow-y-auto bg-neutral-900 text-white p-3">
                    <CourierJobBoardPreview
                      deliveries={deliveries}
                      onClaimDelivery={handleClaimDelivery}
                    />
                  </div>
                )}

                {activePortal === 'admin' && (
                  <div className="h-full overflow-y-auto bg-neutral-900 text-white p-3">
                    <AdminAuditPreview />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen View on Desktop */
          <div className="w-full max-w-5xl h-[86vh] bg-white text-black rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-neutral-800">
            {activePortal === 'customer' && (
              <>
                <div className="flex-1 relative overflow-hidden pb-14">
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
                </div>

                <MobileBottomNav
                  activeTab={customerTab}
                  onTabChange={setCustomerTab}
                  activeDeliveriesCount={activeDeliveriesCount}
                />
              </>
            )}

            {activePortal === 'courier' && (
              <div className="h-full overflow-y-auto bg-neutral-950 text-white p-6">
                <CourierJobBoardPreview
                  deliveries={deliveries}
                  onClaimDelivery={handleClaimDelivery}
                />
              </div>
            )}

            {activePortal === 'admin' && (
              <div className="h-full overflow-y-auto bg-neutral-950 text-white p-6">
                <AdminAuditPreview />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
