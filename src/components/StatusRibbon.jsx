import { Activity, AlertTriangle, CpuIcon, ShieldCheck } from 'lucide-react';

export default function StatusRibbon({
  simState, isDarkMode, simulationCount, totalAnomaliesDetected, topVector, nodeCount,
}) {
  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';
  const card = `border rounded-lg p-3.5 flex justify-between items-center shadow-sm transition-colors duration-300 ${
    isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
  }`;
  const label = `text-[10px] block uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className={card}>
        <div>
          <span className={label}>Topology State</span>
          <span className={`text-xs font-bold ${isHealing ? 'text-amber-400' : isAttacked ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isHealing ? 'PATCHING & HEALING...' : isAttacked ? 'DYNAMIC CASCADE FAILURE' : '100% NOMINAL'}
          </span>
        </div>
        <Activity className={`w-4 h-4 ${isHealing ? 'text-amber-400' : isAttacked ? 'text-rose-500' : 'text-emerald-500'}`} />
      </div>

      <div className={card}>
        <div>
          <span className={label}>100k Simulations Scan ({simulationCount} runs)</span>
          <span className="text-xs font-bold text-rose-400">{totalAnomaliesDetected.toLocaleString()} Anomalies Flagged</span>
        </div>
        <AlertTriangle className="w-4 h-4 text-rose-400" />
      </div>

      <div className={card}>
        <div>
          <span className={label}>Top Failure Vector</span>
          <span className="text-xs font-bold text-amber-400">{topVector.name} ({topVector.rate})</span>
        </div>
        <CpuIcon className="w-4 h-4 text-amber-400" />
      </div>

      <div className={card}>
        <div>
          <span className={label}>Active Diagram Nodes</span>
          <span className="text-xs font-bold text-emerald-500">{nodeCount} Microservices</span>
        </div>
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
      </div>
    </div>
  );
}
