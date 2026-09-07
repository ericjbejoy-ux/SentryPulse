import React from 'react';
import {
  RefreshCw, Sparkles, Sun, Moon,
  Network, AlertTriangle, BarChart3, Timer
} from 'lucide-react';
import LogoHeader from './LogoHeader';

export default function HeaderToolBar({
  isDarkMode, onToggleTheme,
  currentView, onViewChange,
  now, uptime,
  isHealing, isAttacked, isSimulating,
  onRunSimulation, onReset, showSimControls
}) {
  const viewBtn = (key, label, Icon) => (
    <button
      onClick={() => onViewChange(key)}
      className={`px-3.5 py-1.5 rounded font-bold flex items-center gap-2 transition-all cursor-pointer text-xs md:text-sm ${
        currentView === key
          ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 shadow-[0_0_18px_-4px_rgba(34,211,238,0.7)]'
          : isDarkMode ? 'text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'text-slate-700 hover:text-slate-950'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <header className={`border-b px-5 py-3.5 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-50 backdrop-blur-xl transition-colors duration-200 ${
      isDarkMode ? 'border-[#1f2c4d]/70 bg-[#070b19]/88 text-slate-100 shadow-[0_8px_40px_-20px_rgba(4,6,15,0.9)]' : 'border-slate-200 bg-white/95 text-slate-900'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isHealing ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_4px_rgba(251,191,36,0.5)]' : isAttacked ? 'bg-rose-500 animate-ping shadow-[0_0_10px_4px_rgba(251,113,133,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_4px_rgba(52,211,153,0.45)]'}`}></div>
          <LogoHeader isDarkMode={isDarkMode} />
        </div>
        <div className={`h-5 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
        <span className="text-xs md:text-sm tracking-tight font-medium text-slate-400">
          Infrastructure Resilience & Monte Carlo Verification
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className={`flex items-center gap-1.5 p-1 rounded-md border ${
          isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-slate-200 border-slate-300'
        }`}>
          {viewBtn('warroom', 'War Room', Network)}
          {viewBtn('triage', 'Incident Triage', AlertTriangle)}
          {viewBtn('analytics', 'Analytics', BarChart3)}
        </div>

        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-md border transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d] text-slate-200 hover:border-cyan-400/50 hover:shadow-[0_0_14px_-4px_rgba(34,211,238,0.6)]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
          }`}
          title="Toggle Theme (T)"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Live Clock + Session Uptime */}
        <div className={`hidden xl:flex items-center gap-4 pl-2 border-l text-xs font-mono ${isDarkMode ? 'border-[#22304d]' : 'border-slate-300'}`}>
          <div>
            <div className={`font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>UTC</div>
            <div className={`font-extrabold tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {now.toUTCString().slice(17, 25)}
            </div>
          </div>
          <div>
            <div className={`font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Timer className="w-3 h-3" /> Uptime
            </div>
            <div className={`font-extrabold tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{uptime}</div>
          </div>
        </div>

        {showSimControls && (
          <>
            <button
              onClick={onRunSimulation}
              disabled={isSimulating || isHealing}
              className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all cursor-pointer text-xs md:text-sm disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 shadow-[0_0_18px_-6px_rgba(52,211,153,0.7)] hover:bg-emerald-500/25 hover:shadow-[0_0_26px_-6px_rgba(52,211,153,0.95)]'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-400 hover:bg-emerald-200'
              }`}
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isSimulating ? 'Running 100k Monte Carlo...' : 'Run 100k Simulation'}
            </button>

            <button
              onClick={onReset}
              className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all cursor-pointer border text-xs md:text-sm ${
                isDarkMode ? 'bg-[#0a0f1f] border-[#2a3a5c] text-slate-200 hover:border-rose-400/40 hover:text-rose-200' : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-slate-400" /> Reset
            </button>
          </>
        )}
      </div>
    </header>
  );
}