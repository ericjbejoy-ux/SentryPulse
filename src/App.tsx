import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomServerNode } from './canvas/CustomServerNode';
import SwarmFeed from './components/SwarmFeed';
import ParetoChart from './components/ParetoChart';
import { Shield, Activity, Cpu, Zap, RotateCcw, Sun, Moon, Sliders, Terminal, LayoutGrid, Radio } from 'lucide-react';

// API Endpoint for FastAPI NetworkX backend
const API_BASE_URL = 'http://localhost:8000/api/v1';

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAttacked, setIsAttacked] = useState(false);
  const [isMitigating, setIsMitigating] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [activeTab, setActiveTab] = useState<'pareto' | 'feed'>('pareto');
  const [rps, setRps] = useState(12800);

  const themeAccent = isLight ? '#047857' : '#10B981';

  // Toggle light mode CSS class
  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLight]);

  // Transform backend graph payload into React Flow Node/Edge objects
  const formatTopologyPayload = useCallback((rawNodes: any[], rawEdges: any[], lightMode: boolean) => {
    const formattedNodes: Node[] = rawNodes.map((node) => ({
      id: node.id,
      type: 'server',
      position: node.position || { x: 100, y: 100 },
      data: {
        label: node.label,
        status: node.status,
        cpu: node.cpu,
        latency: node.latency,
        load: node.load,
        packets: node.packets,
        alertMessage: node.alertMessage,
        isLight: lightMode,
      },
    }));

    const formattedEdges: Edge[] = rawEdges.map((edge) => {
      const isCritical = edge.status === 'CRITICAL';
      const isWarning = edge.status === 'WARNING';

      const strokeColor = isCritical
        ? '#EF4444'
        : isWarning
        ? '#F59E0B'
        : lightMode
        ? '#CBD5E1'
        : '#333A48';

      return {
        id: edge.id || `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: edge.animated || isCritical || isWarning,
        style: {
          stroke: strokeColor,
          strokeWidth: isCritical ? 2.5 : 1.5,
        },
      };
    });

    return { formattedNodes, formattedEdges };
  }, []);

  // Fetch Live Topology Graph from FastAPI
  const fetchLiveTopology = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/topology`);
      if (!response.ok) throw new Error('Backend response error');
      
      const data = await response.json();
      const { formattedNodes, formattedEdges } = formatTopologyPayload(data.nodes, data.edges, isLight);
      
      setNodes(formattedNodes);
      setEdges(formattedEdges);
      setIsConnectedToBackend(true);
      if (data.isAttacked !== undefined) setIsAttacked(data.isAttacked);
      if (data.isResolved !== undefined) setIsResolved(data.isResolved);
    } catch (err) {
      setIsConnectedToBackend(false);
      // Fallback: Dynamic internal graph state generator if backend is offline
      generateFallbackDynamicGraph();
    }
  }, [isLight, formatTopologyPayload]);

  // Fallback state generator so the UI works seamlessly with or without backend running
  const generateFallbackDynamicGraph = useCallback(() => {
    const rawNodes = isResolved
      ? [
          { id: '1', label: 'app-server-01', status: 'NOMINAL', cpu: '28%', latency: '3ms', load: '0.35', packets: '420', position: { x: 240, y: 40 } },
          { id: '2', label: 'db-primary (SEC)', status: 'NOMINAL', cpu: '24%', latency: '6ms', load: '0.41', packets: '980', alertMessage: 'FAILOVER COMPLETE', position: { x: 50, y: 200 } },
          { id: '3', label: 'edge-gateway', status: 'NOMINAL', cpu: '36%', latency: '11ms', load: '0.88', packets: '1.9k', position: { x: 430, y: 200 } },
          { id: '4', label: 'cache-cluster', status: 'NOMINAL', cpu: '12%', latency: '1ms', load: '0.10', packets: '720', position: { x: 240, y: 360 } },
        ]
      : isAttacked
      ? [
          { id: '1', label: 'app-server-01', status: 'WARNING', cpu: '84%', latency: '38ms', load: '3.80', packets: '7.8k', position: { x: 240, y: 40 } },
          { id: '2', label: 'db-primary', status: 'CRITICAL', cpu: '98%', latency: '310ms', load: '12.8', packets: '38.4k', alertMessage: 'SYN FLOOD DETECTED', position: { x: 50, y: 200 } },
          { id: '3', label: 'edge-gateway', status: 'WARNING', cpu: '76%', latency: '82ms', load: '3.10', packets: '16.5k', position: { x: 430, y: 200 } },
          { id: '4', label: 'cache-cluster', status: 'NOMINAL', cpu: '18%', latency: '2ms', load: '0.22', packets: '1.1k', position: { x: 240, y: 360 } },
        ]
      : [
          { id: '1', label: 'app-server-01', status: 'NOMINAL', cpu: '22%', latency: '2ms', load: '0.28', packets: '210', position: { x: 240, y: 40 } },
          { id: '2', label: 'db-primary', status: 'NOMINAL', cpu: '29%', latency: '5ms', load: '0.38', packets: '1.1k', position: { x: 50, y: 200 } },
          { id: '3', label: 'edge-gateway', status: 'NOMINAL', cpu: '34%', latency: '12ms', load: '0.78', packets: '1.6k', position: { x: 430, y: 200 } },
          { id: '4', label: 'cache-cluster', status: 'NOMINAL', cpu: '10%', latency: '1ms', load: '0.08', packets: '650', position: { x: 240, y: 360 } },
        ];

    const rawEdges = [
      { source: '1', target: '2', status: isAttacked ? 'CRITICAL' : 'NOMINAL', animated: isAttacked || isResolved },
      { source: '1', target: '3', status: isAttacked ? 'WARNING' : 'NOMINAL', animated: isAttacked },
      { source: '2', target: '4', status: 'NOMINAL' },
      { source: '3', target: '4', status: 'NOMINAL' },
    ];

    const { formattedNodes, formattedEdges } = formatTopologyPayload(rawNodes, rawEdges, isLight);
    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [isAttacked, isResolved, isLight, formatTopologyPayload]);

  // Polling loop for dynamic real-time telemetry updates
  useEffect(() => {
    fetchLiveTopology();
    const interval = setInterval(() => {
      fetchLiveTopology();
      setRps((prev) => Math.max(10000, prev + (Math.floor(Math.random() * 200) - 100)));
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchLiveTopology]);

  // Interactive Trigger Handlers
  const handleTriggerAttack = async () => {
    setIsAttacked(true);
    if (isConnectedToBackend) {
      try {
        await fetch(`${API_BASE_URL}/simulate/attack`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to dispatch attack event to backend');
      }
    }
  };

  const handleApplyMitigation = async () => {
    setIsMitigating(true);
    if (isConnectedToBackend) {
      try {
        await fetch(`${API_BASE_URL}/simulate/mitigate`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to dispatch mitigation event to backend');
      }
    }

    setTimeout(() => {
      setIsMitigating(false);
      setIsAttacked(false);
      setIsResolved(true);
    }, 1400);
  };

  const handleReset = async () => {
    setIsAttacked(false);
    setIsMitigating(false);
    setIsResolved(false);
    if (isConnectedToBackend) {
      try {
        await fetch(`${API_BASE_URL}/simulate/reset`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to reset backend simulation state');
      }
    }
  };

  const nodeTypes = useMemo(() => ({ server: CustomServerNode }), []);

  return (
    <div className={`h-screen w-screen font-sans flex flex-col overflow-hidden transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0F1115] text-slate-100'
    }`}>
      {/* Enterprise Control Header */}
      <header className={`h-12 border-b px-5 flex items-center justify-between text-xs shrink-0 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161920] border-[#232730]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-sm font-mono">SENTRYPULSE</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-500/10 text-slate-400 font-mono">v2.4.0</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Autonomous Network Digital Twin</p>
          </div>
        </div>

        {/* Global Telemetry Strip */}
        <div className={`hidden md:flex items-center gap-6 text-[11px] font-mono px-4 py-1.5 rounded border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111318] border-[#232730]'
        }`}>
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isConnectedToBackend ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className="text-slate-500">TWIN SYNC:</span>
            <span className="font-bold">{isConnectedToBackend ? 'NETWORKX LIVE' : 'INTERNAL ENGINE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">THROUGHPUT:</span>
            <span className="font-bold">{rps.toLocaleString()} RPS</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">STATE:</span>
            <span className={`font-bold flex items-center gap-1.5 ${isAttacked ? 'text-red-500' : 'text-emerald-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isAttacked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isAttacked ? 'INCIDENT DETECTED' : 'OPERATIONAL'}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5">
          {!isAttacked && !isResolved && (
            <button
              onClick={handleTriggerAttack}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded font-semibold text-xs cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> Inject Attack Vectors
            </button>
          )}

          {(isAttacked || isResolved) && (
            <button
              onClick={handleReset}
              className={`flex items-center gap-2 px-3 py-1.5 rounded font-semibold text-xs cursor-pointer transition-all border ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#232730] border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset State
            </button>
          )}

          <div className={`h-4 w-px mx-1 ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

          <button
            onClick={() => setIsLight(!isLight)}
            className={`p-1.5 rounded border cursor-pointer transition-colors ${
              isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#161920] border-[#232730] text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        
        {/* Canvas Section */}
        <div className={`col-span-8 h-full rounded border relative overflow-hidden flex flex-col transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161920] border-[#232730]'
        }`}>
          <div className={`h-9 border-b px-4 flex items-center justify-between text-xs font-mono transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#111318] border-[#232730] text-slate-400'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              Dynamic Graph Topology ({nodes.length} Nodes Rendered)
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Nominal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
            </div>
          </div>

          <div className="flex-1 relative">
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView className="z-10">
              <Background color={isLight ? '#E2E8F0' : '#232730'} gap={24} size={1} />
              <Controls className={`!rounded !shadow-none ${
                isLight ? '!bg-white !border-slate-200 !text-slate-700' : '!bg-[#111318] !border-[#232730] !text-slate-300'
              }`} />
            </ReactFlow>
          </div>
        </div>

        {/* Control Panel */}
        <div className="col-span-4 h-full flex flex-col overflow-hidden">
          <div className={`flex rounded border p-1 mb-3 text-xs font-semibold transition-colors ${
            isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-[#111318] border-[#232730]'
          }`}>
            <button
              onClick={() => setActiveTab('pareto')}
              className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pareto'
                  ? isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#232730] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-500" /> Pareto Analysis
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#232730] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Swarm Triage
            </button>
          </div>

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