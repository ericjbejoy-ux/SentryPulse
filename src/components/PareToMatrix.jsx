import React from 'react';
import { Layers, GitBranch, CheckCircle2, Wrench, RefreshCw, ArrowUpRight } from 'lucide-react';

export default function PareToMatrix({
  isDarkMode,
  isAttacked,
  isHealing,
  selectedOption,
  onSelectOption,
  dynamicFailureReport,
  onExecuteCure
}) {
  const optionCard = (key, title, cost, desc, accent) => (
    <div
      onClick={() => onSelectOption(key)}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selectedOption === key
          ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_-6px_rgba(52,211,153,0.7)]'
          : isDarkMode ? 'border-[#22304d] bg-[#070b17] hover:border-emerald-400/40' : 'border-slate-300 bg-slate-50'
      } ${accent === 'primary' ? '' : 'opacity-85'}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-extrabold text-sm ${accent === 'primary' ? 'text-emerald-400' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {accent === 'primary' && <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
          {title}
        </span>
        <span className="text-xs text-slate-400 font-mono">{cost}</span>
      </div>
      <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{desc}</p>
    </div>
  );

  return (
    <div className={`lg:col-span-2 border rounded-lg p-5 flex flex-col justify-between shadow-sm transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
    }`}>
      <div>
        <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-300'}`}>
          <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2.5 ${isDarkMode ? 'text-grad-warm' : 'text-slate-900'}`}>
            <Layers className={`w-5 h-5 ${isDarkMode ? 'text-amber-400 drop-amber' : 'text-amber-400'}`} /> NSGA-II Pareto Mitigation Matrix
          </h3>
          <span className={`text-xs px-3 py-1 rounded font-mono font-bold ${isDarkMode ? 'bg-[#0a0f1f] text-cyan-300 border border-[#2a3a5c]' : 'bg-slate-200 text-slate-800 border border-slate-300'}`}>
            {dynamicFailureReport ? `Target: ${dynamicFailureReport.primary}` : 'Standby'}
          </span>
        </div>

        {isAttacked || isHealing ? (
          <div className="space-y-3">
            {optionCard(
              'A',
              'OPTION A [Micro-Isolation & Spillover]',
              'MTTR: 0.9s // Low Cost',
              <>Isolate threadpool on <strong className={isDarkMode ? 'text-white font-bold' : 'text-slate-950 font-bold'}>{dynamicFailureReport?.primary}</strong> and route ingress queues to secondary Kafka broker.</>,
              'primary'
            )}
            {optionCard(
              'B',
              'OPTION B [Full Region Rebalance]',
              'MTTR: 11.4s // High Cost',
              <>Drain active traffic around <strong className={isDarkMode ? 'text-white font-bold' : 'text-slate-950 font-bold'}>{dynamicFailureReport?.secondary}</strong> via standby Redis node.</>,
              'secondary'
            )}
          </div>
        ) : (
          <div className={`h-40 flex flex-col items-center justify-center border border-dashed rounded-lg text-center p-5 ${
            isDarkMode ? 'border-[#22304d] bg-[#070b17]/60 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}>
            <GitBranch className="w-6 h-6 text-slate-400 mb-2.5" />
            <p className={`text-sm font-extrabold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Simulation Standby</p>
            <p className="text-xs">Execute a simulation run to generate optimal recovery parameters.</p>
          </div>
        )}
      </div>

      {isAttacked && (
        <div className={`mt-4 pt-3.5 border-t flex justify-between items-center ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-300'}`}>
          <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Selected Strategy: <strong className="text-emerald-400 font-extrabold">Option {selectedOption}</strong>
          </span>
          <button
            onClick={onExecuteCure}
            disabled={isHealing}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold flex items-center gap-2 cursor-pointer text-xs md:text-sm transition-all hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 shadow-[0_0_22px_-4px_rgba(52,211,153,0.8)] hover:shadow-[0_0_30px_-4px_rgba(52,211,153,1)]"
          >
            {isHealing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            {isHealing ? 'Remediating...' : 'Execute Mitigation'} <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}