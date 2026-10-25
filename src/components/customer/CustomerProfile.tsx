import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Settings, 
  Info, 
  Globe, 
  Bookmark
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'am'>('en');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
            AK
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Abebe Kebede</h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Verified Customer
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Phone className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-mono text-slate-300">+251 911 234 567</span>
              <span>•</span>
              <span>Addis Ababa, ET</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Places in Addis */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Bookmark className="h-4 w-4 text-amber-400" />
          <span>Saved Addresses (Addis Ababa)</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Home</span>
                <span className="text-slate-300">Bole Medhanealem, Cameroon St (Bole)</span>
                <span className="text-[11px] text-slate-500 block">Near Edna Mall</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Default Pickup</span>
          </div>

          <div className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Work / Office</span>
                <span className="text-slate-300">Kazanchis, ECA / UNECA Headquarters (Kirkos)</span>
                <span className="text-[11px] text-slate-500 block">Main Gate Entrance</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Frequent</span>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Settings className="h-4 w-4 text-amber-400" />
          <span>Preferences & Language</span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="h-4 w-4 text-slate-400" />
            <span>Display Language</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                language === 'am'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              አማርኛ
            </button>
          </div>
        </div>

        {/* Platform Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block">SwiftAddis Platform Prototype</strong>
            <span>
              This is a working client prototype designed for Addis Ababa motorcycle and bicycle logistics. Backend database, payment webhooks, and live SMS are currently decoupled in mock demonstration mode.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
