import React, { useState, useRef, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, ShieldCheck } from 'lucide-react';
import HeaderToolBar from './components/HeaderToolBar';
import TopologyCanvas from './components/TopologyCanvas';
import InspectionDrawer from './components/InspectionDrawer';
import PareToMatrix from './components/PareToMatrix';
import TerminalDrawer from './components/TerminalDrawer';
import TelemetryAnalyticsView from './components/TelemetryAnalyticsView';
import IncidentTriageDashboard from './components/IncidentTriageDashboard';

const initialNodes = [
  { id: '1', label: 'cloudflare-waf-edge', tier: 'Ingress', x: 120, y: 100, status: 'NOMINAL', cpu: '18.4%', latency: '12ms', ip: '192.168.1.1' },
  { id: '2', label: 'kong-api-gateway', tier: 'Gateway', x: 390, y: 100, status: 'NOMINAL', cpu: '34.2%', latency: '28ms', ip: '10.240.0.12' },
  { id: '3', label: 'vault-auth-service', tier: 'Security', x: 390, y: 320, status: 'NOMINAL', cpu: '22.1%', latency: '45ms', ip: '10.240.0.19' },
  { id: '4', label: 'core-banking-switch', tier: 'Routing', x: 710, y: 90, status: 'NOMINAL', cpu: '48.6%', latency: '82ms', ip: '10.240.0.15' },
  { id: '5', label: 'redis-settlement-cache', tier: 'Cache', x: 710, y: 320, status: 'NOMINAL', cpu: '14.2%', latency: '4ms', ip: '10.240.2.8' },
  { id: '6', label: 'postgres-cbs-primary', tier: 'Storage', x: 1000, y: 205, status: 'NOMINAL', cpu: '31.8%', latency: '14ms', ip: '10.240.1.20' },
  { id: '7', label: 'kafka-async-broker', tier: 'Messaging', x: 390, y: 480, status: 'NOMINAL', cpu: '26.4%', latency: '19ms', ip: '10.240.3.11' },
  { id: '8', label: 'scikit-isolation-worker', tier: 'AI Engine', x: 710, y: 480, status: 'NOMINAL', cpu: '41.5%', latency: '110ms', ip: '10.240.4.5' },
];

