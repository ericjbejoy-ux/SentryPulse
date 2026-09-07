import { Sun, Moon, RefreshCw, Sparkles } from 'lucide-react';

export default function HeaderToolBar({
  isDarkMode, onToggleTheme, simState, isSimulating,
  backendStatus, groqLive, apiBase, onRunSimulation, onReset,
}) {
  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';

  return (
    <header className={`border-b px-6 py-3.5 flex justify-between items-center sticky top-0 z-50 shadow-md backdrop-blur transition-colors duration-300 ${
      isDarkMode ? 'border-slate-800 bg-[#090d14]/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-800'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${isHealing ? 'bg-amber-500 animate-spin' : isAttacked ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'} shadow-[0_0_12px_#10b981]`}></div>
          <span className="font-bold text-sm tracking-widest">SENTRYPULSE</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded border ${
            isDarkMode ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>v2.5.0-100K-STOCHASTIC</span>
          <span title={`Backend: ${apiBase}`} className={`text-[10px] px-2.5 py-0.5 rounded border font-bold ${
            backendStatus === 'live'
              ? (isDarkMode ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300')
              : backendStatus === 'offline'
              ? (isDarkMode ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-300')
              : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')
          }`}>
            {backendStatus === 'live' ? `● BACKEND LIVE${groqLive ? ' + GROQ' : ''}` : backendStatus === 'offline' ? '○ LOCAL SIM MODE' : '… CONNECTING'}
          </span>
        </div>
        <div className={`h-4 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        <span className={`text-[11px] hidden md:inline ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Autonomous Infrastructure Resilience & 100k Monte Carlo Stress Engine</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="hidden sm:inline text-[10px]">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating || isHealing}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
        >
          {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
          {isSimulating ? 'SIMULATING 100K...' : 'RUN 100K MONTE CARLO TEST'}
        </button>

        <button
          onClick={onReset}
          className={`px-3.5 py-2.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer border ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Reset
        </button>
      </div>
    </header>
  );
}
