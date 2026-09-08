import {
  ArrowUpRight, CheckCircle2, GitBranch, Layers, RefreshCw, Wrench,
} from 'lucide-react';

/** FR-6: Pareto decision matrix + one-click remediation trigger.
 * Activates on sim incidents (ATTACKED/HEALING) OR live victim incidents
 * (liveActive) — the latter needs no simulation run first. */
export default function ParetoMatrix({
  simState, selectedOption, onSelectOption, dynamicFailureReport,
  triageReport, isDarkMode, onExecuteCure,
  liveActive = false, incidentTargets = [], forecast = null,
}) {
  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';
  const active = isAttacked || isHealing || liveActive;
  const primary = dynamicFailureReport?.primary || incidentTargets[0];
  const secondary = dynamicFailureReport?.secondary || incidentTargets[1];

  return (
    <div className={`lg:col-span-2 border rounded-xl p-6 flex flex-col justify-between shadow-xl transition-colors duration-300 ${
      isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div>
        <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <Layers className="w-4 h-4 text-amber-500" /> Dynamic Pareto Decision Matrix (NSGA-II Solver)
          </h3>
          <span className={`text-[10px] px-2.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {dynamicFailureReport
              ? `Targets: ${dynamicFailureReport.primary}, ${dynamicFailureReport.secondary}`
              : liveActive ? `Live incident: ${incidentTargets.join(', ')}` : 'Standby'}
          </span>
        </div>

        {forecast && (
          <div className={`mt-3 p-4 rounded-lg border text-[11px] leading-relaxed ${
            isDarkMode ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-100' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
          }`}>
            <span className="font-bold">🔮 Forecast ({forecast.at}):</span>{' '}
            resilience <strong>{forecast.resilience_score}%</strong> over{' '}
            {forecast.permutations_executed.toLocaleString()} permutations in{' '}
            {forecast.duration_seconds}s → {forecast.vector_drift}. Twin untouched.
          </div>
        )}

        {active ? (
          <div className="space-y-3 mt-3">
            {triageReport?.groq_diagnosis?.root_cause && (
              <div className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                isDarkMode ? 'bg-purple-950/30 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}>
                <span className="font-bold">🧠 Groq-live diagnosis:</span> {triageReport.groq_diagnosis.root_cause}
                {triageReport.groq_diagnosis.recommended_action && (
                  <span> <span className="font-bold">→</span> {triageReport.groq_diagnosis.recommended_action}</span>
                )}
              </div>
            )}
            {triageReport && !triageReport.groq_live && (
              <div className={`px-3 py-1.5 rounded-lg border text-[10px] ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                🤖 Rule-based triage (Groq unreachable — set GROQ_API_KEY on the backend for live reasoning).
              </div>
            )}
            <div
              onClick={() => onSelectOption('A')}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedOption === 'A'
                  ? 'bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : isDarkMode ? 'bg-[#04060a] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> OPTION A [Dynamic Micro-Isolate]</span>
                <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50 font-bold">MTTR: 0.9s | Cost: Low</span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Isolate threadpool on <strong className="text-emerald-400">{primary}</strong> and spillover ingress to Kafka buffer queue.</p>
            </div>

            <div
              onClick={() => onSelectOption('B')}
              className={`p-4 rounded-lg border cursor-pointer transition-all opacity-80 ${
                selectedOption === 'B'
                  ? 'bg-emerald-950/20 border-emerald-500/80'
                  : isDarkMode ? 'bg-[#04060a] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>OPTION B [Full Region Rebalance]</span>
                <span className="text-[10px] bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/50 font-bold">MTTR: 11.4s | Cost: High</span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Reroute traffic around <strong className="text-amber-400">{secondary}</strong> via hot-standby Redis cluster.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
          <div className={`h-44 flex flex-col items-center justify-center border border-dashed rounded-lg text-center p-6 ${
            isDarkMode ? 'border-slate-800 bg-[#04060a]/50 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}>
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <GitBranch className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <p className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>100k Monte Carlo Simulation Standby</p>
            <p className="text-[11px] text-slate-500">Run the stress test to aggregate Monte Carlo permutations and output dynamic failure statistics.</p>
          </div>
          </div>
        )}
      </div>

      {(isAttacked || liveActive) && (
        <div className={`mt-5 pt-4 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Selected Strategy: <strong className="text-emerald-500">Option {selectedOption}</strong>{liveActive && !isAttacked ? ' • heals all failing live nodes' : ''}</span>
          <button
            onClick={onExecuteCure}
            disabled={isHealing}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50"
          >
            {isHealing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            {isHealing ? 'APPLYING REMEDIATION...' : `EXECUTE CURE ON [${liveActive && !isAttacked ? incidentTargets.join(', ') : primary}]`} <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
