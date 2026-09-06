import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomServerNode } from './canvas/CustomServerNode';
import { SwarmFeed } from './components/SwarmFeed';
import ParetoChart from './components/ParetoChart';
import { Shield, Activity, Cpu, Zap, RotateCcw } from 'lucide-react';

export default function App() {
  const [isAttacked, setIsAttacked] = useState(false);
  const [isMitigating, setIsMitigating] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [rps, setRps] = useState(12800);

  // Dynamic RPS Fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 400) - 200;
      setRps((prev) => Math.max(8000, prev + delta));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Nodes
  const nodes: Node[] = useMemo(() => {
    if (isResolved) {
      return [
        { id: '1', type: 'server', position: { x: 180, y: 30 }, data: { label: 'app-server-01', status: 'NOMINAL', cpu: '32%', latency: '2ms', load: '0.40', packets: '450' } },
        { id: '2', type: 'server', position: { x: 30, y: 180 }, data: { label: 'db-primary (FAILOVER)', status: 'NOMINAL', cpu: '28%', latency: '8ms', load: '0.52', packets: '1.1k', alertMessage: 'SWARM PATCH APPLIED' } },
        { id: '3', type: 'server', position: { x: 330, y: 180 }, data: { label: 'edge-gateway', status: 'NOMINAL', cpu: '41%', latency: '12ms', load: '1.02', packets: '2.1k' } },
        { id: '4', type: 'server', position: { x: 180, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '14%', latency: '1ms', load: '0.12', packets: '850' } },
      ];
    }
    if (isAttacked) {
      return [
        { id: '1', type: 'server', position: { x: 180, y: 30 }, data: { label: 'app-server-01', status: 'WARNING', cpu: '88%', latency: '42ms', load: '4.10', packets: '8.5k' } },
        { id: '2', type: 'server', position: { x: 30, y: 180 }, data: { label: 'db-primary', status: 'CRITICAL', cpu: '99%', latency: '340ms', load: '14.2', packets: '42.1k', alertMessage: 'SYN FLOOD / WRITE SATURATION' } },
        { id: '3', type: 'server', position: { x: 330, y: 180 }, data: { label: 'edge-gateway', status: 'WARNING', cpu: '79%', latency: '88ms', load: '3.40', packets: '18.2k' } },
        { id: '4', type: 'server', position: { x: 180, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '22%', latency: '2ms', load: '0.30', packets: '1.2k' } },
      ];
    }
    return [
      { id: '1', type: 'server', position: { x: 180, y: 30 }, data: { label: 'app-server-01', status: 'NOMINAL', cpu: '24%', latency: '3ms', load: '0.30', packets: '250' } },
      { id: '2', type: 'server', position: { x: 30, y: 180 }, data: { label: 'db-primary', status: 'NOMINAL', cpu: '31%', latency: '6ms', load: '0.42', packets: '1.2k' } },
      { id: '3', type: 'server', position: { x: 330, y: 180 }, data: { label: 'edge-gateway', status: 'NOMINAL', cpu: '38%', latency: '14ms', load: '0.85', packets: '1.8k' } },
      { id: '4', type: 'server', position: { x: 180, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '12%', latency: '1ms', load: '0.10', packets: '800' } },
    ];
  }, [isAttacked, isResolved]);

  // Dynamic Edges
  const edges: Edge[] = useMemo(() => {
    const strokeColor = isResolved ? '#00B36B' : isAttacked ? '#FF5500' : '#282D37';
    return [
      { id: 'e1-2', source: '1', target: '2', animated: isAttacked || isResolved, style: { stroke: strokeColor, strokeWidth: isAttacked ? 2.5 : 1.5 } },
      { id: 'e1-3', source: '1', target: '3', animated: isAttacked, style: { stroke: isAttacked ? '#E6A100' : '#282D37' } },
      { id: 'e2-4', source: '2', target: '4', style: { stroke: '#282D37' } },
      { id: 'e3-4', source: '3', target: '4', style: { stroke: '#282D37' } },
    ];
  }, [isAttacked, isResolved]);

  const handleApplyMitigation = () => {
    setIsMitigating(true);
    setTimeout(() => {
      setIsMitigating(false);
      setIsAttacked(false);
      setIsResolved(true);
    }, 1500);
  };

  const handleReset = () => {
    setIsAttacked(false);
    setIsMitigating(false);
    setIsResolved(false);
  };

  const nodeTypes = useMemo(() => ({ server: CustomServerNode }), []);

  return (
    <div className="h-screen w-screen bg-[#0B0D10] text-slate-100 font-mono flex flex-col overflow-hidden">
      <header className="h-11 border-b border-[#282D37] bg-[#14171D] px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#00B36B]" />
          <span className="font-bold tracking-wider text-slate-100">SENTRYPULSE</span>
          <span className="text-slate-500">// WAR ROOM</span>
        </div>

        {/* Chaos Engineering & Action Bar */}
        <div className="flex items-center gap-2">
          {!isAttacked && !isResolved && (
            <button
              onClick={() => setIsAttacked(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FF5500]/20 hover:bg-[#FF5500]/30 border border-[#FF5500]/50 text-[#FF5500] font-bold text-[10px] uppercase cursor-pointer transition-all"
            >
              <Zap className="w-3 h-3" /> Simulate Attack Scenario
            </button>
          )}

          {(isAttacked || isResolved) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#282D37] hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase cursor-pointer transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset Twin
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00B36B]" /> RPS: <strong className="text-slate-200">{rps.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#00B36B]" /> STATE:{' '}
            <strong className={isAttacked ? 'text-[#FF5500]' : 'text-[#00B36B]'}>
              {isAttacked ? '● INCIDENT ACTIVE' : '● SYNCHRONIZED'}
            </strong>
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden bg-[#0B0D10]">
        <div className="col-span-6 h-full border border-[#282D37] bg-[#14171D] relative overflow-hidden flex flex-col">
          <div className="h-8 border-b border-[#282D37] px-3 flex items-center justify-between text-xs text-slate-400 bg-[#0B0D10]">
            <span className="flex items-center gap-2 font-bold text-slate-200">
              Unified Health Topology
              <span className={`text-[9px] border px-1 py-0.2 font-bold ${
                isAttacked ? 'bg-[#FF5500]/20 text-[#FF5500] border-[#FF5500]/40' : 'bg-[#00B36B]/20 text-[#00B36B] border-[#00B36B]/40'
              }`}>
                {isAttacked ? 'ALERT 0.2s' : 'LIVE 2.4s'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500">47 ENTITIES</span>
          </div>
          <div className="flex-1 relative">
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
              <Background color="#1C212B" gap={20} size={1} />
              <Controls className="!bg-[#14171D] !border-[#282D37] !text-slate-200 fill-slate-200 !rounded-none" />
            </ReactFlow>
          </div>
        </div>

        <div className="col-span-3 h-full overflow-hidden">
          <ParetoChart isAttacked={isAttacked} isMitigating={isMitigating} onApply={handleApplyMitigation} />
        </div>

        <div className="col-span-3 h-full overflow-hidden">
          <SwarmFeed isAttacked={isAttacked} isResolved={isResolved} />
        </div>
      </div>
    </div>
  );
}