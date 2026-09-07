import React from 'react';
import {
  X, Server, Cpu, Clock, Link2, AlertTriangle, Wrench, Activity, Network
} from 'lucide-react';

const statusMeta = (status, dark) => {
  switch (status) {
    case 'PATCHING':
      return dark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-300';
    case 'CRITICAL':
      return dark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-700 border-rose-300';
    case 'WARNING':
      return dark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-300';
    default:
      return dark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

export default function InspectionDrawer({ node, onClose, nodes, isDarkMode }) {
  if (!node) return null;

  const neighbors = nodes.filter(n => n.id !== node.id);
  const isCritical = node.status === 'CRITICAL' || node.status === 'WARNING';
  const isPatching = node.status === 'PATCHING';

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-auto animate-fadeIn"
        onClick={onClose}
      ></div>

      <aside className={`absolute top-0 right-0 bottom-0 w-full max-w-sm pointer-events-auto border-l border-t-2 border-t-cyan-400/40 shadow-2xl flex flex-col font-mono transition-colors ${
        isDarkMode ? 'bg-[#0a0f1f]/97 border-[#1f2c4d] text-slate-100 backdrop-blur-xl' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Drawer Header */}
        <div className={`px-5 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <Server className={`w-5 h-5 ${isCritical ? 'text-rose-400' : isPatching ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Node Inspection</h3>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{node.id} / {node.tier}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded border transition-all cursor-pointer ${
              isDarkMode ? 'border-[#2a3a5c] text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200 hover:shadow-[0_0_10px_-4px_rgba(34,211,238,0.6)]' : 'border-slate-300 text-slate-500 hover:bg-slate-100'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Node Identity */}
        <div className={`px-5 py-4 border-b space-y-2.5 ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-sm font-extrabold truncate ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>{node.label}</span>
            <span className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded border ${statusMeta(node.status, isDarkMode)} ${node.status === 'CRITICAL' ? 'animate-pulse' : ''}`}>
              {node.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{node.ip}</span>
          </div>
        </div>

        {/* Live Telemetry */}
        <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-200'}`}>
          <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live Telemetry</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-[#070b17] border-[#22304d]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-1 text-slate-400">
                <Cpu className="w-3 h-3" /> CPU Load
              </div>
              <div className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{node.cpu}</div>
            </div>
            <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-[#070b17] border-[#22304d]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-1 text-slate-400">
                <Clock className="w-3 h-3" /> Latency
              </div>
              <div className={`text-sm font-extrabold ${isCritical ? 'text-rose-400' : isDarkMode ? 'text-white' : 'text-slate-950'}`}>{node.latency}</div>
            </div>
          </div>

          {node.alert && (
            <div className={`mt-3 p-3 rounded-lg border text-xs font-bold flex items-center gap-2 ${
              isPatching
                ? isDarkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
                : isDarkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
            }`}>
              {isPatching ? <Wrench className="w-4 h-4 shrink-0 animate-spin" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{node.alert}</span>
            </div>
          )}
        </div>

        {/* Topology Connections */}
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Link2 className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" /> Direct Connections ({neighbors.length})
          </h4>
          <div className="space-y-2">
            {neighbors.map(n => (
              <div key={n.id} className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-[#070b17] border-[#22304d]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Network className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="font-bold truncate">{n.label}</span>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta(n.status, isDarkMode)}`}>
                  {n.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-3.5 border-t ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-200'}`}>
          <p className={`text-[10px] text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Telemetry synced via OpenTelemetry collectors · {nodes.filter(n => n.status !== 'NOMINAL').length} degraded node(s)
          </p>
        </div>
      </aside>
    </div>
  );
}