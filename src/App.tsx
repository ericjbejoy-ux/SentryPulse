import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomServerNode } from './canvas/CustomServerNode';
import SwarmFeed from './components/SwarmFeed';
import ParetoChart from './components/ParetoChart';
import { Shield, Activity, Cpu, Zap, RotateCcw, Sun, Moon, Sliders, Terminal } from 'lucide-react';

export default function App() {
  const [isAttacked, setIsAttacked] = useState(false);
  const [isMitigating, setIsMitigating] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [activeTab, setActiveTab] = useState<'pareto' | 'feed'>('pareto');
  const [rps, setRps] = useState(12800);

  const mutedGreen = isLight ? '#047857' : '#10B981';

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLight]);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 400) - 200;
      setRps((prev) => Math.max(8000, prev + delta));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nodes: Node[] = useMemo(() => {
    const baseNodes = isResolved
      ? [
          { id: '1', type: 'server', position: { x: 220, y: 30 }, data: { label: 'app-server-01', status: 'NOMINAL', cpu: '32%', latency: '2ms', load: '0.40', packets: '450' } },
          { id: '2', type: 'server', position: { x: 40, y: 180 }, data: { label: 'db-primary (FAILOVER)', status: 'NOMINAL', cpu: '28%', latency: '8ms', load: '0.52', packets: '1.1k', alertMessage: 'SWARM PATCH APPLIED' } },
          { id: '3', type: 'server', position: { x: 400, y: 180 }, data: { label: 'edge-gateway', status: 'NOMINAL', cpu: '41%', latency: '12ms', load: '1.02', packets: '2.1k' } },
          { id: '4', type: 'server', position: { x: 220, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '14%', latency: '1ms', load: '0.12', packets: '850' } },
        ]
      : isAttacked
      ? [
          { id: '1', type: 'server', position: { x: 220, y: 30 }, data: { label: 'app-server-01', status: 'WARNING', cpu: '88%', latency: '42ms', load: '4.10', packets: '8.5k' } },
          { id: '2', type: 'server', position: { x: 40, y: 180 }, data: { label: 'db-primary', status: 'CRITICAL', cpu: '99%', latency: '340ms', load: '14.2', packets: '42.1k', alertMessage: 'SYN FLOOD / WRITE SATURATION' } },
          { id: '3', type: 'server', position: { x: 400, y: 180 }, data: { label: 'edge-gateway', status: 'WARNING', cpu: '79%', latency: '88ms', load: '3.40', packets: '18.2k' } },
          { id: '4', type: 'server', position: { x: 220, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '22%', latency: '2ms', load: '0.30', packets: '1.2k' } },
        ]
      : [
          { id: '1', type: 'server', position: { x: 220, y: 30 }, data: { label: 'app-server-01', status: 'NOMINAL', cpu: '24%', latency: '3ms', load: '0.30', packets: '250' } },
          { id: '2', type: 'server', position: { x: 40, y: 180 }, data: { label: 'db-primary', status: 'NOMINAL', cpu: '31%', latency: '6ms', load: '0.42', packets: '1.2k' } },
          { id: '3', type: 'server', position: { x: 400, y: 180 }, data: { label: 'edge-gateway', status: 'NOMINAL', cpu: '38%', latency: '14ms', load: '0.85', packets: '1.8k' } },
          { id: '4', type: 'server', position: { x: 220, y: 330 }, data: { label: 'cache-cluster', status: 'NOMINAL', cpu: '12%', latency: '1ms', load: '0.10', packets: '800' } },
        ];

    return baseNodes.map((node) => ({
      ...node,
      data: { ...node.data, isLight },
    }));
  }, [isAttacked, isResolved, isLight]);

  const edges: Edge[] = useMemo(() => {
    const strokeColor = isResolved
      ? mutedGreen
      : isAttacked
      ? '#FF5500'
      : isLight ? '#94A3B8' : '#282D37';

    return [
      { id: 'e1-2', source: '1', target: '2', animated: isAttacked || isResolved, style: { stroke: strokeColor, strokeWidth: isAttacked ? 2.5 : 1.5 } },
      { id: 'e1-3', source: '1', target: '3', animated: isAttacked, style: { stroke: isAttacked ? '#E6A100' : isLight ? '#CBD5E1' : '#282D37' } },
      { id: 'e2-4', source: '2', target: '4', style: { stroke: isLight ? '#CBD5E1' : '#282D37' } },
      { id: 'e3-4', source: '3', target: '4', style: { stroke: isLight ? '#CBD5E1' : '#282D37' } },
    ];
  }, [isAttacked, isResolved, isLight, mutedGreen]);

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
    <div className={`h-screen w-screen font-mono flex flex-col overflow-hidden transition-colors ${
      isLight ? 'bg-[#E6E8EC] text-slate-900' : 'bg-[#0B0D10] text-slate-100'
    }`}>
      {/* Top Header */}
      <header className={`h-11 border-b px-4 flex items-center justify-between text-xs shrink-0 transition-colors ${
        isLight ? 'bg-white border-slate-300' : 'bg-[#14171D] border-[#282D37]'
      }`}>
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4" style={{ color: mutedGreen }} />
          <span className={`font-bold tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>SENTRYPULSE</span>
          <span className="text-slate-500">// WAR ROOM</span>
        </div>

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
              className={`flex items-center gap-1.5 px-2.5 py-1 font-bold text-[10px] uppercase cursor-pointer transition-all border ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' : 'bg-[#282D37] border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <RotateCcw className="w-3 h-3" /> Reset Twin
            </button>
          )}

          <button
            onClick={() => setIsLight(!isLight)}
            className={`p-1.5 rounded-sm border cursor-pointer transition-colors ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-[#0B0D10] border-[#282D37] text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        <div className={`flex items-center gap-6 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" style={{ color: mutedGreen }} /> RPS: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{rps.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" style={{ color: mutedGreen }} /> STATE:{' '}
            <strong className={isAttacked ? 'text-[#FF5500]' : ''} style={{ color: !isAttacked ? mutedGreen : undefined }}>
              {isAttacked ? '● INCIDENT ACTIVE' : '● SYNCHRONIZED'}
            </strong>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden">
        
        {/* Topology View (8 Cols) */}
        <div className={`col-span-8 h-full border relative overflow-hidden flex flex-col transition-colors ${
          isLight ? 'bg-white border-slate-300' : 'bg-[#14171D] border-[#282D37]'
        }`}>
          <div className={`h-8 border-b px-3 flex items-center justify-between text-xs transition-colors z-20 ${
            isLight ? 'bg-slate-100/90 border-slate-200 text-slate-600' : 'bg-[#0B0D10]/90 border-[#282D37] text-slate-400'
          }`}>
            <span className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              Unified Health Topology
              <span className={`text-[9px] border px-1 py-0.2 font-bold ${
                isAttacked ? 'bg-[#FF5500]/20 text-[#FF5500] border-[#FF5500]/40' : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
              }`}>
                {isAttacked ? 'ALERT 0.2s' : 'LIVE 2.4s'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500">47 ENTITIES</span>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* Background Radar Animation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 z-0">
              <div
                className="w-[550px] h-[550px] rounded-full border border-dashed radar-sweep"
                style={{
                  borderColor: isAttacked ? '#FF5500' : mutedGreen,
                  background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, ${
                    isAttacked ? 'rgba(255, 85, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)'
                  } 360deg)`
                }}
              />
            </div>

            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView className="z-10 relative">
              <Background color={isLight ? '#CBD5E1' : '#1C212B'} gap={20} size={1} />
              <Controls className={`!rounded-none ${
                isLight ? '!bg-white !border-slate-300 !text-slate-800 fill-slate-800' : '!bg-[#14171D] !border-[#282D37] !text-slate-200 fill-slate-200'
              }`} />
            </ReactFlow>
          </div>
        </div>

        {/* Dynamic Tabbed Panel (4 Cols) */}
        <div className="col-span-4 h-full flex flex-col overflow-hidden">
          
          {/* Tab Selector Buttons */}
          <div className={`flex border-b mb-2 text-xs font-bold transition-colors ${
            isLight ? 'border-slate-300 bg-white' : 'border-[#282D37] bg-[#14171D]'
          }`}>
            <button
              onClick={() => setActiveTab('pareto')}
              className={`flex-1 py-2 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'pareto'
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                  : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Remediation Pareto
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                  : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Swarm Triage Feed
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'pareto' ? (
              <ParetoChart isAttacked={isAttacked} isMitigating={isMitigating} isLight={isLight} onApply={handleApplyMitigation} />
            ) : (
              <SwarmFeed isAttacked={isAttacked} isResolved={isResolved} isLight={isLight} />
            )}
          </div>

        </div>

      </div>
    </div>
  );
}