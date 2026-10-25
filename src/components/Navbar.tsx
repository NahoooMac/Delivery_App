import React, { useState, useRef, useEffect } from 'react';
import { 
  Bike, 
  Package, 
  User, 
  Navigation, 
  ChevronDown, 
  ShieldCheck, 
  Code2, 
  ArrowLeft
} from 'lucide-react';
import { CustomerTab } from './MobileBottomNav';

export type ActivePortal = 'customer' | 'courier' | 'admin';

interface NavbarProps {
  activePortal: ActivePortal;
  onPortalChange: (portal: ActivePortal) => void;
  customerTab: CustomerTab;
  onCustomerTabChange: (tab: CustomerTab) => void;
  activeDeliveriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  onPortalChange,
  customerTab,
  onCustomerTabChange,
  activeDeliveriesCount,
}) => {
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const devMenuRef = useRef<HTMLDivElement>(null);

  // Close dev menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (devMenuRef.current && !devMenuRef.current.contains(event.target as Node)) {
        setDevMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => {
              if (activePortal !== 'customer') onPortalChange('customer');
              onCustomerTabChange('book');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Bike className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">
                  Swift<span className="text-amber-400">Addis</span>
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                  Pilot
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-400 sm:block">
                Addis Ababa Delivery Platform <span className="text-slate-600">•</span> Motorcycle & Bicycle
              </p>
            </div>
          </div>
        </div>

        {/* Customer Desktop Nav (Only shown when in customer portal) */}
        {activePortal === 'customer' && (
          <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => onCustomerTabChange('book')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                customerTab === 'book'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Send Package</span>
            </button>

            <button
              type="button"
              onClick={() => onCustomerTabChange('deliveries')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                customerTab === 'deliveries'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>My Deliveries</span>
              {activeDeliveriesCount > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  customerTab === 'deliveries' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500 text-slate-950'
                }`}>
                  {activeDeliveriesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onCustomerTabChange('profile')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                customerTab === 'profile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </button>
          </nav>
        )}

        {/* Non-customer portal return button */}
        {activePortal !== 'customer' && (
          <button
            type="button"
            onClick={() => onPortalChange('customer')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Customer App</span>
          </button>
        )}

        {/* Development Switcher (Discreet & Clearly Isolated) */}
        <div ref={devMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setDevMenuOpen(!devMenuOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Prototype role switcher"
          >
            <Code2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-slate-200 capitalize">
              {activePortal === 'customer' ? 'Customer' : activePortal === 'courier' ? 'Courier Board' : 'Admin'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {/* Dev Dropdown */}
          {devMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Prototype Role Switcher
                </span>
                <span className="text-[10px] text-slate-500">
                  Switch view to inspect role permissions
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPortalChange('customer');
                  setDevMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-left transition-colors ${
                  activePortal === 'customer'
                    ? 'bg-amber-500/15 text-amber-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Navigation className="h-3.5 w-3.5 text-amber-400" />
                <div>
                  <div className="text-white">Customer App</div>
                  <div className="text-[10px] text-slate-400">Map-first booking & deliveries</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPortalChange('courier');
                  setDevMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-left transition-colors ${
                  activePortal === 'courier'
                    ? 'bg-amber-500/15 text-amber-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Bike className="h-3.5 w-3.5 text-amber-400" />
                <div>
                  <div className="text-white">Courier Job Board</div>
                  <div className="text-[10px] text-slate-400">Claim job & debt ceiling rules</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPortalChange('admin');
                  setDevMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-left transition-colors ${
                  activePortal === 'admin'
                    ? 'bg-amber-500/15 text-amber-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <div>
                  <div className="text-white">Admin Operations</div>
                  <div className="text-[10px] text-slate-400">Reconcile Telebirr/CBE references</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
