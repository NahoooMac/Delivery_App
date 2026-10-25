import React from 'react';
import { Navigation, Package, User } from 'lucide-react';

export type CustomerTab = 'book' | 'deliveries' | 'profile';

interface MobileBottomNavProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  activeDeliveriesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeDeliveriesCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-2 flex items-center justify-around safe-area-bottom shadow-2xl">
      {/* Book / Home */}
      <button
        type="button"
        onClick={() => onTabChange('book')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          activeTab === 'book'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Navigation className={`h-5 w-5 ${activeTab === 'book' ? 'text-amber-400' : ''}`} />
        <span className="text-[10px]">Send</span>
      </button>

      {/* Deliveries */}
      <button
        type="button"
        onClick={() => onTabChange('deliveries')}
        className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          activeTab === 'deliveries'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Package className={`h-5 w-5 ${activeTab === 'deliveries' ? 'text-amber-400' : ''}`} />
        <span className="text-[10px]">Deliveries</span>
        {activeDeliveriesCount > 0 && (
          <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
            {activeDeliveriesCount}
          </span>
        )}
      </button>

      {/* Profile */}
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          activeTab === 'profile'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-amber-400' : ''}`} />
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
