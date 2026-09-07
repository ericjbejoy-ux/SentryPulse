import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomServerNode } from './canvas/CustomServerNode';
import SwarmFeed from './components/SwarmFeed';
import ParetoChart from './components/ParetoChart';
import { Shield, Activity, Cpu, Zap, RotateCcw, Sun, Moon, Sliders, Terminal, LayoutGrid, Radio } from 'lucide-react';

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
  const [selectedFault, setSelectedFault] = useState('db_lock');

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLight]);

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

  const generateFallbackDynamicGraph = useCallback(() => {
    let rawNodes = [];
    let rawEdges = [];

    if (isResolved) {
      rawNodes = [
        { id: '1', label: 'storefront-ui', status: 'NOMINAL', cpu: '18%', latency: '12ms', load: '0.18', packets: '1.2k', position: { x: 240, y: 30 } },
        { id: '2', label: 'api-gateway', status: 'NOMINAL', cpu: '24%', latency: '18ms', load: '0.32', packets: '3.4k', position: { x: 240, y: 150 } },
        { id: '3', label: 'cart-service', status: 'NOMINAL', cpu: '22%', latency: '14ms', load: '0.25', packets: '1.8k', position: { x: 60, y: 270 } },
        { id: '4', label: 'redis-cache', status: 'NOMINAL', cpu: '12%', latency: '2ms', load: '0.08', packets: '4.1k', position: { x: 420, y: 270 } },
        { id: '5', label: 'postgres-db (SEC)', status: 'NOMINAL', cpu: '28%', latency: '8ms', load: '0.45', packets: '2.1k', alertMessage: 'FAILOVER COMPLETE', position: { x: 240, y: 390 } },
      ];
      rawEdges = [
        { source: '1', target: '2', status: 'NOMINAL' },
        { source: '2', target: '3', status: 'NOMINAL' },
        { source: '2', target: '4', status: 'NOMINAL' },
        { source: '3', target: '5', status: 'NOMINAL' },
      ];
    } else if (isAttacked) {
      if (selectedFault === 'memory_leak') {
        rawNodes = [
          { id: '1', label: 'storefront-ui', status: 'WARNING', cpu: '45%', latency: '210ms', load: '1.80', packets: '4.2k', position: { x: 240, y: 30 } },
          { id: '2', label: 'api-gateway', status: 'WARNING', cpu: '62%', latency: '480ms', load: '2.90', packets: '8.1k', position: { x: 240, y: 150 } },
          { id: '3', label: 'cart-service', status: 'CRITICAL', cpu: '100%', latency: 'ERR_503', load: 'ERR', packets: '0', alertMessage: 'OOM KILLED (MEM > 99%)', position: { x: 60, y: 270 } },
          { id: '4', label: 'redis-cache', status: 'NOMINAL', cpu: '14%', latency: '2ms', load: '0.09', packets: '3.5k', position: { x: 420, y: 270 } },
          { id: '5', label: 'postgres-primary-db', status: 'NOMINAL', cpu: '18%', latency: '5ms', load: '0.22', packets: '420', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'WARNING' },
          { source: '2', target: '3', status: 'CRITICAL', animated: true },
          { source: '2', target: '4', status: 'NOMINAL' },
          { source: '3', target: '5', status: 'NOMINAL' },
        ];
      } else if (selectedFault === 'cache_stampede') {
        rawNodes = [
          { id: '1', label: 'storefront-ui', status: 'WARNING', cpu: '68%', latency: '140ms', load: '2.40', packets: '8.8k', position: { x: 240, y: 30 } },
          { id: '2', label: 'api-gateway', status: 'WARNING', cpu: '74%', latency: '290ms', load: '4.10', packets: '16.2k', position: { x: 240, y: 150 } },
          { id: '3', label: 'cart-service', status: 'WARNING', cpu: '82%', latency: '380ms', load: '3.80', packets: '14.1k', position: { x: 60, y: 270 } },
          { id: '4', label: 'redis-cache', status: 'CRITICAL', cpu: '100%', latency: '990ms', load: '15.2', packets: '89.0k', alertMessage: 'CACHE MISS STORM', position: { x: 420, y: 270 } },
          { id: '5', label: 'postgres-primary-db', status: 'CRITICAL', cpu: '92%', latency: '1800ms', load: '11.4', packets: '38.0k', alertMessage: 'UNCACHED READ SURGE', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'WARNING' },
          { source: '2', target: '3', status: 'WARNING' },
          { source: '2', target: '4', status: 'CRITICAL', animated: true },
          { source: '3', target: '5', status: 'CRITICAL', animated: true },
        ];
      } else if (selectedFault === 'ddos') {
        rawNodes = [
          { id: '1', label: 'storefront-ui', status: 'CRITICAL', cpu: '98%', latency: '3200ms', load: '24.0', packets: '180.0k', alertMessage: 'SYN FLOOD DETECTED', position: { x: 240, y: 30 } },
          { id: '2', label: 'api-gateway', status: 'CRITICAL', cpu: '99%', latency: '4100ms', load: '31.5', packets: '210.0k', alertMessage: 'BANDWIDTH SATURATION', position: { x: 240, y: 150 } },
          { id: '3', label: 'cart-service', status: 'WARNING', cpu: '65%', latency: '180ms', load: '2.10', packets: '5.4k', position: { x: 60, y: 270 } },
          { id: '4', label: 'redis-cache', status: 'NOMINAL', cpu: '18%', latency: '3ms', load: '0.12', packets: '4.2k', position: { x: 420, y: 270 } },
          { id: '5', label: 'postgres-primary-db', status: 'NOMINAL', cpu: '22%', latency: '7ms', load: '0.30', packets: '1.2k', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'CRITICAL', animated: true },
          { source: '2', target: '3', status: 'WARNING' },
          { source: '2', target: '4', status: 'NOMINAL' },
          { source: '3', target: '5', status: 'NOMINAL' },
        ];
      } else if (selectedFault === 'fintech_payment') {
        rawNodes = [
          { id: '1', label: 'checkout-portal', status: 'WARNING', cpu: '64%', latency: '850ms', load: '3.12', packets: '18.4k', position: { x: 240, y: 30 } },
          { id: '2', label: 'payment-api-gw', status: 'WARNING', cpu: '82%', latency: '1420ms', load: '6.80', packets: '42.1k', position: { x: 240, y: 150 } },
          { id: '3', label: 'kafka-event-bus', status: 'CRITICAL', cpu: '94%', latency: '4800ms', load: '22.1', packets: '120.0k', alertMessage: 'CONSUMER GROUP LAG > 50K', position: { x: 60, y: 270 } },
          { id: '4', label: 'fraud-eval-worker', status: 'CRITICAL', cpu: '99%', latency: '3100ms', load: '14.2', packets: '8.5k', alertMessage: 'MODEL INFERENCE DEADLOCK', position: { x: 420, y: 270 } },
          { id: '5', label: 'cockroach-ledger-db', status: 'WARNING', cpu: '78%', latency: '620ms', load: '4.10', packets: '15.2k', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'WARNING' },
          { source: '2', target: '3', status: 'CRITICAL', animated: true },
          { source: '2', target: '4', status: 'CRITICAL', animated: true },
          { source: '3', target: '5', status: 'WARNING' },
        ];
      } else if (selectedFault === 'llm_cluster') {
        rawNodes = [
          { id: '1', label: 'copilot-web-ui', status: 'WARNING', cpu: '58%', latency: '2200ms', load: '2.40', packets: '6.2k', position: { x: 240, y: 30 } },
          { id: '2', label: 'langchain-orchestrator', status: 'CRITICAL', cpu: '95%', latency: '8900ms', load: '18.4', packets: '24.1k', alertMessage: 'CONTEXT BUFFER OVERFLOW', position: { x: 240, y: 150 } },
          { id: '3', label: 'qdrant-vector-index', status: 'CRITICAL', cpu: '91%', latency: '3400ms', load: '12.1', packets: '18.9k', alertMessage: 'HNSW GRAPH MEMORY SWAP', position: { x: 60, y: 270 } },
          { id: '4', label: 'vllm-gpu-node-a100', status: 'CRITICAL', cpu: '100%', latency: '12400ms', load: '45.0', packets: '2.1k', alertMessage: 'CUDA OUT OF MEMORY', position: { x: 420, y: 270 } },
          { id: '5', label: 'model-weights-s3', status: 'NOMINAL', cpu: '12%', latency: '15ms', load: '0.10', packets: '520', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'WARNING' },
          { source: '2', target: '3', status: 'CRITICAL', animated: true },
          { source: '2', target: '4', status: 'CRITICAL', animated: true },
          { source: '4', target: '5', status: 'NOMINAL' },
        ];
      } else {
        // Default DB Lock
        rawNodes = [
          { id: '1', label: 'storefront-ui', status: 'WARNING', cpu: '78%', latency: '180ms', load: '3.10', packets: '12.4k', position: { x: 240, y: 30 } },
          { id: '2', label: 'api-gateway', status: 'WARNING', cpu: '85%', latency: '320ms', load: '5.40', packets: '28.1k', position: { x: 240, y: 150 } },
          { id: '3', label: 'cart-service', status: 'CRITICAL', cpu: '96%', latency: '1200ms', load: '11.2', packets: '18.5k', alertMessage: 'POOL EXHAUSTED', position: { x: 60, y: 270 } },
          { id: '4', label: 'redis-cache', status: 'NOMINAL', cpu: '22%', latency: '4ms', load: '0.15', packets: '8.2k', position: { x: 420, y: 270 } },
          { id: '5', label: 'postgres-primary-db', status: 'CRITICAL', cpu: '99%', latency: '4500ms', load: '18.9', packets: '45.0k', alertMessage: 'ROW-LOCK SATURATION', position: { x: 240, y: 390 } },
        ];
        rawEdges = [
          { source: '1', target: '2', status: 'WARNING' },
          { source: '2', target: '3', status: 'CRITICAL', animated: true },
          { source: '2', target: '4', status: 'NOMINAL' },
          { source: '3', target: '5', status: 'CRITICAL', animated: true },
        ];
      }
    } else {
      rawNodes = [
        { id: '1', label: 'storefront-ui', status: 'NOMINAL', cpu: '15%', latency: '10ms', load: '0.15', packets: '950', position: { x: 240, y: 30 } },
        { id: '2', label: 'api-gateway', status: 'NOMINAL', cpu: '22%', latency: '15ms', load: '0.28', packets: '2.2k', position: { x: 240, y: 150 } },
        { id: '3', label: 'cart-service', status: 'NOMINAL', cpu: '18%', latency: '12ms', load: '0.20', packets: '1.1k', position: { x: 60, y: 270 } },
        { id: '4', label: 'redis-cache', status: 'NOMINAL', cpu: '10%', latency: '1ms', load: '0.05', packets: '3.8k', position: { x: 420, y: 270 } },
        { id: '5', label: 'postgres-primary-db', status: 'NOMINAL', cpu: '25%', latency: '6ms', load: '0.38', packets: '1.5k', position: { x: 240, y: 390 } },
      ];
      rawEdges = [
        { source: '1', target: '2', status: 'NOMINAL' },
        { source: '2', target: '3', status: 'NOMINAL' },
        { source: '2', target: '4', status: 'NOMINAL' },
        { source: '3', target: '5', status: 'NOMINAL' },
      ];
    }

    const { formattedNodes, formattedEdges } = formatTopologyPayload(rawNodes, rawEdges, isLight);
    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [isAttacked, isResolved, selectedFault, isLight, formatTopologyPayload]);

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
      generateFallbackDynamicGraph();
    }
  }, [isLight, formatTopologyPayload, generateFallbackDynamicGraph]);

  useEffect(() => {
    fetchLiveTopology();
    const interval = setInterval(() => {
      fetchLiveTopology();
      setRps((prev) => Math.max(10000, prev + (Math.floor(Math.random() * 200) - 100)));
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchLiveTopology]);

  const handleTriggerAttack = async () => {
    setIsAttacked(true);
    setIsResolved(false);

    generateFallbackDynamicGraph();

    if (isConnectedToBackend) {
      try {
        await fetch(`${API_BASE_URL}/simulate/attack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fault_type: selectedFault }),
        });
        fetchLiveTopology();
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
          {/* Fault Selector Dropdown */}
          {!isAttacked && !isResolved && (
            <select
              value={selectedFault}
              onChange={(e) => setSelectedFault(e.target.value)}
              className="bg-[#232730] border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="db_lock">Fault: DB Lock</option>
              <option value="memory_leak">Fault: OOM Crash</option>
              <option value="cache_stampede">Fault: Cache Storm</option>
              <option value="ddos">Fault: Volumetric DDoS</option>
              <option value="fintech_payment">Fault: Kafka Lag (Fintech)</option>
              <option value="llm_cluster">Fault: CUDA OOM (AI Cluster)</option>
            </select>
          )}

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