const initialIncidents = [
  {
    id: 'INC-901',
    service: 'kafka-ingest-consumer',
    vector: 'Consumer Group Offset Lag',
    category: 'arised',
    severity: 'High',
    timestamp: '12:32:10 UTC',
    description: 'Consumer group lag exceeded 45,000 messages on partition 3 due to downstream worker starvation.',
    actionTaken: 'Awaiting Groq LLaMA swarm heuristic trigger or manual consumer replica scaling.',
    assignee: 'SRE On-Call'
  },
  {
    id: 'INC-900',
    service: 'kong-api-gateway',
    vector: 'Worker Threadpool Exhaustion',
    category: 'solved-ai',
    severity: 'Critical',
    timestamp: '12:28:45 UTC',
    description: 'Incoming volumetric spike saturated active worker threads causing 504 gateway timeout bursts.',
    actionTaken: 'Groq AI Agent Swarm dynamically recycled worker threadpool, flushed stale keepalives, and auto-scaled replicas.',
    mttr: '1.2s'
  },
  {
    id: 'INC-899',
    service: 'postgres-cbs-primary',
    vector: 'Write-Lock Exhaustion',
    category: 'solved-ai',
    severity: 'Critical',
    timestamp: '12:22:15 UTC',
    description: 'Long-running settlement query held exclusive row lock, blocking downstream transaction commits.',
    actionTaken: 'Terminated idle-in-transaction connection via automated agent safety guardrail and re-routed queries through read replica.',
    mttr: '850ms'
  },
  {
    id: 'INC-898',
    service: 'redis-cluster-cache',
    vector: 'Pipeline Buffer Saturation',
    category: 'solved-ai',
    severity: 'Medium',
    timestamp: '12:15:00 UTC',
    description: 'Keyspace memory pressure crossed 85% threshold during high-frequency session token reads.',
    actionTaken: 'Evicted expired LRU keyspace segments and triggered automated defragmentation sweep.',
    mttr: '420ms'
  },
  {
    id: 'INC-897',
    service: 'vault-secrets-broker',
    vector: 'Certificate Rotation Handshake Latency',
    category: 'pending',
    severity: 'Medium',
    timestamp: '11:50:22 UTC',
    description: 'Secondary node certificate rotation handshake experiencing intermittent timeouts.',
    actionTaken: 'Escalated to SecOps team for manual cert bundle verification on secondary cluster node.',
    assignee: 'SecOps Team'
  },
  {
    id: 'INC-896',
    service: 'scikit-inference-worker',
    vector: 'Vector Dimension Mismatch Warning',
    category: 'pending',
    severity: 'Low',
    timestamp: '11:40:05 UTC',
    description: 'Embedding pipeline received 768-dim tensor instead of expected 512-dim vector format.',
    actionTaken: 'Queued for ML Platform Lead review and client payload version check.',
    assignee: 'ML Platform Lead'
  }
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('sentrypulse-theme') !== 'light';
    } catch {
      return true;
    }
  });
  const [simState, setSimState] = useState('NOMINAL'); // 'NOMINAL', 'ATTACKED', 'HEALING'
  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOption, setSelectedOption] = useState('A');
  const [dynamicFailureReport, setDynamicFailureReport] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Navigation View State ('warroom' vs 'analytics' vs 'triage')
  const [currentView, setCurrentView] = useState('warroom');

  // Dynamic Telemetry Metrics State
  const [simulationCount, setSimulationCount] = useState(0);
  const [totalAnomaliesDetected, setTotalAnomaliesDetected] = useState(0);
  const [failureTypeStats, setFailureTypeStats] = useState({
    'THREADPOOL_DEADLOCK': 0,
    'MEMORY_LEAK_SPIKE': 0,
    'WRITE_LOCK_CONTEST': 0,
    'BUFFER_SATURATION': 0
  });

  // Shared incident lifecycle feed — single source of truth for War Room + Triage + Analytics
  const [incidents, setIncidents] = useState(initialIncidents);

  // Shared audit log stream — flows into every view
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'SentryPulse Topological Engine v2.5.0 initialized. 100,000 Monte Carlo vectors loaded.' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', msg: 'NetworkX Graph topology parsed: 8 nodes across 5 architectural tiers.' },
    { time: new Date().toLocaleTimeString(), level: 'AI', msg: 'Groq LLaMA-3.3 multi-agent triaging swarm active on directed cyclic dependencies.' }
  ]);

  // Topology nodes — controlled here so simulation/cure/reset can rewrite the mesh
  const [nodes, setNodes] = useState(initialNodes);
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  });

  const reportRef = useRef(null);
  const [now, setNow] = useState(new Date());
  const [bootEpoch, setBootEpoch] = useState(null);

  // Live clock for header + audit stream timestamps
  useEffect(() => {
    setBootEpoch(Date.now());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist theme preference
  useEffect(() => {
    try {
      localStorage.setItem('sentrypulse-theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }, [isDarkMode]);

  // Live audit heartbeat — keeps the terminal feeling alive
  useEffect(() => {
    const heartbeats = [
      { level: 'INFO', msg: 'OpenTelemetry trace correlation window flushed (30s rolling buffer).' },
      { level: 'SYS', msg: 'Telemetry collectors synced: 8/8 microservices reporting within SLA.' },
      { level: 'AI', msg: 'Groq LLaMA swarm heartbeat OK — 0 drift on mitigation vector cache.' },
      { level: 'INFO', msg: 'NetworkX digital twin state consistent with production mesh.' },
      { level: 'SYS', msg: 'Threat-intel feed refreshed: 0 new adversary signatures ingested.' },
      { level: 'AI', msg: 'Pareto front recomputed: 3 non-dominated recovery strategies ranked.' }
    ];
    let i = 0;
    const id = setInterval(() => {
      const item = heartbeats[i % heartbeats.length];
      i += 1;
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: item.level, msg: item.msg },
        ...prev
      ].slice(0, 60));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const formatUptime = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600).toString().padStart(2, '0');
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleClearLogs = () => {
    setLogs([{ time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Audit stream buffer cleared by operator. Live heartbeat resumed.' }]);
  };

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

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Compiling structural telemetry report into audit PDF format...' },
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
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'PDF audit report successfully generated and downloaded.' },
        ...prev
      ]);
    }).catch(err => {
      console.error(err);
      setIsDownloadingPdf(false);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'CRIT', msg: 'Failed to export PDF report.' },
        ...prev
      ]);
    });
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSelectedNode(null);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'WARN', msg: 'Executing 100,000 Monte Carlo perturbation iterations across topology graph...' },
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

      const detectedBatch = Math.floor(Math.random() * 300) + 150;
      setTotalAnomaliesDetected(prev => prev + detectedBatch);
      setFailureTypeStats(prev => ({
        ...prev,
        [randAlert1.alert]: prev[randAlert1.alert] + 1,
        [randAlert2.alert]: prev[randAlert2.alert] + 1
      }));

      setNodes(current => current.map((node) => {
        if (node.id === primaryFail) {
          return { ...node, status: 'CRITICAL', cpu: randAlert1.cpu, latency: randAlert1.latency, alert: randAlert1.alert };
        }
        if (node.id === secondaryFail) {
          return { ...node, status: 'WARNING', cpu: randAlert2.cpu, latency: randAlert2.latency, alert: randAlert2.alert };
        }
        return { ...node, status: 'NOMINAL' };
      }));

      const latestNodes = nodesRef.current;
      const failingNodeObj1 = latestNodes.find(n => n.id === primaryFail);
      const failingNodeObj2 = latestNodes.find(n => n.id === secondaryFail);

      setIncidents(prev => {
        const ts = new Date().toLocaleTimeString();
        const fresh = [
          {
            id: `INC-${1000 + prev.length + 1}`,
            service: failingNodeObj1?.label || 'core-banking-switch',
            vector: randAlert1.alert.replace(/_/g, ' '),
            category: 'arised',
            severity: 'Critical',
            timestamp: ts,
            description: `Monte Carlo vector isolated a cascade on ${failingNodeObj1?.label}: ${randAlert1.alert.replace(/_/g, ' ')} (${randAlert1.cpu} CPU, ${randAlert1.latency} latency).`,
            actionTaken: 'Awaiting Groq LLaMA swarm mitigation trigger.',
            assignee: 'AI Agent Swarm'
          },
          {
            id: `INC-${1000 + prev.length + 2}`,
            service: failingNodeObj2?.label || 'postgres-cbs-primary',
            vector: randAlert2.alert.replace(/_/g, ' '),
            category: 'arised',
            severity: 'High',
            timestamp: ts,
            description: `Secondary warning drift detected on ${failingNodeObj2?.label}: ${randAlert2.alert.replace(/_/g, ' ')} trending outside baseline SLA envelope.`,
            actionTaken: 'Queued for automated rebalance decision.',
            assignee: 'SRE On-Call'
          },
          ...prev
        ];
        return fresh.slice(0, 24);
      });

      setDynamicFailureReport({
        primaryId: primaryFail,
        secondaryId: secondaryFail,
        primary: failingNodeObj1?.label || 'core-banking-switch',
        secondary: failingNodeObj2?.label || 'postgres-cbs-primary',
        signature: `SIG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'CRIT', msg: `Cascade failure isolated on cluster nodes: [${failingNodeObj1?.label}, ${failingNodeObj2?.label}]` },
        { time: new Date().toLocaleTimeString(), level: 'AI', msg: 'Groq LLaMA synthesized Pareto recovery vectors.' },
        ...prev
      ]);
    }, 1800);
  };

  const handleExecuteCure = () => {
    setSimState('HEALING');
    setSelectedNode(null);
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'AI', msg: `Deploying mitigation strategy [Option ${selectedOption}] to isolate nodes...` },
      ...prev
    ]);

    setNodes(current => current.map(n => {
      if (n.id === dynamicFailureReport?.primaryId || n.id === dynamicFailureReport?.secondaryId) {
        return { ...n, status: 'PATCHING', alert: 'Remediating...' };
      }
      return n;
    }));

    setTimeout(() => {
      const report = dynamicFailureReport;
      setIncidents(prev => prev.map(inc =>
        inc.category === 'arised' && (inc.service === report?.primary || inc.service === report?.secondary)
          ? {
              ...inc,
              category: 'solved-ai',
              mttr: inc.severity === 'Critical' ? '1.8s' : '920ms',
              actionTaken: `Groq LLaMA swarm executed [Option ${selectedOption}] — ${inc.vector} mitigated and mesh topology revalidated.`
            }
          : inc
      ));

      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Memory buffers flushed and threadpools re-routed successfully.' },
        { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Mesh topology validation passed. State restored to nominal.' },
        { time: new Date().toLocaleTimeString(), level: 'INFO', msg: `Incident ${dynamicFailureReport?.signature} resolved — MTTR within SLA.` },
        ...prev
      ]);
      setSimState('NOMINAL');
      setNodes(initialNodes);
      setDynamicFailureReport(null);
      setSelectedNode(null);
    }, 2200);
  };

  const handleReset = () => {
    setSimState('NOMINAL');
    setSelectedNode(null);
    setDynamicFailureReport(null);
    setNodes(initialNodes);
    setSimulationCount(0);
    setTotalAnomaliesDetected(0);
    setIncidents(initialIncidents);
    setFailureTypeStats({
      'THREADPOOL_DEADLOCK': 0,
      'MEMORY_LEAK_SPIKE': 0,
      'WRITE_LOCK_CONTEST': 0,
      'BUFFER_SATURATION': 0
    });
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Session state manually cleared. Telemetry reset.' },
      ...prev
    ]);
  };

  // Keyboard shortcuts: 1/2/3 views, S simulate, R reset, T theme
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === '1') setCurrentView('warroom');
      else if (e.key === '2') setCurrentView('triage');
      else if (e.key === '3') setCurrentView('analytics');
      else if (e.key === 's' || e.key === 'S') {
        if (!isSimulating && !isHealing) handleRunSimulation();
      } else if (e.key === 'r' || e.key === 'R') handleReset();
      else if (e.key === 't' || e.key === 'T') setIsDarkMode(d => !d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, isSimulating, isHealing]);

  return (
    <div className={`min-h-screen flex flex-col font-mono text-sm selection:bg-emerald-500/30 transition-colors duration-200 relative overflow-x-clip ${
      isDarkMode ? 'bg-[#04060f] text-slate-100' : 'bg-[#eef1f6] text-slate-900'
    }`}>
      {/* Ambient Quantum Ops background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className={`absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full blur-[120px] transition-colors duration-500 ${isDarkMode ? 'bg-cyan-500/12' : 'bg-cyan-500/10'}`}></div>
        <div className={`absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full blur-[130px] transition-colors duration-500 ${isDarkMode ? 'bg-violet-600/12' : 'bg-indigo-500/10'}`}></div>
        <div className={`absolute -bottom-40 left-1/4 w-[36rem] h-[36rem] rounded-full blur-[130px] transition-colors duration-500 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/8'}`}></div>
        <div
          className="absolute inset-0 animate-gridDrift"
          style={{
            backgroundImage: `linear-gradient(${isDarkMode ? 'rgba(34,211,238,0.6)' : 'rgba(56,81,138,0.5)'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? 'rgba(34,211,238,0.6)' : 'rgba(56,81,138,0.5)'} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            opacity: 0.05,
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 78%)'
          }}
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,3,8,0.72))]"></div>
      </div>
      <HeaderToolBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(d => !d)}
        currentView={currentView}
        onViewChange={setCurrentView}
        now={now}
        uptime={formatUptime(bootEpoch ? Math.max(0, now.getTime() - bootEpoch) : 0)}
        isHealing={isHealing}
        isAttacked={isAttacked}
        isSimulating={isSimulating}
        onRunSimulation={handleRunSimulation}
        onReset={handleReset}
        showSimControls={currentView === 'warroom'}
      />

      {/* Main Container */}
      <main className="flex-1 p-5 space-y-5 max-w-[1700px] w-full mx-auto flex flex-col relative z-10">
        {currentView === 'analytics' ? (
          <div className={`border rounded-lg p-6 shadow-sm ${isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'}`}>
            <TelemetryAnalyticsView
              isLight={!isDarkMode}
              incidents={incidents}
              logs={logs}
              simulationCount={simulationCount}
              totalAnomaliesDetected={totalAnomaliesDetected}
            />
          </div>
        ) : currentView === 'triage' ? (
          <div className={`border rounded-lg p-6 shadow-sm ${isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'}`}>
            <IncidentTriageDashboard isLight={!isDarkMode} incidents={incidents} logs={logs} />
          </div>
        ) : (
          <>
            {/* Hidden PDF Report Template */}
            <div style={{ display: 'none' }}>
              <div ref={reportRef} style={{ padding: '24px', fontFamily: 'monospace', color: '#111', background: '#fff', width: '800px' }}>
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#111' }}>SENTRYPULSE AUDIT REPORT</h1>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>Autonomous Infrastructure Telemetry & Monte Carlo Log Snapshot</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
                    <p style={{ margin: '0 0 2px 0' }}>Timestamp: {new Date().toLocaleString()}</p>
                    <p style={{ margin: '0' }}>Status: <strong>{simState}</strong></p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#374151' }}>Telemetry Metrics</h3>
                  <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>Simulation State: <strong>{simState}</strong></p>
                  <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>Total Runs: <strong>{simulationCount}</strong></p>
                  <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>Anomalies Flagged: <strong>{totalAnomaliesDetected}</strong></p>
                  <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>Primary Failure Vector: <strong>{topVector.name} ({topVector.rate})</strong></p>
                  <p style={{ fontSize: '11px', margin: '0' }}>Incidents Tracked: <strong>{incidents.length}</strong> ({incidents.filter(i => i.category === 'solved-ai').length} AI-Resolved)</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#374151' }}>Microservice Status</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Service</th>
                        <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Tier</th>
                        <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Status</th>
                        <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>CPU</th>
                        <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(n => (
                        <tr key={n.id}>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{n.label}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{n.tier}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: n.status === 'NOMINAL' ? '#059669' : '#dc2626' }}>{n.status}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{n.cpu}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{n.latency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#374151' }}>Audit Session Logs</h3>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', background: '#fafafa', fontSize: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                    {logs.map((log, i) => (
                      <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #f3f4f6', paddingBottom: '3px' }}>
                        <span style={{ color: '#9ca3af' }}>[{log.time}]</span> <strong>[{log.level}]</strong> {log.msg}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Telemetry Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`border rounded-lg p-4.5 flex justify-between items-center shadow-sm transition-colors duration-200 ${
                isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
              }`}>
                <div>
                  <span className="text-xs block uppercase tracking-wider text-slate-400 font-bold mb-1">Topology State</span>
                  <span className={`text-sm md:text-base font-extrabold ${isHealing ? 'text-amber-400 drop-amber' : isAttacked ? 'text-rose-400 drop-rose' : 'text-emerald-400 drop-emerald'}`}>
                    {isHealing ? 'REMEDIATING...' : isAttacked ? 'CASCADE FAILURE' : 'NOMINAL'}
                  </span>
                </div>
                <Activity className={`w-6 h-6 animate-pulseGlow ${isHealing ? 'text-amber-400' : isAttacked ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>

              <div className={`border rounded-lg p-4.5 flex justify-between items-center shadow-sm transition-colors duration-200 ${
                isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
              }`}>
                <div>
                  <span className="text-xs block uppercase tracking-wider text-slate-400 font-bold mb-1">Monte Carlo Scans ({simulationCount})</span>
                  <span className={`text-sm md:text-base font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{totalAnomaliesDetected.toLocaleString()} Flags</span>
                </div>
                <ShieldAlert className="w-6 h-6 text-slate-400" />
              </div>

              <div className={`border rounded-lg p-4.5 flex justify-between items-center shadow-sm transition-colors duration-200 ${
                isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
              }`}>
                <div>
                  <span className="text-xs block uppercase tracking-wider text-slate-400 font-bold mb-1">Top Failure Vector</span>
                  <span className={`text-xs md:text-sm font-extrabold truncate max-w-[180px] block ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>{topVector.name}</span>
                </div>
                <Cpu className="w-6 h-6 text-amber-400" />
              </div>

              <div className={`border rounded-lg p-4.5 flex justify-between items-center shadow-sm transition-colors duration-200 ${
                isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
              }`}>
                <div>
                  <span className="text-xs block uppercase tracking-wider text-slate-400 font-bold mb-1">Active Nodes</span>
                  <span className={`text-sm md:text-base font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{nodes.length} Microservices</span>
                </div>
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            {/* Topology Canvas + Node Inspection Drawer */}
            <TopologyCanvas
              nodes={nodes}
              setNodes={setNodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simState={simState}
              isDarkMode={isDarkMode}
            />

            <InspectionDrawer
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              nodes={nodes}
              isDarkMode={isDarkMode}
            />

            {/* Bottom Section: Pareto Solver & Live Terminal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <PareToMatrix
                isDarkMode={isDarkMode}
                isAttacked={isAttacked}
                isHealing={isHealing}
                selectedOption={selectedOption}
                onSelectOption={setSelectedOption}
                dynamicFailureReport={dynamicFailureReport}
                onExecuteCure={handleExecuteCure}
              />

              <TerminalDrawer
                logs={logs}
                onClearLogs={handleClearLogs}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
                isDarkMode={isDarkMode}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}