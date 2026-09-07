import React from 'react';
import { Server, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function TopologyCanvas({ nodes, onSelectNode, isAttacked }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">System Topology Architecture</h2>
          <p className="text-xs text-slate-400">Real-time microservice state sync via OpenTelemetry collectors</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> System Nominal
          </span>
          {isAttacked && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-rose-950/50 text-rose-400 border border-rose-800/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> Anomaly Detected
            </span>
          )}
        </div>
      </div>

      {/* Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const isCritical = node.status === 'CRITICAL' || node.status === 'WARNING';
          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`p-4 rounded-lg border transition-all cursor-pointer bg-slate-950/40 ${
                isCritical 
                  ? 'border-rose-500/50 bg-rose-950/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className={`w-4 h-4 ${isCritical ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium text-slate-200">{node.label}</span>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'
                }`}>
                  {node.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex justify-between"><span>CPU Load:</span> <span className="text-slate-200">{node.cpu}</span></div>
                <div className="flex justify-between"><span>Latency:</span> <span className={isCritical ? 'text-rose-400 font-semibold' : 'text-slate-200'}>{node.latency}</span></div>
                <div className="flex justify-between"><span>Throughput:</span> <span className="text-slate-200">{node.packets}</span></div>
              </div>

              {node.alertMessage && (
                <div className="mt-3 pt-2 border-t border-rose-500/20 text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{node.alertMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}