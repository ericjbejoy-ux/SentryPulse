import React from 'react';

export default function LogoHeader({ isDarkMode = true }) {
  return (
    <div className="flex items-center gap-2.5 font-mono">
      {/* Multi-colored Animated SentryPulse Shield Logo */}
      <svg className={`w-5 h-5 shrink-0 animate-pulseGlow ${isDarkMode ? 'drop-cyan' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z"
          fill="url(#shield-grad)"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7V17M8 11L12 7L16 11"
          stroke="#0F1115"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="shield-grad" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="0.5" stopColor="#6366F1" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Title & Version Branding */}
      <div className="flex items-center gap-2">
        <span className={`font-bold tracking-wider text-xs ${isDarkMode ? 'text-grad' : 'text-slate-900'}`}>SENTRYPULSE</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${isDarkMode ? 'bg-gradient-to-r from-sky-500/25 to-violet-500/25 text-white border-sky-400/40 animate-shimmer' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>
          v2.5 // CORE
        </span>
      </div>
    </div>
  );
}