import React, { useState } from 'react';
import { 
  Activity, ShieldAlert, Cpu, HardDrive, Clock, 
  TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, BarChart2,
  Terminal, Zap, ShieldCheck, AlertCircle
} from 'lucide-react';

export default function TelemetryAnalyticsView({
  isLight,
  incidents = [],
  logs = [],
  simulationCount = 0,
  totalAnomaliesDetected = 0
}) {
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Expanded dataset with full triage lifecycle metrics (Unresolved, AI Solved, Pending)
  const rangeData = {
    '24h': {
      p99Latency: '48.2ms',
      latencyDelta: '-4.2% vs yesterday',
      errorRate: '0.014%',
      errorDelta: '-0.003%',
      monteCarloRuns: '14,280',
      mitigationRate: '99.98%',
      throughput: '42.8k req/s',
      chartBars: [35, 42, 38, 55, 68, 85, 45, 30, 40, 50, 62, 75],
      breakdown: [
        { vector: 'Threadpool Deadlock Contention', count: 4, pct: '45%' },
        { vector: 'Redis Pipeline Buffer Saturation', count: 3, pct: '30%' },
        { vector: 'Postgres Write-Lock Exhaustion', count: 2, pct: '25%' }
      ],
      triageStatus: {
        unresolved: 1,
        aiSolved: 14,
        pendingManual: 2
      },
      activeProblems: [
        { id: 'ANOM-402', service: 'kafka-ingest-consumer', issue: 'Consumer group offset lag exceeding 45,000 messages', severity: 'High', status: 'Triaging via LLaMA-3' }
      ],
      aiResolvedProblems: [
        { id: 'SOL-891', service: 'kong-api-gateway', action: 'Dynamically recycled worker threadpool and flushed stale keepalives', mttr: '1.2s' },
        { id: 'SOL-890', service: 'postgres-cbs-primary', action: 'Killed idle-in-transaction connection holding exclusive write lock', mttr: '850ms' },
        { id: 'SOL-889', service: 'redis-cluster-cache', action: 'Evicted LRU keyspace to drop memory pressure below 85% threshold', mttr: '420ms' }
      ],
      pendingProblems: [
        { id: 'PEN-104', service: 'vault-secrets-broker', issue: 'Certificate rotation handshake latency spike on secondary node', assignee: 'SecOps On-Call' },
        { id: 'PEN-105', service: 'scikit-inference-worker', issue: 'Vector dimension mismatch warning during batch matrix embedding', assignee: 'ML Platform Lead' }
      ],
      recentIncidents: [
        { id: 'INC-8921', service: 'kong-api-gateway', vector: 'Threadpool Exhaustion', duration: '42s', status: 'Mitigated' },
        { id: 'INC-8920', service: 'postgres-cbs-primary', vector: 'Write Lock Contention', duration: '18s', status: 'Mitigated' },
        { id: 'INC-8919', service: 'redis-cluster-cache', vector: 'Pipeline Buffer Overflow', duration: '12s', status: 'Mitigated' },
        { id: 'INC-8918', service: 'scikit-isolation-worker', vector: 'Memory Spike OOM Warning', duration: '24s', status: 'Mitigated' }
      ]
    },
    '7d': {
      p99Latency: '52.6ms',
      latencyDelta: '-1.8% vs last week',
      errorRate: '0.021%',
      errorDelta: '+0.002%',
      monteCarloRuns: '104,500',
      mitigationRate: '99.91%',
      throughput: '40.2k req/s',
      chartBars: [60, 55, 70, 82, 45, 50, 65, 78, 88, 92, 70, 60],
      breakdown: [
        { vector: 'Threadpool Deadlock Contention', count: 28, pct: '52%' },
        { vector: 'Redis Pipeline Buffer Saturation', count: 18, pct: '31%' },
        { vector: 'Postgres Write-Lock Exhaustion', count: 9, pct: '17%' }
      ],
      triageStatus: {
        unresolved: 3,
        aiSolved: 84,
        pendingManual: 5
      },
      activeProblems: [
        { id: 'ANOM-401', service: 'core-banking-switch', issue: 'Connection pool exhaustion during peak settlement window', severity: 'Critical', status: 'NetworkX Isulating Node' },
        { id: 'ANOM-398', service: 'auth-service-v2', issue: 'JWT signature verification latency regression (+35ms)', severity: 'Medium', status: 'Awaiting Code Patch' },
        { id: 'ANOM-395', service: 'ingress-nginx-lb', issue: 'Upstream SSL handshake timeout bursts in Region US-East', severity: 'High', status: 'Traffic Rerouted' }
      ],
      aiResolvedProblems: [
        { id: 'SOL-850', service: 'kafka-async-broker', action: 'Auto-scaled consumer container replicas from 4 to 12', mttr: '3.4s' },
        { id: 'SOL-845', service: 'vault-auth-service', action: 'Purged corrupted token bucket cache and re-synced quorum', mttr: '1.9s' },
        { id: 'SOL-840', service: 'redis-cluster-cache', action: 'Triggered defragmentation sweep on active memory segments', mttr: '2.1s' }
      ],
      pendingProblems: [
        { id: 'PEN-098', service: 'billing-ledger-db', issue: 'Schema migration deadlock warning on foreign key indices', assignee: 'DBA Team' },
        { id: 'PEN-099', service: 'notification-worker', issue: 'SMTP rate-limit threshold approaching 90% quota', assignee: 'SRE On-Call' },
        { id: 'PEN-100', service: 'api-gateway', issue: 'Deprecated TLS 1.1 handshake attempts detected from external client', assignee: 'Security Team' }
      ],
      recentIncidents: [
        { id: 'INC-8915', service: 'kafka-async-broker', vector: 'Consumer Lag Spike', duration: '3m 12s', status: 'Resolved' },
        { id: 'INC-8902', service: 'vault-auth-service', vector: 'Token Bucket Saturation', duration: '1m 05s', status: 'Mitigated' },
        { id: 'INC-8890', service: 'core-banking-switch', vector: 'Deadlock Cascading Failure', duration: '4m 30s', status: 'Resolved' },
        { id: 'INC-8875', service: 'kong-api-gateway', vector: 'DNS Resolver Timeout', duration: '45s', status: 'Resolved' }
      ]
    },
    '30d': {
      p99Latency: '59.1ms',
      latencyDelta: '+2.4% vs last month',
      errorRate: '0.035%',
      errorDelta: '+0.008%',
      monteCarloRuns: '480,200',
      mitigationRate: '99.84%',
      throughput: '38.9k req/s',
      chartBars: [45, 60, 75, 85, 90, 65, 50, 55, 70, 80, 85, 95],
      breakdown: [
        { vector: 'Threadpool Deadlock Contention', count: 112, pct: '48%' },
        { vector: 'Redis Pipeline Buffer Saturation', count: 84, pct: '36%' },
        { vector: 'Postgres Write-Lock Exhaustion', count: 37, pct: '16%' }
      ],
      triageStatus: {
        unresolved: 5,
        aiSolved: 342,
        pendingManual: 12
      },
      activeProblems: [
        { id: 'ANOM-350', service: 'analytics-warehouse', issue: 'Long-running OLAP queries causing disk I/O saturation', severity: 'High', status: 'Query Killed by Guardrail' },
        { id: 'ANOM-342', service: 'user-service-db', issue: 'Replication lag spike on standby read-replica node 3', severity: 'Medium', status: 'Rebuilding Replica' },
        { id: 'ANOM-330', service: 'mesh-control-plane', issue: 'Envoy sidecar memory footprint creeping past 512MB limit', severity: 'Medium', status: 'Scheduled Restart' },
        { id: 'ANOM-321', service: 'payment-gateway-adapter', issue: 'Socket hangup exceptions during third-party webhook dispatch', severity: 'High', status: 'Circuit Breaker Open' },
        { id: 'ANOM-315', service: 'cdn-edge-router', issue: 'Cache purge propagation delay across edge POPs', severity: 'Low', status: 'Purging Manually' }
      ],
      aiResolvedProblems: [
        { id: 'SOL-790', service: 'core-banking-switch', action: 'Automatically re-routed transaction traffic around faulty node via NetworkX', mttr: '4.8s' },
        { id: 'SOL-782', service: 'kong-api-gateway', action: 'Applied rate-limiting policy to offending client IP subnet', mttr: '1.1s' },
        { id: 'SOL-775', service: 'scikit-inference-worker', action: 'Restarted unresponsive worker container via Docker socket API', mttr: '2.5s' }
      ],
      pendingProblems: [
        { id: 'PEN-085', service: 'auth-service', issue: 'OAuth client secret expiration audit compliance check', assignee: 'Identity Team' },
        { id: 'PEN-086', service: 'logging-aggregator', issue: 'Elasticsearch index shard allocation unassigned warning', assignee: 'Data Platform' },
        { id: 'PEN-087', service: 'k8s-cluster-nodes', issue: 'Kernel patch required for CVE vulnerability on node pool B', assignee: 'Infrastructure' }
      ],
      recentIncidents: [
        { id: 'INC-8840', service: 'core-banking-switch', vector: 'Cascading Thread Starvation', duration: '5m 40s', status: 'Resolved' },
        { id: 'INC-8812', service: 'kong-api-gateway', vector: 'Memory Leak Spike', duration: '2m 15s', status: 'Resolved' },
        { id: 'INC-8790', service: 'payment-gateway-adapter', vector: 'Timeout Burst', duration: '3m 10s', status: 'Resolved' },
        { id: 'INC-8750', service: 'user-service-db', vector: 'Connection Pool Saturation', duration: '1m 45s', status: 'Resolved' }
      ]
    },
    '90d': {
      p99Latency: '63.4ms',
      latencyDelta: '+5.1% vs Q1 baseline',
      errorRate: '0.042%',
      errorDelta: '+0.012%',
      monteCarloRuns: '1,420,000',
      mitigationRate: '99.79%',
      throughput: '37.5k req/s',
      chartBars: [80, 70, 85, 90, 60, 50, 75, 85, 95, 88, 92, 98],
      breakdown: [
        { vector: 'Threadpool Deadlock Contention', count: 340, pct: '50%' },
        { vector: 'Redis Pipeline Buffer Saturation', count: 220, pct: '32%' },
        { vector: 'Postgres Write-Lock Exhaustion', count: 124, pct: '18%' }
      ],
      triageStatus: {
        unresolved: 8,
        aiSolved: 1150,
        pendingManual: 24
      },
      activeProblems: [
        { id: 'ANOM-290', service: 'legacy-cbs-bridge', issue: 'Protocol serialization overhead causing CPU throttling', severity: 'High', status: 'Refactoring Scheduled' },
        { id: 'ANOM-281', service: 'kafka-cluster', issue: 'Zookeeper quorum election timeout during network partition simulation', severity: 'Critical', status: 'Migrated to KRaft' },
        { id: 'ANOM-275', service: 'auth-service', issue: 'Session store memory fragmentation exceeding 40%', severity: 'Medium', status: 'Scheduled Maintenance' },
        { id: 'ANOM-260', service: 'api-gateway', issue: 'SSL certificate chain validation warning on custom enterprise domain', severity: 'Medium', status: 'Pending Cert Renewal' },
        { id: 'ANOM-255', service: 'database-primary', issue: 'WAL archiver backlog accumulation on cloud storage bucket', severity: 'High', status: 'Bandwidth Throttled' },
        { id: 'ANOM-240', service: 'monitoring-stack', issue: 'Prometheus TSDB block compaction bottleneck', severity: 'Low', status: 'Optimizing Retention' }
      ],
      aiResolvedProblems: [
        { id: 'SOL-610', service: 'postgres-cbs-primary', action: 'Auto-tuned shared_buffers and work_mem based on query pattern analysis', mttr: '12.4s' },
        { id: 'SOL-595', service: 'kong-api-gateway', action: 'Automatically blacklisted abusive crawler IP range using Groq heuristic', mttr: '850ms' },
        { id: 'SOL-580', service: 'redis-cluster-cache', action: 'Scaled up cluster memory tier via cloud API integration', mttr: '15.2s' }
      ],
      pendingProblems: [
        { id: 'PEN-050', service: 'security-compliance', issue: 'SOC2 annual log retention verification sign-off pending', assignee: 'Compliance Lead' },
        { id: 'PEN-051', service: 'network-topology', issue: 'Redundant fiber link failover drill scheduled for weekend', assignee: 'NetOps Team' },
        { id: 'PEN-052', service: 'iam-service', issue: 'Service account privilege review for Q3 deployment cycle', assignee: 'Security Team' }
      ],
      recentIncidents: [
        { id: 'INC-8520', service: 'postgres-cbs-primary', vector: 'IOPS Saturation', duration: '8m 10s', status: 'Resolved' },
        { id: 'INC-8402', service: 'scikit-isolation-worker', vector: 'OOM Killer Invocation', duration: '1m 50s', status: 'Resolved' },
        { id: 'INC-8310', service: 'kafka-cluster', vector: 'Broker Partition Disconnect', duration: '6m 20s', status: 'Resolved' },
        { id: 'INC-8200', service: 'legacy-cbs-bridge', vector: 'CPU Throttling Spike', duration: '11m 05s', status: 'Resolved' }
      ]
    }
  };

  const activeData = rangeData[timeRange];
  const slaPct = parseFloat(activeData.mitigationRate) || 99.9;
  const n = activeData.chartBars.length;
  const linePoints = activeData.chartBars.map((v, i) => `${(i / (n - 1)) * 100},${100 - v}`).join(' ');
  const areaPoints = `0,100 ${linePoints} 100,100`;
  const sevCounts = activeData.activeProblems.reduce((acc, p) => {
    acc[p.severity] = (acc[p.severity] || 0) + 1;
    return acc;
  }, {});
  const sevColor = (s) =>
    s === 'Critical' ? 'bg-rose-500' : s === 'High' ? 'bg-amber-500' : s === 'Medium' ? 'bg-cyan-500' : 'bg-slate-500';

  // Live integration — War Room incidents & audit feed merged into the analytics window
  const liveArised = incidents.filter(i => i.category === 'arised');
  const liveSolved = incidents.filter(i => i.category === 'solved-ai');
  const livePending = incidents.filter(i => i.category === 'pending');

  const mergedActive = [
    ...liveArised.map(i => ({
      id: i.id,
      service: i.service,
      issue: `${i.vector} — ${i.description.slice(0, 80)}${i.description.length > 80 ? '…' : ''}`,
      severity: i.severity,
      status: 'Isolating via LLaMA-3'
    })),
    ...activeData.activeProblems
  ];

  const mergedResolved = [
    ...liveSolved.map(i => ({ id: i.id, service: i.service, action: i.actionTaken, mttr: i.mttr || '—' })),
    ...activeData.aiResolvedProblems
  ];

  const mergedPending = [
    ...livePending.map(i => ({
      id: i.id,
      service: i.service,
      issue: `${i.vector} — escalated for manual review`,
      assignee: i.assignee || 'Engineering Review'
    })),
    ...activeData.pendingProblems
  ];

  const liveFlags = simulationCount > 0
    ? `${simulationCount} live run${simulationCount > 1 ? 's' : ''} · ${totalAnomaliesDetected.toLocaleString()} anomalies flagged this session`
    : 'No simulation run yet this session';

  // Mirror the latest audit-stream entries into the historical incident log
  const liveIncidentLines = (simulationCount > 0 ? logs : []).slice(0, 3).map((lg, idx) => ({
    id: `LIVE-${idx}`,
    service: lg.level,
    vector: lg.msg.length > 48 ? `${lg.msg.slice(0, 48)}…` : lg.msg,
    duration: lg.time,
    status: lg.level === 'CRIT' ? 'Mitigated' : lg.level === 'WARN' ? 'Escalated' : 'Resolved'
  }));
  const mergedIncidents = [...liveIncidentLines, ...activeData.recentIncidents];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      
      {/* Sub-Header & Horizon Controls */}
      <div className={`border rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0f1f] border-[#1f2c4d] text-slate-200'
      }`}>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className={`w-4 h-4 ${isLight ? 'text-cyan-500' : 'text-cyan-400 drop-cyan'}`} /> <span className={isLight ? '' : 'text-grad'}>Deep Telemetry & Vector Analytics</span>
          </h2>
<p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Aggregated metrics from NetworkX digital twin telemetry and Groq inference audit trails.
              <span className="text-cyan-400 font-semibold"> {liveFlags}</span>
            </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Horizon Selector */}
          <div className={`flex rounded border p-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 font-bold shadow-[0_0_12px_-3px_rgba(34,211,238,0.7)]'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            title="Flush Telemetry Cache"
            className={`p-2.5 rounded border transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-[#0a0f1f] border-[#22304d] hover:border-cyan-400/50 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)] text-slate-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Metric Cards (Dynamic based on selected time horizon) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border rounded-lg p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>P99 Request Latency</span>
            <Clock className={`w-4 h-4 ${isLight ? 'text-cyan-500' : 'text-cyan-400 drop-cyan'}`} />
          </div>
          <div className="text-xl font-bold tracking-tight">{activeData.p99Latency}</div>
          <div className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 rotate-180" /> {activeData.latencyDelta}
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>System Error Rate</span>
            <ShieldAlert className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400 drop-amber'}`} />
          </div>
          <div className="text-xl font-bold tracking-tight">{activeData.errorRate}</div>
          <div className="text-xs text-slate-400 mt-1.5">
            Delta: <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{activeData.errorDelta}</span>
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monte Carlo Vectors</span>
            <Cpu className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-purple-400 drop-violet'}`} />
          </div>
          <div className="text-xl font-bold tracking-tight">
            {simulationCount > 0 ? `${simulationCount} Live Run${simulationCount > 1 ? 's' : ''}` : activeData.monteCarloRuns}
          </div>
          <div className="text-xs text-purple-400 mt-1.5">
            {simulationCount > 0 ? `${totalAnomaliesDetected.toLocaleString()} anomalies flagged` : 'Simulated perturbations'}
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Auto-Mitigation SLA</span>
            <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-500' : 'text-emerald-400 drop-emerald'}`} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className={`text-xl font-bold tracking-tight ${isLight ? '' : 'text-grad'}`}>{activeData.mitigationRate}</div>
              <div className="text-xs text-emerald-400 mt-1.5">Zero manual intervention</div>
            </div>
            <svg viewBox="0 0 80 80" className={`w-20 h-20 shrink-0 ${isLight ? '' : '[filter:drop-shadow(0_0_6px_rgba(52,211,153,0.6))]'}`}>
              <circle cx="40" cy="40" r="32" fill="none" strokeWidth="8" stroke={isLight ? "#d1d5db" : "#1e293b"} />
              <circle
                cx="40" cy="40" r="32" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke="#10b981"
                strokeDasharray={`${(slaPct / 100) * (2 * Math.PI * 32)} ${2 * Math.PI * 32}`}
                transform="rotate(-90 40 40)"
              />
            </svg>
          </div>
        </div>

      </div>

      {/* Autonomous AI Problem Triaging & Resolution Dashboard */}
      <div className={`border rounded-lg p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-3 border-b gap-3 ${isLight ? 'border-slate-100' : 'border-[#1f2c4d]/80'}`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isLight ? 'text-cyan-500' : 'text-cyan-400 drop-cyan'}`} /> <span className={isLight ? '' : 'text-grad'}>Autonomous AI Triage Matrix ({timeRange})</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Real-time lifecycle tracking of detected anomalies, automated agent remediations, and pending escalations.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shadow-[0_0_14px_-6px_rgba(251,191,36,0.7)]">
                {activeData.triageStatus.unresolved} Active
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-[0_0_14px_-6px_rgba(52,211,153,0.7)]">
                {activeData.triageStatus.aiSolved} AI Resolved
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold shadow-[0_0_14px_-6px_rgba(167,139,250,0.7)]">
                {activeData.triageStatus.pendingManual} Pending
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {['Critical', 'High', 'Medium', 'Low'].filter(s => sevCounts[s]).map(s => (
                <span key={s} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>
                  <span className={`w-2 h-2 rounded-full ${sevColor(s)}`}></span>
                  {s} · {sevCounts[s]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Column Problem Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column 1: Problems Arised (Unresolved / Active) */}
          <div className={`border rounded-lg p-4 flex flex-col ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/10 border-amber-400/25'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Unresolved Anomalies ({mergedActive.length})
              </h4>
              <span className="text-[10px] text-amber-400/80">Action Required</span>
            </div>

            <div className="space-y-3 flex-1">
              {mergedActive.map((prob, idx) => (
                <div key={idx} className={`p-3 rounded border text-xs space-y-1.5 ${isLight ? 'bg-white border-amber-200' : 'bg-[#070b17] border-amber-400/25'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-400">{prob.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                      {prob.severity}
                    </span>
                  </div>
                  <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{prob.service}</div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{prob.issue}</p>
                  <div className="pt-1 border-t border-slate-700/30 flex justify-between text-[10px] text-slate-400">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">{prob.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Problems Solved by AI */}
          <div className={`border rounded-lg p-4 flex flex-col ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/25'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> AI Resolved ({mergedResolved.length})
              </h4>
              <span className="text-[10px] text-emerald-400/80">Autonomous SLA</span>
            </div>

            <div className="space-y-3 flex-1">
              {mergedResolved.map((sol, idx) => (
                <div key={idx} className={`p-3 rounded border text-xs space-y-1.5 ${isLight ? 'bg-white border-emerald-200' : 'bg-[#070b17] border-emerald-400/25'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-400">{sol.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      MTTR: {sol.mttr}
                    </span>
                  </div>
                  <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{sol.service}</div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{sol.action}</p>
                  <div className="pt-1 border-t border-slate-700/30 flex justify-between text-[10px] text-slate-400">
                    <span>Agent:</span>
                    <span className="text-emerald-400 font-semibold">Groq LLaMA-3 Swarm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Problems Yet to be Solved (Pending / Escalated) */}
          <div className={`border rounded-lg p-4 flex flex-col ${isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-500/10 border-purple-400/25'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Pending / Escalated ({mergedPending.length})
              </h4>
              <span className="text-[10px] text-purple-400/80">Queued</span>
            </div>

            <div className="space-y-3 flex-1">
              {mergedPending.map((pen, idx) => (
                <div key={idx} className={`p-3 rounded border text-xs space-y-1.5 ${isLight ? 'bg-white border-purple-200' : 'bg-[#070b17] border-purple-400/25'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-400">{pen.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                      Queued
                    </span>
                  </div>
                  <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{pen.service}</div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{pen.issue}</p>
                  <div className="pt-1 border-t border-slate-700/30 flex justify-between text-[10px] text-slate-400">
                    <span>Assignee:</span>
                    <span className="text-purple-400 font-semibold">{pen.assignee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main Graph & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Simulated Throughput & Latency Distribution Histogram */}
        <div className={`lg:col-span-2 border rounded-lg p-5 flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'
        }`}>
          <div>
            <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isLight ? 'border-slate-100' : 'border-[#1f2c4d]/80'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className={`w-4 h-4 ${isLight ? 'text-cyan-500' : 'text-cyan-400 drop-cyan'}`} /> Ingress Load Distribution ({timeRange})
              </h3>
              <span className={`text-xs px-2.5 py-1 rounded ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#0a0f1f] text-slate-400 border border-[#22304d]'}`}>
                Throughput: {activeData.throughput}
              </span>
            </div>

            {/* Simulated Bar Chart Visualizer */}
            <div className="relative">
              <div className="h-52 flex items-end gap-2.5 pt-6 pb-2 px-2 border-b border-dashed border-[#2a3a5c]/50">
                {activeData.chartBars.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500/70 to-cyan-400/20 hover:from-cyan-400/90 hover:to-cyan-300/40 rounded-t transition-all duration-300 relative group-hover:shadow-[0_0_18px_rgba(6,182,212,0.6)]"
                      style={{ height: `${val}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-cyan-300 text-[10px] px-2 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20 border border-slate-700 font-bold">
                        {val * 420} req/s
                      </div>
                    </div>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>T-{12 - idx}h</span>
                  </div>
                ))}
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="loadArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#loadArea)" />
                <polyline
                  points={linePoints}
                  fill="none" stroke="#22d3ee" strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
                  strokeDasharray="3 2" opacity="0.9"
                />
              </svg>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center text-xs">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Sample Window: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>Full Mesh Synchronized</strong></span>
            <span className="text-cyan-400 font-bold">Sampling Rate: 1,000 Hz</span>
          </div>
        </div>

        {/* Failure Vector Breakdown */}
        <div className={`border rounded-lg p-5 flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'
        }`}>
          <div>
            <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isLight ? 'border-slate-100' : 'border-[#1f2c4d]/80'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400 drop-amber'}`} /> Vector Breakdown
              </h3>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Top Occurrences</span>
            </div>

            <div className="space-y-4">
              {activeData.breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{item.vector}</span>
                    <span className="font-bold text-cyan-400">{item.count} ({item.pct})</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#0a0f1f] border border-[#22304d]'}`}>
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: item.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t text-xs flex justify-between items-center ${isLight ? 'border-slate-100 text-slate-500' : 'border-[#1f2c4d]/80 text-slate-400'}`}>
            <span>AI Classification Accuracy</span>
            <span className="text-emerald-400 font-bold">99.4%</span>
          </div>
        </div>

      </div>

      {/* Fully Populated Historical Incident Audit Log */}
      <div className={`border rounded-lg p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
        <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isLight ? 'border-slate-100' : 'border-[#1f2c4d]/80'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <HardDrive className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-purple-400 drop-violet'}`} /> Historical Incident Audit Log ({timeRange})
          </h3>
<span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Showing all {mergedIncidents.length} verified topological records for this window
            </span>
        </div>

        <div className="space-y-2.5">
          {mergedIncidents.map((inc, i) => (
            <div key={i} className={`p-3 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070b17] border-[#1f2c4d]/80'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold">
                  {inc.id}
                </span>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{inc.service}</div>
                  <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Vector: {inc.vector}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>MTTR: <strong className={isLight ? 'text-slate-700' : 'text-slate-300'}>{inc.duration}</strong></span>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {inc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}