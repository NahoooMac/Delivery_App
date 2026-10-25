import React from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Globe, 
  Bookmark,
  ChevronRight,
  HelpCircle,
  CreditCard
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Account
        </h2>
        <span className="text-xs font-semibold text-neutral-500">
          SwiftAddis Pilot
        </span>
      </div>

      {/* User Header Profile Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white font-extrabold text-base">
            AK
          </div>
          <div>
            <h3 className="font-extrabold text-neutral-900 text-sm">Abebe Kebede</h3>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Phone className="h-3 w-3" />
              <span>+251 911 234 567</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
          Verified
        </span>
      </div>

      {/* Account Settings List */}
      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 shadow-sm overflow-hidden text-xs">
        <div className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer">
          <div className="flex items-center gap-3 text-neutral-900 font-semibold">
            <Bookmark className="h-4 w-4 text-black" />
            <span>Saved Addresses (Home, Office)</span>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer">
          <div className="flex items-center gap-3 text-neutral-900 font-semibold">
            <CreditCard className="h-4 w-4 text-black" />
            <span>Payment Methods (Cash, Telebirr)</span>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer">
          <div className="flex items-center gap-3 text-neutral-900 font-semibold">
            <ShieldCheck className="h-4 w-4 text-black" />
            <span>Safety & OTP Verification Rules</span>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer">
          <div className="flex items-center gap-3 text-neutral-900 font-semibold">
            <Globe className="h-4 w-4 text-black" />
            <span>Language: English / አማርኛ</span>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer">
          <div className="flex items-center gap-3 text-neutral-900 font-semibold">
            <HelpCircle className="h-4 w-4 text-black" />
            <span>Help & Support</span>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>
      </div>

      {/* Pilot Information Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm text-xs space-y-1.5">
        <div className="font-bold text-neutral-900">Addis Ababa Urban Logistics Pilot</div>
        <p className="text-[11px] text-neutral-500">
          Motorcycle and Bicycle delivery operating across Bole, Kirkos, Arada, Yeka, and Addis Ketema sub-cities. Direct payment to courier with 0% hidden platform surcharge.
        </p>
      </div>
    </div>
  );
};
