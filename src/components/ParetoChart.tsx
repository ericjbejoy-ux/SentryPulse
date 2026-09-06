import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sliders, RefreshCw } from 'lucide-react';

interface ParetoChartProps {
  isAttacked?: boolean;
  isMitigating?: boolean;
  onApply?: () => void;
}

const normalData = [
  { id: 'Optimization 1', disruption: 1, risk: 2, cost: '$0.01' },
  { id: 'Optimization 2', disruption: 3, risk: 1, cost: '$0.04' },
];

const attackData = [
  { id: 'Failover to Secondary DB', disruption: 2, risk: 8, cost: '$0.02' },
  { id: 'Rate Limit Edge Gateway', disruption: 4, risk: 5, cost: '$0.08' },
  { id: 'Isolate Cluster Subnet', disruption: 7, risk: 3, cost: '$0.15' },
  { id: 'Full Traffic Drop', disruption: 9, risk: 1, cost: '$0.40' },
];

export const ParetoChart = ({ isAttacked, isMitigating, onApply }: ParetoChartProps) => {
  const currentData = isAttacked ? attackData : normalData;

  return (
    <div className="h-full flex flex-col bg-[#14171D] rounded-sm border border-[#282D37] p-3 font-mono">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282D37]">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#00B36B]" /> Remediation Pareto
        </h3>
        <span className="text-[9px] text-[#00B36B] bg-[#00B36B]/10 border border-[#00B36B]/40 px-1.5 py-0.5 font-bold">
          {isAttacked ? '4 CANDIDATES' : 'OPTIMIZED'}
        </span>
      </div>

      <div className="flex-1 w-full min-h-[140px] bg-[#0B0D10] border border-[#282D37] p-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
            <XAxis type="number" dataKey="disruption" name="Disruption" stroke="#8B949E" tick={{ fontSize: 9 }} />
            <YAxis type="number" dataKey="risk" name="Residual Risk" stroke="#8B949E" tick={{ fontSize: 9 }} />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-[#14171D] border border-[#282D37] p-2 text-[10px] text-slate-200 font-mono">
                    <p className="font-bold text-[#FF5500]">{data.id}</p>
                    <p>Risk Score: {data.risk}/10</p>
                    <p>Disruption: {data.disruption}/10</p>
                    <p>Cost: {data.cost}</p>
                  </div>
                );
              }}
            />
            <Scatter data={currentData} fill="#00B36B">
              {currentData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={isAttacked && index === 0 ? '#FF5500' : '#00B36B'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <button
        onClick={onApply}
        disabled={!isAttacked || isMitigating}
        className={`mt-2 w-full py-2 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 ${
          isMitigating
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : isAttacked
            ? 'bg-[#FF5500] hover:bg-[#FF5500]/80 text-[#0B0D10] cursor-pointer'
            : 'bg-[#282D37] text-slate-500 cursor-not-allowed'
        }`}
      >
        {isMitigating ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deploying Swarm Fix...
          </>
        ) : (
          'Apply Selected Mitigation'
        )}
      </button>
    </div>
  );
};

export default ParetoChart;