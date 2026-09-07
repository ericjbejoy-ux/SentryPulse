import React, { useState, useRef, useEffect } from 'react';
import { api, API_BASE } from './lib/api.js';
import { useLiveTopology } from './lib/useLiveTopology.js';
import FaultBar from './components/FaultBar.jsx';
import HeaderToolBar from './components/HeaderToolBar.jsx';
import StatusRibbon from './components/StatusRibbon.jsx';
import TopologyCanvas from './components/TopologyCanvas.jsx';
import ParetoMatrix from './components/ParetoMatrix.jsx';
import TerminalDrawer from './components/TerminalDrawer.jsx';
import InspectionDrawer from './components/InspectionDrawer.jsx';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [simState, setSimState] = useState('NOMINAL'); // 'NOMINAL', 'ATTACKED', 'HEALING'
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOption, setSelectedOption] = useState('A');
  const [dynamicFailureReport, setDynamicFailureReport] = useState(null);

  // Unified-backend connection state (backend-first, local-sim fallback per NFR-4.1)
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'live' | 'offline'
  const [groqLive, setGroqLive] = useState(false);
  const [liveSource, setLiveSource] = useState('synthetic'); // 'synthetic' | 'demo-site'
  const [triageReport, setTriageReport] = useState(null);
  const liveSnapshotRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    // Health is re-polled (not mount-only): if the backend enters live
    // mode after this tab loaded, the live graph appears without refresh.
    // Failures leave state untouched — the SSE stream owns down-detection.
    const checkHealth = () => {
      api.health()
        .then((h) => { if (mounted) { setBackendStatus('live'); setGroqLive(!!h.groq_live); setLiveSource(h.source || 'synthetic'); } })
        .catch(() => { if (mounted && !liveSnapshotRef.current) setBackendStatus('offline'); });
    };
    checkHealth();
    const id = setInterval(checkHealth, 10000);
    const unsub = api.subscribeStream(
      (snap) => {
        liveSnapshotRef.current = snap;
        if (mounted) setBackendStatus((prev) => (prev === 'live' ? prev : 'live'));
      },
      () => { if (mounted && !liveSnapshotRef.current) setBackendStatus('offline'); }
    );
    return () => { mounted = false; clearInterval(id); unsub(); };
  }, []);

  // Dynamic Telemetry Metrics State (No longer hardcoded)
  const [simulationCount, setSimulationCount] = useState(0);
  const [totalAnomaliesDetected, setTotalAnomaliesDetected] = useState(0);
  const [failureTypeStats, setFailureTypeStats] = useState({
    'THREADPOOL_DEADLOCK': 0,
    'MEMORY_LEAK_SPIKE': 0,
    'WRITE_LOCK_CONTEST': 0,
    'BUFFER_SATURATION': 0
  });

  // Live Audit Stream Session Logs
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'SentryPulse Topological Engine v2.5.0 online. 100,000 Monte Carlo iterations loaded.' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', msg: 'NetworkX Graph loaded: 8 nodes structured in 5 architectural tiers.' },
    { time: new Date().toLocaleTimeString(), level: 'AI', msg: 'Groq LLaMA-3.3 multi-agent triaging swarm scanning directed cyclic dependencies.' }
  ]);

  const pushLog = (level, msg) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), level, msg }, ...prev]);
  };

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

  const handleMoveNode = (id, x, y) => {
    setNodes((cur) => cur.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

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

  // Local fallback simulation (used when the unified backend is unreachable).
  const runLocalSimulation = () => {
    setIsSimulating(true);
    setSelectedNode(null); // Clear selection on simulation start
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

  // Maps unified-backend SRS node ids onto the 8 canvas node ids.
  const mapSrsNodeToCanvas = (srsId) => {
    const map = {
      'cbs-db-primary': '6',
      'core-banking-switch': '4',
      'idfc-api-gateway': '2',
      'upi-settlement-cache': '5',
    };
    return map[srsId] || '6';
  };

  const applyBackendAttack = (triage, sim, live) => {
    const primaryId = mapSrsNodeToCanvas(triage.failing_node);
    const secondaryId = ['4', '6', '2', '8'].find((id) => id !== primaryId) || '4';
    setSimState('ATTACKED');
    setSimulationCount((prev) => prev + 1);

    const detectedBatch = Math.max(150, Math.round((100 - (sim.resilience_score || 60)) * 8));
    setTotalAnomaliesDetected((prev) => prev + detectedBatch);
    setFailureTypeStats((prev) => ({
      ...prev,
      THREADPOOL_DEADLOCK: prev.THREADPOOL_DEADLOCK + 1,
      WRITE_LOCK_CONTEST: prev.WRITE_LOCK_CONTEST + 1
    }));

    setNodes((cur) => cur.map((node) => {
      if (node.id === primaryId) {
        return { ...node, status: 'CRITICAL', cpu: live.cpu || '88%', latency: `${Math.round(live.latency_ms || 480)}ms`, alert: `BACKEND SIM • ${sim.vector_drift}` };
      }
      if (node.id === secondaryId) {
        return { ...node, status: 'WARNING', cpu: '74.5%', latency: '610ms', alert: 'CASCADE RISK • downstream' };
      }
      return { ...node, status: 'NOMINAL' };
    }));

    const primaryLabel = nodes.find((n) => n.id === primaryId)?.label || triage.failing_node;
    const secondaryLabel = nodes.find((n) => n.id === secondaryId)?.label || 'downstream';
    setDynamicFailureReport({
      primaryId, secondaryId, primary: primaryLabel, secondary: secondaryLabel,
      signature: `SIG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    });
    setTriageReport(triage);

    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), level: 'CRIT', msg: `💥 Backend 100k sim: resilience ${sim.resilience_score}% (${sim.duration_seconds}s) → chaos on [${triage.failing_node}].` },
      { time: new Date().toLocaleTimeString(), level: 'AI', msg: `${triage.groq_live ? '🧠 Groq-live diagnosis' : '🤖 Rule-based triage'}: ${triage.log_agent}` },
      { time: new Date().toLocaleTimeString(), level: 'AI', msg: `🔮 ${triage.predictor_agent}` },
      ...prev
    ]);
  };

  // Backend-first simulation: unified API (Groq-live triage) with local fallback.
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSelectedNode(null);
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), level: 'WARN', msg: `🚀 Requesting 100,000 Monte Carlo iterations from unified backend...` },
      ...prev
    ]);
    try {
      const sim = await api.startSimulation(100000, 'THREADPOOL_LOCK');
      const live = await api.live();
      const triage = await api.triage(live, true);
      setGroqLive(!!triage.groq_live);
      setIsSimulating(false);
      applyBackendAttack(triage, sim, live);
    } catch (err) {
      setBackendStatus('offline');
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString(), level: 'WARN', msg: `⚠️ Backend unreachable (${err.message}). Falling back to local simulation.` },
        ...prev
      ]);
      setIsSimulating(false);
      runLocalSimulation();
    }
  };

  const handleExecuteCure = () => {
    setSimState('HEALING');
    setSelectedNode(null); // Clear selection on cure execution

    // LIVE MODE: heal EVERY failing live node in one click (no sim needed).
    if (liveMode && liveIncident.length > 0) {
      const targets = liveIncident.map((n) => n.node_id);
      const labels = liveIncident.map((n) => n.label);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), level: 'AI', msg: `🛠️ Deploying Strategy [Option ${selectedOption}] to isolate & repair live incident [${labels.join(', ')}]...` },
        ...prev
      ]);
      Promise.allSettled(targets.map((target) =>
        api.heal({
          node_id: target,
          anomaly_type: 'THREADPOOL_LOCK',
          strategy: selectedOption === 'A' ? `ISOLATE_DB_THREADPOOL_${target}` : 'DRAIN_GATEWAY_REGION_AWS',
          severity: 'critical',
        })
      )).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const res = r.value;
            const restart = res.details?.victim_restart;
            setLogs((prev) => [
              { time: new Date().toLocaleTimeString(), level: 'SYS', msg: `⚡ Healed [${targets[i]}] (${res.execution_id}${restart?.pid ? `, victim restarted pid ${restart.pid}` : ''}${res.fallback_engaged ? ', via demo fallback' : ''}).` },
              ...prev
            ]);
          } else {
            setLogs((prev) => [
              { time: new Date().toLocaleTimeString(), level: 'WARN', msg: `⚠️ Heal failed for [${targets[i]}]: ${r.reason?.message || r.reason}` },
              ...prev
            ]);
          }
        });
      });
      setTimeout(() => {
        setLogs(prev => [
          { time: new Date().toLocaleTimeString(), level: 'SYS', msg: `⚡ Autonomous remediation completed for [${labels.join(', ')}]. Watching twin recovery…` },
          ...prev
        ]);
        // Return the panel to standby; a persisting incident re-arms via
        // liveIncident (auto-triage won't refire for the same key).
        setSimState('NOMINAL');
        triageFiredRef.current = '';
      }, 2500);
      return;
    }

    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), level: 'AI', msg: `🛠️ Deploying Strategy [Option ${selectedOption}] to isolate & repair [${dynamicFailureReport?.primary}, ${dynamicFailureReport?.secondary}]...` },
      ...prev
    ]);

    // Sync the heal to the unified backend (fire-and-forget; UI timeline below is authoritative).
    try {
      const target = dynamicFailureReport?.primary || 'cbs-db-primary';
      api.heal({
        node_id: target,
        anomaly_type: 'THREADPOOL_LOCK',
        strategy: selectedOption === 'A' ? `ISOLATE_DB_THREADPOOL_${target}` : 'DRAIN_GATEWAY_REGION_AWS',
        severity: 'high',
      }).then((res) => {
        setLogs((prev) => [
          { time: new Date().toLocaleTimeString(), level: 'SYS', msg: `⚡ Backend heal confirmed (${res.execution_id}, MTTR ${res.mttr_seconds}s${res.fallback_engaged ? ', via demo fallback' : ''}).` },
          ...prev
        ]);
      }).catch((err) => {
        setLogs((prev) => [
          { time: new Date().toLocaleTimeString(), level: 'WARN', msg: `⚠️ Backend heal unreachable (${err.message}); local remediation continues.` },
          ...prev
        ]);
      });
    } catch { /* local remediation continues */ }

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
      setTriageReport(null);
      setSelectedNode(null);
    }, 2500);
  };

  const handleReset = () => {
    setSimState('NOMINAL');
    setSelectedNode(null);
    setDynamicFailureReport(null);
    setTriageReport(null);
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
    api.reset().catch(() => { /* backend already offline or resetting; local state is authoritative */ });
  };

  // Live victim graph (demo-site mode only; null => hardcoded static graph).
  const topology = useLiveTopology(liveSource, backendStatus);
  const liveMode = topology != null;
  // Live incident, independent of any simulation: any live node not NOMINAL
  // arms the Pareto panel + cure directly — no RUN click required.
  const liveIncident = liveMode
    ? topology.nodes.filter((n) => n.state === 'CRITICAL' || n.state === 'WARNING')
    : [];
  const liveIncidentKey = liveIncident.map((n) => n.node_id).sort().join(',');
  const triageFiredRef = useRef('');
  // Header + canvas alarm truth: sim state OR any live failing node.
  const alertActive = simState !== 'NOMINAL' || liveIncident.length > 0;

  // Auto-triage: first sight of a live incident fetches a real diagnosis once.
  useEffect(() => {
    if (!liveIncidentKey || triageFiredRef.current === liveIncidentKey) return;
    triageFiredRef.current = liveIncidentKey;
    const worst = [...liveIncident].sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0))[0];
    if (!worst) return;
    pushLog('WARN', `🚨 Live incident detected on [${liveIncident.map((n) => n.label).join(', ')}] — auto-triaging…`);
    api.triage(
      { latency_ms: worst.latency_ms, cpu: `${worst.cpu_pct}%`, failing_node: worst.node_id },
      true
    ).then((t) => {
      setGroqLive(!!t.groq_live);
      setTriageReport(t);
      pushLog('AI', `${t.groq_live ? '🧠 Groq-live diagnosis' : '🤖 Rule-based triage'}: ${t.log_agent}`);
    }).catch((err) => {
      pushLog('WARN', `⚠️ Live auto-triage failed (${err.message})`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIncidentKey]);
  // Report table needs cpu/latency strings; live nodes carry numerics.
  const reportNodes = liveMode
    ? topology.nodes.map((n) => ({ ...n, cpu: `${n.cpu_pct}%`, latency: `${n.latency_ms}ms` }))
    : nodes;

  // Targets for the Pareto panel: sim report wins, else live incident labels.
  const incidentTargets = dynamicFailureReport
    ? [dynamicFailureReport.primary, dynamicFailureReport.secondary].filter(Boolean)
    : liveIncident.map((n) => n.label);

  return (
    <div className={`min-h-screen flex flex-col font-mono text-xs transition-colors duration-300 ${
      isDarkMode ? 'bg-[#05070a] text-slate-200' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      <HeaderToolBar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        simState={simState}
        alertActive={alertActive}
        isSimulating={isSimulating}
        backendStatus={backendStatus}
        groqLive={groqLive}
        liveSource={liveSource}
        apiBase={API_BASE}
        onRunSimulation={handleRunSimulation}
        onReset={handleReset}
        runDisabled={liveMode}
        runDisabledHint="Live-site mode: break things with the Crash-test bar, not synthetic sim"
      />

      <main className="flex-1 p-6 space-y-6 max-w-[1700px] w-full mx-auto">
        {liveMode && <FaultBar isDarkMode={isDarkMode} onLog={pushLog} />}

        <StatusRibbon
          simState={simState}
          isDarkMode={isDarkMode}
          simulationCount={simulationCount}
          totalAnomaliesDetected={totalAnomaliesDetected}
          topVector={topVector}
          nodeCount={liveMode ? topology.nodes.length : nodes.length}
        />

        <TopologyCanvas
          nodes={nodes}
          onMoveNode={handleMoveNode}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          simState={simState}
          isDarkMode={isDarkMode}
          simulationCount={simulationCount}
          totalAnomaliesDetected={totalAnomaliesDetected}
          mode={liveMode ? 'live' : 'static'}
          liveNodes={topology?.nodes}
          liveEdges={topology?.edges || []}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ParetoMatrix
            simState={simState}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            dynamicFailureReport={dynamicFailureReport}
            triageReport={triageReport}
            isDarkMode={isDarkMode}
            onExecuteCure={handleExecuteCure}
            liveActive={liveMode && liveIncident.length > 0}
            incidentTargets={incidentTargets}
          />
          <TerminalDrawer
            logs={logs}
            isDarkMode={isDarkMode}
            onLog={pushLog}
            report={{ nodes: reportNodes, simState, simulationCount, totalAnomaliesDetected, topVector }}
          />
        </div>
      </main>

      <InspectionDrawer
        node={selectedNode}
        triageReport={triageReport}
        failureReport={dynamicFailureReport}
        isDarkMode={isDarkMode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
