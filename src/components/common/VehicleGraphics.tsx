import React from 'react';

export const MotorcycleGraphic: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg
    viewBox="0 0 120 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Motorcycle Delivery"
  >
    {/* Soft ground drop shadow */}
    <ellipse cx="60" cy="72" rx="46" ry="6" fill="#000000" fillOpacity="0.15" />
    
    {/* Rear Wheel */}
    <circle cx="28" cy="56" r="15" stroke="#1f2937" strokeWidth="6" fill="#f3f4f6" />
    <circle cx="28" cy="56" r="7" fill="#111827" />
    <circle cx="28" cy="56" r="3" fill="#ffffff" />
    
    {/* Front Wheel */}
    <circle cx="92" cy="56" r="15" stroke="#1f2937" strokeWidth="6" fill="#f3f4f6" />
    <circle cx="92" cy="56" r="7" fill="#111827" />
    <circle cx="92" cy="56" r="3" fill="#ffffff" />

    {/* Exhaust pipe */}
    <path d="M38 58H54L58 54" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
    <rect x="24" y="55" width="22" height="5" rx="2.5" fill="#4b5563" />

    {/* Main Chassis / Frame */}
    <path
      d="M30 54L48 44L66 42L78 30L86 52"
      stroke="#111827"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Engine block */}
    <rect x="44" y="46" width="16" height="14" rx="3" fill="#374151" />
    <path d="M48 49H56M48 53H56M48 57H54" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />

    {/* Fuel Tank (Uber White Glossy finish) */}
    <path
      d="M58 36C64 36 74 38 78 44C78 46 72 48 64 48C56 48 52 42 58 36Z"
      fill="#f9fafb"
      stroke="#111827"
      strokeWidth="2"
    />
    <path d="M60 38C65 38 71 40 73 43" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />

    {/* Courier Cargo Delivery Box (Signature Uber delivery box) */}
    <rect x="18" y="24" width="24" height="22" rx="4" fill="#111827" />
    <rect x="20" y="26" width="20" height="18" rx="3" fill="#1f2937" />
    <path d="M26 35H34" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 31V39" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

    {/* Seat */}
    <path d="M42 38C46 38 52 40 54 44H40L42 38Z" fill="#111827" rx="2" />

    {/* Handlebars & Front Shield */}
    <path d="M76 30L82 22M82 22H76M82 22H88" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path d="M80 32L88 44" stroke="#f9fafb" strokeWidth="4" strokeLinecap="round" />
    
    {/* Headlight */}
    <ellipse cx="88" cy="36" rx="3" ry="4" fill="#fbbf24" />
  </svg>
);

export const BicycleGraphic: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg
    viewBox="0 0 120 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Bicycle Eco Delivery"
  >
    {/* Soft ground drop shadow */}
    <ellipse cx="60" cy="72" rx="44" ry="5.5" fill="#000000" fillOpacity="0.14" />
    
    {/* Rear Wheel with Spokes */}
    <circle cx="28" cy="54" r="16" stroke="#1f2937" strokeWidth="3.5" fill="#f9fafb" />
    <circle cx="28" cy="54" r="3" fill="#111827" />
    <path d="M28 38V70M12 54H44M17 43L39 65M17 65L39 43" stroke="#9ca3af" strokeWidth="1" />

    {/* Front Wheel with Spokes */}
    <circle cx="92" cy="54" r="16" stroke="#1f2937" strokeWidth="3.5" fill="#f9fafb" />
    <circle cx="92" cy="54" r="3" fill="#111827" />
    <path d="M92 38V70M76 54H108M81 43L103 65M81 65L103 43" stroke="#9ca3af" strokeWidth="1" />

    {/* Bicycle Triangle Frame (Clean Emerald/Black Eco Style) */}
    <path
      d="M28 54L48 54L64 34L44 34L28 54Z"
      stroke="#10b981"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M48 54L64 34M44 34L82 34M64 34L86 54"
      stroke="#10b981"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Crank & Pedal */}
    <circle cx="48" cy="54" r="5" fill="#374151" />
    <path d="M48 50L52 44" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="50" y="42" width="6" height="3" rx="1.5" fill="#111827" />

    {/* Seat Post & Saddle */}
    <path d="M46 36L44 26" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path d="M38 26C42 25 50 25 54 26C54 27 50 29 44 29C40 29 38 27 38 26Z" fill="#111827" />

    {/* Rear Cargo Delivery Bag */}
    <rect x="20" y="28" width="16" height="15" rx="3" fill="#111827" />
    <path d="M23 35H33" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

    {/* Handlebar & Front Fork */}
    <path d="M86 54L78 24M74 24H82" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    <path d="M80 22C82 22 85 24 85 26" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
