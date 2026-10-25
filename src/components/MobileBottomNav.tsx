import React from 'react';
import { Navigation, Clock, User } from 'lucide-react';

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-lg px-4 py-2 flex items-center justify-around safe-area-bottom shadow-lg">
      {/* Ride / Send */}
      <button
        type="button"
        onClick={() => onTabChange('book')}
        className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'book'
            ? 'text-black font-bold'
            : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <Navigation className={`h-5 w-5 ${activeTab === 'book' ? 'text-black stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Ride & Send</span>
      </button>

      {/* Activity / Deliveries */}
      <button
        type="button"
        onClick={() => onTabChange('deliveries')}
        className={`relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'deliveries'
            ? 'text-black font-bold'
            : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <Clock className={`h-5 w-5 ${activeTab === 'deliveries' ? 'text-black stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Activity</span>
        {activeDeliveriesCount > 0 && (
          <span className="absolute -top-0.5 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
            {activeDeliveriesCount}
          </span>
        )}
      </button>

      {/* Account / Profile */}
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'profile'
            ? 'text-black font-bold'
            : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-black stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Account</span>
      </button>
    </nav>
  );
};
