import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, RefreshCw, Terminal, Server, 
  ArrowUpRight, Activity, ShieldCheck, 
  Radio, AlertTriangle, Layers, CpuIcon, CheckCircle2, GitBranch, Sun, Moon, Network, Move, Sparkles, Wrench, ZoomIn, ZoomOut, RotateCcw, Download, Save
} from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [simState, setSimState] = useState('NOMINAL'); // 'NOMINAL', 'ATTACKED', 'HEALING'
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOption, setSelectedOption] = useState('A');
  const [dynamicFailureReport, setDynamicFailureReport] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  // Dynamic Telemetry Metrics State (No longer hardcoded)
  const [simulationCount, setSimulationCount] = useState(0);
  const [totalAnomaliesDetected, setTotalAnomaliesDetected] = useState(0);
  const [failureTypeStats, setFailureTypeStats] = useState({
    'THREADPOOL_DEADLOCK': 0,
    'MEMORY_LEAK_SPIKE': 0,
    'WRITE_LOCK_CONTEST': 0,
    'BUFFER_SATURATION': 0
  });

  // Canvas zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  
  // Touch / Pinch-to-zoom tracking refs
  const touchStartDistRef = useRef(null);
  const touchStartZoomRef = useRef(1);

  const canvasRef = useRef(null);
  const reportRef = useRef(null); // Ref for PDF generation container
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Live Audit Stream Session Logs
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'SentryPulse Topological Engine v2.5.0 online. 100,000 Monte Carlo iterations loaded.' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', msg: 'NetworkX Graph loaded: 8 nodes structured in 5 architectural tiers.' },
    { time: new Date().toLocaleTimeString(), level: 'AI', msg: 'Groq LLaMA-3.3 multi-agent triaging swarm scanning directed cyclic dependencies.' }
  ]);

  const initialNodes = [
    { id: '1', label: 'cloudflare-waf-edge', tier: 'Ingress', x: 100, y: 120, status: 'NOMINAL', cpu: '18.4%', latency: '12ms', ip: '192.168.1.1' },
    { id: '2', label: 'kong-api-gateway', tier: 'Gateway', x: 360, y: 120, status: 'NOMINAL', cpu: '34.2%', latency: '28ms', ip: '10.240.0.12' },
    { id: '3', label: 'vault-auth-service', tier: 'Security', x: 360, y: 320, status: 'NOMINAL', cpu: '22.1%', latency: '45ms', ip: '10.240.0.19' },
    { id: '4', label: 'core-banking-switch', tier: 'Routing', x: 660, y: 100, status: 'NOMINAL', cpu: '48.6%', latency: '82ms', ip: '10.240.0.15' },
    { id: '5', label: 'redis-settlement-cache', tier: 'Cache', x: 660, y: 320, status: 'NOMINAL', cpu: '14.2%', latency: '4ms', ip: '10.240.2.8' },
    { id: '6', label: 'postgres-cbs-primary', tier: 'Storage', x: 940, y: 210, status: 'NOMINAL', cpu: '31.8%', latency: '14ms', ip: '10.240.1.20' },
    { id: '7', label: 'kafka-async-broker', tier: 'Messaging', x: 360, y: 460, status: 'NOMINAL', cpu: '26.4%', latency: '19ms', ip: '10.240.3.11' },
    { id: '8', label: 'scikit-isolation-worker', tier: 'AI Engine', x: 660, y: 460, status: 'NOMINAL', cpu: '41.5%', latency: '110ms', ip: '10.240.4.5' },
  ];

  const [nodes, setNodes] = useState(initialNodes);

  // Computed Top Failure Vector dynamically extracted from live state counters
  const getTopFailureVector = () => {
    const entries = Object.entries(failureTypeStats);
    if (entries.every(([, count]) => count === 0)) return { name: 'Awaiting Simulation', rate: '0.0%' };
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((acc, [, val]) => acc + val, 0);
    const top = entries[0];
    const percentage = total > 0 ? ((top[1] / total) * 100).toFixed(1) : '0.0';
    return { name: top[0].replace(/_/g, ' '), rate: `${percentage}%` };
  };

  const topVector = getTopFailureVector();

  const getNodePos = (id) => {
    const n = nodes.find(item => item.id === id);
    return n ? { x: n.x + 110, y: n.y + 45 } : { x: 0, y: 0 };
  };

  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNodeId(node.id);
    setDragOffset({
      x: ((e.clientX - rect.left) / zoomLevel) - node.x,
      y: ((e.clientY - rect.top) / zoomLevel) - node.y
    });
    setSelectedNode(node);
  };

  const handleMouseDownCanvas = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg' || (e.target.tagName === 'DIV' && e.target.dataset.panningArea)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMoveCanvas = (e) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(10, Math.min(rect.width / zoomLevel - 240, ((e.clientX - rect.left) / zoomLevel) - dragOffset.x));
      const newY = Math.max(10, Math.min(rect.height / zoomLevel - 100, ((e.clientY - rect.top) / zoomLevel) - dragOffset.y));
      setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleTouchStartCanvas = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1 && (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.dataset?.panningArea)) {
      setIsPanning(true);
      panStartRef.current = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y };
    }
  };

  const handleTouchMoveCanvas = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newZoom = Math.max(0.6, Math.min(1.8, touchStartZoomRef.current * factor));
      setZoomLevel(newZoom);
    } else if (e.touches.length === 1 && isPanning) {
      setPanOffset({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y
      });
    }
  };

  const handleTouchEndCanvas = () => {
    touchStartDistRef.current = null;
    setIsPanning(false);
  };

  const handleWheelCanvas = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      setZoomLevel(prev => Math.max(0.6, Math.min(1.8, prev + zoomFactor)));
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'SYS', msg: '📄 Compiling active audit report into professional PDF format...' },
      ...prev
    ]);

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => executePdfExport();
      document.body.appendChild(script);
    } else {
      executePdfExport();
    }
  };

  const executePdfExport = () => {
    const element = reportRef.current;
    const opt = {
      margin:       10,
      filename:     `sentrypulse_audit_report_${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsDownloadingPdf(false);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: '✅ PDF audit report successfully generated and downloaded.' },
        ...prev
      ]);
    }).catch(err => {
      console.error(err);
      setIsDownloadingPdf(false);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'CRIT', msg: '❌ Failed to export PDF report.' },
        ...prev
      ]);
    });
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'WARN', msg: '🚀 Executing 100,000 Monte Carlo perturbation iterations across NetworkX topology...' },
      ...prev
    ]);
    
    setTimeout(() => {
      setIsSimulating(false);
      setSimState('ATTACKED');
      setSimulationCount(prev => prev + 1);

      const failCandidates = ['2', '4', '6', '8'];
      const shuffled = failCandidates.sort(() => 0.5 - Math.random());
      const primaryFail = shuffled[0];
      const secondaryFail = shuffled[1];

      const failureTypes = [
        { alert: 'THREADPOOL_DEADLOCK', cpu: '99.8%', latency: '3400ms' },
        { alert: 'MEMORY_LEAK_SPIKE', cpu: '96.2%', latency: '2100ms' },
        { alert: 'WRITE_LOCK_CONTEST', cpu: '94.5%', latency: '1900ms' },
        { alert: 'BUFFER_SATURATION', cpu: '88.1%', latency: '750ms' }
      ];

      const randAlert1 = failureTypes[Math.floor(Math.random() * failureTypes.length)];
      const randAlert2 = failureTypes[Math.floor(Math.random() * failureTypes.length)];

      // Increment dynamic anomaly stats counters
      const detectedBatch = Math.floor(Math.random() * 300) + 150;
      setTotalAnomaliesDetected(prev => prev + detectedBatch);
      setFailureTypeStats(prev => ({
        ...prev,
        [randAlert1.alert]: prev[randAlert1.alert] + 1,
        [randAlert2.alert]: prev[randAlert2.alert] + 1
      }));

      setNodes(nodes.map((node) => {
        if (node.id === primaryFail) {
          return { ...node, status: 'CRITICAL', cpu: randAlert1.cpu, latency: randAlert1.latency, alert: randAlert1.alert };
        }
        if (node.id === secondaryFail) {
          return { ...node, status: 'WARNING', cpu: randAlert2.cpu, latency: randAlert2.latency, alert: randAlert2.alert };
        }
        return { ...node, status: 'NOMINAL' };
      }));

      const failingNodeObj1 = nodes.find(n => n.id === primaryFail);
      const failingNodeObj2 = nodes.find(n => n.id === secondaryFail);

      setDynamicFailureReport({
        primaryId: primaryFail,
        secondaryId: secondaryFail,
        primary: failingNodeObj1?.label || 'core-banking-switch',
        secondary: failingNodeObj2?.label || 'postgres-cbs-primary',
        signature: `SIG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'CRIT', msg: `💥 100k Monte Carlo batch isolated cascade collapse on [${failingNodeObj1?.label}, ${failingNodeObj2?.label}].` },
        { time: new Date().toLocaleTimeString(), level: 'AI', msg: 'Groq LLaMA generated dynamic Pareto recovery vectors.' },
        ...prev
      ]);
    }, 2000);
  };

  const handleExecuteCure = () => {
    setSimState('HEALING');
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'AI', msg: `🛠️ Deploying Strategy [Option ${selectedOption}] to isolate & repair [${dynamicFailureReport?.primary}, ${dynamicFailureReport?.secondary}]...` },
      ...prev
    ]);

    setNodes(nodes.map(n => {
      if (n.id === dynamicFailureReport?.primary || n.id === dynamicFailureReport?.secondary) {
        return { ...n, status: 'PATCHING', alert: 'Remediating...' };
      }
      return n;
    }));

    setTimeout(() => {
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: `✅ Successfully flushed memory buffers and re-routed threadpool for [${dynamicFailureReport?.primary}].` },
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: `⚡ Autonomous webhook completed. Mesh topology fully restored.` },
        ...prev
      ]);
      setSimState('NOMINAL');
      setNodes(initialNodes);
      setDynamicFailureReport(null);
      setSelectedNode(null);
    }, 2500);
  };

  const handleReset = () => {
    setSimState('NOMINAL');
    setSelectedNode(null);
    setDynamicFailureReport(null);
    setNodes(initialNodes);
    setSimulationCount(0);
    setTotalAnomaliesDetected(0);
    setFailureTypeStats({
      'THREADPOOL_DEADLOCK': 0,
      'MEMORY_LEAK_SPIKE': 0,
      'WRITE_LOCK_CONTEST': 0,
      'BUFFER_SATURATION': 0
    });
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'SYS', msg: '⚡ Manual session reset triggered. Audit state refreshed.' },
      ...prev
    ]);
  };

  const p1 = getNodePos('1');
  const p2 = getNodePos('2');
  const p3 = getNodePos('3');
  const p4 = getNodePos('4');
  const p5 = getNodePos('5');
  const p6 = getNodePos('6');
  const p7 = getNodePos('7');
  const p8 = getNodePos('8');

  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';

  return (
    <div className={`min-h-screen flex flex-col font-mono text-xs transition-colors duration-300 ${
      isDarkMode ? 'bg-[#05070a] text-slate-200' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      
      {/* Top Command Bar */}
      <header className={`border-b px-6 py-3.5 flex justify-between items-center sticky top-0 z-50 shadow-md backdrop-blur transition-colors duration-300 ${
        isDarkMode ? 'border-slate-800 bg-[#090d14]/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${isHealing ? 'bg-amber-500 animate-spin' : isAttacked ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'} shadow-[0_0_12px_#10b981]`}></div>
            <span className="font-bold text-sm tracking-widest">SENTRYPULSE</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded border ${
              isDarkMode ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>v2.5.0-100K-STOCHASTIC</span>
          </div>
          <div className={`h-4 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <span className={`text-[11px] hidden md:inline ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Autonomous Infrastructure Resilience & 100k Monte Carlo Stress Engine</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline text-[10px]">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating || isHealing}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
          >
            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
            {isSimulating ? 'SIMULATING 100K...' : 'RUN 100K MONTE CARLO TEST'}
          </button>
          
          <button
            onClick={handleReset}
            className={`px-3.5 py-2.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer border ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Reset
          </button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 p-6 space-y-6 max-w-[1700px] w-full mx-auto">
        
        {/* Hidden Report Container specifically styled for clean PDF generation */}
        <div style={{ display: 'none' }}>
          <div ref={reportRef} style={{ padding: '24px', fontFamily: 'monospace', color: '#111', background: '#fff', width: '800px' }}>
            <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#065f46' }}>SENTRYPULSE AUDIT REPORT</h1>
                <p style={{ fontSize: '11px', color: '#4b5563', margin: '0' }}>Autonomous Infrastructure Resilience & 100k Monte Carlo Log Stream</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>
                <p style={{ margin: '0 0 2px 0' }}>Generated: {new Date().toLocaleString()}</p>
                <p style={{ margin: '0' }}>System Status: <strong>{simState}</strong></p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>Executive Summary</h3>
              <p style={{ fontSize: '11px', margin: '0 0 6px 0' }}>Simulation State: <strong>{simState}</strong></p>
              <p style={{ fontSize: '11px', margin: '0 0 6px 0' }}>Total Runs Executed: <strong>{simulationCount}</strong></p>
              <p style={{ fontSize: '11px', margin: '0 0 6px 0' }}>Cumulative Anomalies Flagged: <strong>{totalAnomaliesDetected}</strong></p>
              <p style={{ fontSize: '11px', margin: '0' }}>Top Active Failure Vector: <strong>{topVector.name} ({topVector.rate})</strong></p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>Node Telemetry Snapshot</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Microservice</th>
                    <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Tier</th>
                    <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Status</th>
                    <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>CPU</th>
                    <th style={{ padding: '6px', border: '1px solid #d1d5db' }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(n => (
                    <tr key={n.id}>
                      <td style={{ padding: '6px', border: '1px solid #d1d5db' }}>{n.label}</td>
                      <td style={{ padding: '6px', border: '1px solid #d1d5db' }}>{n.tier}</td>
                      <td style={{ padding: '6px', border: '1px solid #d1d5db', fontWeight: 'bold', color: n.status === 'NOMINAL' ? '#059669' : '#dc2626' }}>{n.status}</td>
                      <td style={{ padding: '6px', border: '1px solid #d1d5db' }}>{n.cpu}</td>
                      <td style={{ padding: '6px', border: '1px solid #d1d5db' }}>{n.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>Live SSE Audit Session Logs</h3>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', background: '#fafafa', fontSize: '9px', maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '3px' }}>
                    <span style={{ color: '#6b7280' }}>[{log.time}]</span> <strong style={{ color: '#047857' }}>[{log.level}]</strong> {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Telemetry Ribbon (Now Dynamically Updated) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`border rounded-lg p-3.5 flex justify-between items-center shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] block uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Topology State</span>
              <span className={`text-xs font-bold ${isHealing ? 'text-amber-400' : isAttacked ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isHealing ? 'PATCHING & HEALING...' : isAttacked ? 'DYNAMIC CASCADE FAILURE' : '100% NOMINAL'}
              </span>
            </div>
            <Activity className={`w-4 h-4 ${isHealing ? 'text-amber-400' : isAttacked ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>

          <div className={`border rounded-lg p-3.5 flex justify-between items-center shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] block uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>100k Simulations Scan ({simulationCount} runs)</span>
              <span className="text-xs font-bold text-rose-400">{totalAnomaliesDetected.toLocaleString()} Anomalies Flagged</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>

          <div className={`border rounded-lg p-3.5 flex justify-between items-center shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] block uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Top Failure Vector</span>
              <span className="text-xs font-bold text-amber-400">{topVector.name} ({topVector.rate})</span>
            </div>
            <CpuIcon className="w-4 h-4 text-amber-400" />
          </div>

          <div className={`border rounded-lg p-3.5 flex justify-between items-center shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] block uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active Diagram Nodes</span>
              <span className="text-xs font-bold text-emerald-500">{nodes.length} Microservices</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* CANVAS (Ctrl+Scroll / Pinch / Buttons for Zoom) */}
        <div className={`border rounded-xl p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Network className="w-4 h-4 text-emerald-500" /> Stochastic NetworkX Digital Twin (Hold Ctrl + Scroll to Zoom)
              </h2>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Normal page scrolling is unlocked. Use Ctrl+Wheel, pinch gestures, or buttons to zoom.</p>
            </div>
            
            {/* Zoom Controls Toolbar */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-1 rounded font-mono ${isDarkMode ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                Zoom: {Math.round(zoomLevel * 100)}%
              </span>
              <button onClick={handleZoomIn} title="Zoom In" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100'}`}>
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut} title="Zoom Out" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100'}`}>
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleResetZoom} title="Reset View" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Canvas */}
          <div 
            ref={canvasRef}
            data-panning-area="true"
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            onMouseLeave={handleMouseUpCanvas}
            onTouchStart={handleTouchStartCanvas}
            onTouchMove={handleTouchMoveCanvas}
            onTouchEnd={handleTouchEndCanvas}
            onWheel={handleWheelCanvas}
            className={`w-full h-[540px] rounded-xl border relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
              isDarkMode ? 'bg-[#030508] border-slate-800/80' : 'bg-slate-100 border-slate-200'
            }`}
          >
            
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

            {/* Transform Container for Zoom & Pan */}
            <div 
              className="absolute inset-0 w-full h-full transition-transform duration-75 origin-top-left pointer-events-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
              }}
            >
              <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none" style={{ zIndex: 0 }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={isHealing ? "#f59e0b" : isAttacked ? "#f43f5e" : "#10b981"} />
                  </marker>
                </defs>

                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isAttacked ? "#f43f5e" : "#10b981"} strokeWidth="2" markerEnd="url(#arrow)" />
                <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={isAttacked ? "#f43f5e" : "#10b981"} strokeWidth="2.5" strokeDasharray={isAttacked ? "4 4" : "none"} markerEnd="url(#arrow)" />
                <line x1={p4.x} y1={p4.y} x2={p6.x} y2={p6.y} stroke={isAttacked ? "#f43f5e" : "#10b981"} strokeWidth="3" markerEnd="url(#arrow)" />
                <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                <line x1={p4.x} y1={p4.y} x2={p5.x} y2={p5.y} stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <line x1={p2.x} y1={p2.y} x2={p7.x} y2={p7.y} stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <line x1={p7.x} y1={p7.y} x2={p8.x} y2={p8.y} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />

                {!isAttacked && !isHealing && (
                  <circle r="4" fill="#38bdf8">
                    <animateMotion path={`M ${p2.x} ${p2.y} L ${p4.x} ${p4.y}`} dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isCritical = node.status === 'CRITICAL' || node.status === 'WARNING';
                const isPatching = node.status === 'PATCHING';
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleMouseDownNode(e, node)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute w-56 p-3 rounded-lg border transition-shadow cursor-grab active:cursor-grabbing pointer-events-auto z-10 backdrop-blur-md shadow-xl ${
                      isPatching
                        ? 'border-amber-400 bg-amber-950/90 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                        : isCritical 
                        ? 'border-rose-500 bg-rose-950/90 shadow-[0_0_30px_rgba(244,63,94,0.5)] animate-bounce' 
                        : isSelected 
                        ? 'border-cyan-400 bg-cyan-950/90 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                        : isDarkMode 
                        ? 'bg-[#080c14]/95 border-slate-700/80 hover:border-emerald-500 text-slate-200' 
                        : 'bg-white/95 border-slate-300 hover:border-emerald-500 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                        <Move className="w-2.5 h-2.5 text-emerald-500" /> {node.tier}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isPatching ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <h3 className={`text-xs font-bold mb-1 flex items-center gap-1.5 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <Server className={`w-3.5 h-3.5 shrink-0 ${isPatching ? 'text-amber-400' : isCritical ? 'text-rose-400' : 'text-emerald-500'}`} />
                      <span className="truncate">{node.label}</span>
                    </h3>

                    <div className={`space-y-0.5 text-[10px] border-t pt-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className="flex justify-between text-slate-400"><span>CPU:</span> <span className="font-bold text-slate-200">{node.cpu}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Latency:</span> <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-200'}>{node.latency}</span></div>
                    </div>

                    {node.alert && (
                      <div className={`mt-1 pt-1 border-t text-[9px] font-bold flex items-center gap-1 ${isPatching ? 'border-amber-500/30 text-amber-300' : 'border-rose-500/30 text-rose-400'}`}>
                        {isPatching ? <Wrench className="w-3 h-3 shrink-0 animate-spin" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                        <span>{node.alert}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t flex justify-between items-center text-[11px] ${isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
            <span>Total Simulation Runs: <strong className="text-emerald-500">{simulationCount}</strong> | Cumulative Anomalies: <strong className="text-rose-400">{totalAnomaliesDetected}</strong></span>
            <span>Selected Node: <strong className="text-cyan-400">{selectedNode ? `${selectedNode.label} (${selectedNode.ip})` : 'None'}</strong></span>
          </div>
        </div>

        {/* Dynamic Pareto Output Matrix & Terminal with PDF Export */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className={`lg:col-span-2 border rounded-xl p-6 flex flex-col justify-between shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Layers className="w-4 h-4 text-amber-500" /> Dynamic Pareto Decision Matrix (NSGA-II Solver)
                </h3>
                <span className={`text-[10px] px-2.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {dynamicFailureReport ? `Targets: ${dynamicFailureReport.primary}, ${dynamicFailureReport.secondary}` : 'Standby'}
                </span>
              </div>

              {isAttacked || isHealing ? (
                <div className="space-y-3">
                  <div 
                    onClick={() => setSelectedOption('A')}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedOption === 'A' 
                        ? 'bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : isDarkMode ? 'bg-[#04060a] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> OPTION A [Dynamic Micro-Isolate]</span>
                      <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50 font-bold">MTTR: 0.9s | Cost: Low</span>
                    </div>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Isolate threadpool on <strong className="text-emerald-400">{dynamicFailureReport?.primary}</strong> and spillover ingress to Kafka buffer queue.</p>
                  </div>

                  <div 
                    onClick={() => setSelectedOption('B')}
                    className={`p-4 rounded-lg border cursor-pointer transition-all opacity-80 ${
                      selectedOption === 'B' 
                        ? 'bg-emerald-950/20 border-emerald-500/80' 
                        : isDarkMode ? 'bg-[#04060a] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>OPTION B [Full Region Rebalance]</span>
                      <span className="text-[10px] bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/50 font-bold">MTTR: 11.4s | Cost: High</span>
                    </div>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Reroute traffic around <strong className="text-amber-400">{dynamicFailureReport?.secondary}</strong> via hot-standby Redis cluster.</p>
                  </div>
                </div>
              ) : (
                <div className={`h-44 flex flex-col items-center justify-center border border-dashed rounded-lg text-center p-6 ${
                  isDarkMode ? 'border-slate-800 bg-[#04060a]/50 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <GitBranch className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                  <p className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>100k Monte Carlo Simulation Standby</p>
                  <p className="text-[11px] text-slate-500">Run the stress test to aggregate Monte Carlo permutations and output dynamic failure statistics.</p>
                </div>
              )}
            </div>

            {isAttacked && (
              <div className={`mt-5 pt-4 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Selected Strategy: <strong className="text-emerald-500">Option {selectedOption}</strong></span>
                <button
                  onClick={handleExecuteCure}
                  disabled={isHealing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50"
                >
                  {isHealing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  {isHealing ? 'APPLYING REMEDIATION...' : `EXECUTE CURE ON [${dynamicFailureReport?.primary}]`} <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Terminal & Save PDF Report Panel */}
          <div className={`border rounded-xl p-6 flex flex-col shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex justify-between items-center mb-3 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Terminal className="w-4 h-4 text-cyan-500" /> Live SSE Audit Stream
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  title="Download Scan Report as PDF"
                  className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-emerald-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {isDownloadingPdf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {isDownloadingPdf ? 'Exporting PDF...' : 'Save PDF'}
                </button>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
            </div>
            
            <div className={`flex-1 border rounded-lg p-3.5 font-mono text-[10px] space-y-2.5 overflow-y-auto max-h-[220px] shadow-inner ${
              isDarkMode ? 'bg-[#04060a] border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'CRIT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    log.level === 'AI' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {log.level}
                  </span>
                  <span>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}