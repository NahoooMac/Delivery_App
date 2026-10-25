import React from 'react';
import { 
  Bike, 
  Package, 
  ShieldCheck, 
  Menu, 
  X,
  MapPin,
  Sparkles
} from 'lucide-react';

export type ActivePortal = 'customer' | 'courier' | 'admin';

interface NavbarProps {
  activePortal: ActivePortal;
  onPortalChange: (portal: ActivePortal) => void;
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  onPortalChange,
  onOpenBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 shadow-lg shadow-amber-500/20">
            <Bike className="h-6 w-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Swift<span className="text-amber-400">Addis</span>
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Pilot
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Addis Ababa Courier Platform <span className="text-slate-600">•</span> <span className="italic text-slate-500">Working Brand</span>
            </p>
          </div>
        </div>

        {/* Portal Nav tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => onPortalChange('customer')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePortal === 'customer'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Customer Portal
          </button>
          <button
            type="button"
            onClick={() => onPortalChange('courier')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePortal === 'courier'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            Courier Board
            <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[9px] text-amber-300 border border-slate-700">Preview</span>
          </button>
          <button
            type="button"
            onClick={() => onPortalChange('admin')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePortal === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Audit
            <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[9px] text-emerald-300 border border-slate-700">Preview</span>
          </button>
        </nav>

        {/* Action Button & Status Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mock Mode (UI Demo)</span>
          </div>

          <button
            type="button"
            onClick={onOpenBooking}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 transition-all hover:brightness-110 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Send a Delivery</span>
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 md:hidden hover:bg-slate-800 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 md:hidden space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>Pilot Zone: Addis Ababa (11 Sub-Cities)</span>
            </div>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-400">Mock Data</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => {
                onPortalChange('customer');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold ${
                activePortal === 'customer' ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Customer Dashboard
              </span>
              <span className="text-[10px] opacity-80">Primary</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPortalChange('courier');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold ${
                activePortal === 'courier' ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bike className="h-4 w-4" /> Courier Job Board
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-amber-300">Preview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPortalChange('admin');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold ${
                activePortal === 'admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin Audit & Reconciliation
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-300">Preview</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
