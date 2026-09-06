import React from 'react';
import { Terminal, AlertCircle, CheckCircle } from 'lucide-react';

interface SwarmFeedProps {
  isAttacked?: boolean;
  isResolved?: boolean;
  isLight?: boolean;
}

export const SwarmFeed = ({ isAttacked, isResolved, isLight }: SwarmFeedProps) => {
  const mutedGreen = isLight ? '#047857' : '#10B981';

  const getAgents = () => {
    if (isResolved) {
      return [
        { name: 'LogAgent', role: 'Triage Engine', progress: 100, text: 'Payload pattern stored in vector DB for zero-day cataloging.', status: 'complete' },
        { name: 'PatchAgent', role: 'Mitigation Swarm', progress: 100, text: 'Traffic rerouted. DB failover instance verified healthy.', status: 'complete' },
        { name: 'SentryGuard', role: 'System Sentinel', progress: 100, text: 'Topology nominal. Latency restored to optimal base levels.', status: 'complete' },
      ];
    }
    if (isAttacked) {
      return [
        { name: 'LogAgent', role: 'Log Triage', progress: 100, text: 'SYN flood detected from rogue IP pool (sub-cluster 04).', status: 'alert' },
        { name: 'Predictor', role: 'Attack Engine', progress: 92, text: 'High risk of cascading failure on db-primary (p=0.94).', status: 'alert' },
        { name: 'PatchAgent', role: 'Mitigation Swarm', progress: 75, text: 'Pareto frontier updated: 4 failover pathways generated.', status: 'working' },
      ];
    }
    return [
      { name: 'LogAgent', role: 'Log Triage', progress: 100, text: 'Monitoring telemetry streams. Zero anomalies detected.', status: 'complete' },
      { name: 'Predictor', role: 'Attack Engine', progress: 100, text: 'System load nominal. Risk probability floor at 0.02.', status: 'complete' },
      { name: 'PatchAgent', role: 'Mitigation Swarm', progress: 100, text: 'Idle. Standing by for chaos triggers or traffic spikes.', status: 'complete' },
    ];
  };

  const agents = getAgents();

  return (
    <div className={`h-full flex flex-col rounded-sm border p-3 font-mono transition-colors ${
      isLight ? 'bg-white border-slate-300' : 'bg-[#14171D] border-[#282D37]'
    }`}>
      <div className={`flex items-center justify-between pb-2 mb-3 border-b ${isLight ? 'border-slate-200' : 'border-[#282D37]'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
          <Terminal className="w-3.5 h-3.5" style={{ color: mutedGreen }} /> Swarm Triage Feed
        </h3>
        <span className={`text-[9px] border px-1.5 py-0.5 font-bold ${
          isAttacked ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/40' :
          isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
        }`}>
          3 AGENTS ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {agents.map((agent, i) => (
          <div key={i} className={`border p-3 text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0B0D10] border-[#282D37]'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{agent.name}</span>
                <span className="text-[10px] text-slate-500">({agent.role})</span>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{agent.progress}%</span>
            </div>

            <div className={`w-full h-1.5 mb-2 ${isLight ? 'bg-slate-200' : 'bg-[#14171D]'}`}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${agent.progress}%`,
                  backgroundColor: agent.status === 'alert' ? '#FF5500' : mutedGreen
                }}
              />
            </div>

            <p className={`text-[10px] leading-relaxed flex items-start gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {agent.status === 'alert' ? (
                <AlertCircle className="w-3 h-3 text-[#FF5500] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: mutedGreen }} />
              )}
              {agent.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwarmFeed;