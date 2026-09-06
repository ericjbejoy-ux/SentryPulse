import React from 'react';
import { Terminal, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface SwarmFeedProps {
  isAttacked?: boolean;
  isResolved?: boolean;
}

export const SwarmFeed = ({ isAttacked, isResolved }: SwarmFeedProps) => {
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
    <div className="h-full flex flex-col bg-[#14171D] rounded-sm border border-[#282D37] p-3 font-mono">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#282D37]">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00B36B]" /> Swarm Triage Feed
        </h3>
        <span className={`text-[9px] border px-1.5 py-0.5 font-bold ${
          isAttacked ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/40' : 'bg-[#00B36B]/10 text-[#00B36B] border-[#00B36B]/40'
        }`}>
          3 AGENTS ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {agents.map((agent, i) => (
          <div key={i} className="bg-[#0B0D10] border border-[#282D37] p-2.5 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">{agent.name}</span>
                <span className="text-[10px] text-slate-500">({agent.role})</span>
              </div>
              <span className="text-[10px] text-slate-400">{agent.progress}%</span>
            </div>

            <div className="w-full bg-[#14171D] h-1 mb-2">
              <div
                className={`h-full transition-all duration-500 ${agent.status === 'alert' ? 'bg-[#FF5500]' : 'bg-[#00B36B]'}`}
                style={{ width: `${agent.progress}%` }}
              />
            </div>

            <p className="text-slate-400 text-[10px] leading-tight flex items-start gap-1.5">
              {agent.status === 'alert' ? (
                <AlertCircle className="w-3 h-3 text-[#FF5500] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-3 h-3 text-[#00B36B] shrink-0 mt-0.5" />
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