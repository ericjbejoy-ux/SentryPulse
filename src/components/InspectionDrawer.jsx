import React, { useMemo } from 'react';
import { Activity, Server, X } from 'lucide-react';

/**
 * FR-2.2: sub-topology inspection drawer. Slides open when a canvas node
 * is clicked; shows granular sub-tier metrics plus the RCA diagnostic
 * for the selected node.
 */
export default function InspectionDrawer({ node, triageReport, failureReport, isDarkMode, onClose }) {
  const subTiers = useMemo(() => {
    if (!node) return [];
    // Deterministic per-node derivation so values stay stable across renders.
    const key = node.id ?? node.node_id ?? '?';
    const seed = [...key].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const cpuNum = parseFloat(node.cpu ?? node.cpu_pct) || 20;
    const latNum = parseFloat(node.latency ?? node.latency_ms) || 20;
    const stressed = node.status !== 'NOMINAL';
    return [
      { name: 'Primary Write Pool', metric: `${Math.min(99, Math.round(cpuNum + ((seed * 7) % 18)))}% saturated`, hot: stressed },
      { name: 'Read Replica', metric: `${Math.round(latNum / 4 + ((seed * 13) % 22))}ms lag`, hot: stressed && seed % 2 === 0 },
      { name: 'Worker Threadpool', metric: `${stressed ? 96 + (seed % 4) : 22 + (seed % 20)} / 128 threads`, hot: stressed },
    ];
  }, [node]);

  if (!node) return null;

  const isFailing =
    failureReport &&
    (failureReport.primary === node.label || failureReport.secondary === node.label);
  const rca =
    isFailing && triageReport?.groq_diagnosis?.root_cause
      ? triageReport.groq_diagnosis.root_cause
      : isFailing && triageReport
        ? triageReport.log_agent
        : 'No active incident on this node. Baseline telemetry within SLO bounds.';

  return (
    <div className={`fixed top-0 right-0 h-full w-80 z-[60] shadow-2xl border-l p-5 overflow-y-auto transition-colors ${
      isDarkMode ? 'bg-[#090d14] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Sub-topology inspector</p>
          <h3 className="text-sm font-bold flex items-center gap-2 mt-1">
            <Server className="w-4 h-4 text-emerald-500" /> {node.label}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{node.tier} • {node.ip} • {node.status}</p>
        </div>
        <button
          onClick={onClose}
          title="Close inspector"
          className={`p-1.5 rounded border cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
        {subTiers.map((tier) => (
          <div key={tier.name} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#04060a] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center text-[11px]">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{tier.name}</span>
              <span className={`font-bold ${tier.hot ? 'text-rose-400' : 'text-emerald-400'}`}>{tier.metric}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-3 rounded-lg border text-[11px] leading-relaxed ${
        isDarkMode ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-100' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
      }`}>
        <p className="font-bold flex items-center gap-1.5 mb-1">
          <Activity className="w-3.5 h-3.5" /> RCA Diagnostic
        </p>
        {rca}
      </div>
    </div>
  );
}
