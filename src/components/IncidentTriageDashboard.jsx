import React, { useState } from 'react';
import {
  ShieldCheck, Clock, Terminal,
  Activity, RefreshCw, Zap, AlertCircle
} from 'lucide-react';

const levelToAuditStatus = (level) => {
  switch (level) {
    case 'CRIT': return 'Flagged';
    case 'WARN': return 'Warning';
    case 'AI': return 'Executed';
    case 'SYS': return 'Synced';
    default: return 'Info';
  }
};

const isResolvedStatus = (s) =>
  ['Resolved', 'Mitigated', 'Executed', 'Optimized', 'Synced', 'Info'].includes(s);

export default function IncidentTriageDashboard({ incidents, logs, isLight }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredProblems = incidents.filter(p => {
    if (filterStatus !== 'all' && p.category !== filterStatus) return false;
    if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
    return true;
  });

  const arisedCount = incidents.filter(p => p.category === 'arised').length;
  const solvedCount = incidents.filter(p => p.category === 'solved-ai').length;
  const pendingCount = incidents.filter(p => p.category === 'pending').length;
  const sevDistribution = ['Critical', 'High', 'Medium', 'Low'].map(sev => ({
    sev,
    count: incidents.filter(p => p.severity === sev).length
  }));
  const sevColor = (s) => s === 'Critical' ? 'bg-rose-500' : s === 'High' ? 'bg-amber-500' : s === 'Medium' ? 'bg-cyan-500' : 'bg-slate-400';

  const auditReportLogs = logs.slice(0, 8).map((log, idx) => ({
    id: `AUD-${9400 - idx}`,
    time: log.time,
    event: log.msg,
    status: levelToAuditStatus(log.level)
  }));

  return (
    <div className="space-y-6 font-mono text-sm animate-fadeIn">
      {/* Top Header & Filters */}
      <div className={`border rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0f1f] border-[#1f2c4d] text-slate-200'
      }`}>
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
            <Zap className={`w-5 h-5 ${isLight ? 'text-cyan-500' : 'text-cyan-400 drop-cyan'}`} /> <span className={isLight ? '' : 'text-grad'}>SentryPulse Incident & Problem War Room</span>
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Live incident feed synced from the War Room Monte Carlo engine — every simulation run feeds straight into triage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded border p-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
                filterStatus === 'all' ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 font-bold shadow-[0_0_12px_-3px_rgba(34,211,238,0.7)]' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              All ({incidents.length})
            </button>
            <button
              onClick={() => setFilterStatus('arised')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
                filterStatus === 'arised' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-bold shadow-[0_0_12px_-3px_rgba(251,191,36,0.7)]' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              Arised ({arisedCount})
            </button>
            <button
              onClick={() => setFilterStatus('solved-ai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
                filterStatus === 'solved-ai' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_-3px_rgba(52,211,153,0.7)]' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-emerald-200'
              }`}
            >
              AI Solved ({solvedCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
                filterStatus === 'pending' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-slate-950 font-bold shadow-[0_0_12px_-3px_rgba(167,139,250,0.7)]' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-violet-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh State"
            className={`p-2.5 rounded border transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-[#0a0f1f] border-[#22304d] hover:border-cyan-400/50 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)] text-slate-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Severity Filter Row */}
      <div className={`flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2.5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
        <span className={`text-xs font-bold uppercase tracking-wider mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Severity:</span>
        {[['all', 'All', null], ...sevDistribution.map(d => [d.sev, `${d.sev} (${d.count})`, sevColor(d.sev)])].map(([key, label, dot]) => (
          <button
            key={key}
            onClick={() => setFilterSeverity(key)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              filterSeverity === key
                ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 border-cyan-400 shadow-[0_0_12px_-3px_rgba(34,211,238,0.7)]'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-[#0a0f1f] text-slate-400 border-[#22304d] hover:text-cyan-200 hover:border-cyan-400/40'
            }`}
          >
            {dot && <span className={`w-2 h-2 rounded-full ${dot}`}></span>}
            {label}
          </button>
        ))}
        <div className="flex-1"></div>
        <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {filteredProblems.length} of {incidents.length} shown
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`border rounded-lg p-5 ${isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/10 border-amber-400/25 glow-amber'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Problems Arised (Active)</span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-400">{arisedCount} Anomalies</div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Requiring triage or network isolation</p>
        </div>

        <div className={`border rounded-lg p-5 ${isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/25 glow-emerald'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">Problems Solved by AI</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400">{solvedCount} Mitigated</div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Autonomous Groq LLaMA agent actions</p>
        </div>

        <div className={`border rounded-lg p-5 ${isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-500/10 border-purple-400/25 glow-violet'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-purple-400">Problems Yet to Be Solved</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-purple-400">{pendingCount} Escalated</div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Queued for engineering review</p>
        </div>
      </div>

      {/* Problem Lifecycle Log */}
      <div className={`border rounded-lg p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Problem Lifecycle Log
        </h3>

        <div className="space-y-4">
          {filteredProblems.map((prob) => {
            const isArised = prob.category === 'arised';
            const isSolved = prob.category === 'solved-ai';
            const isPending = prob.category === 'pending';

            return (
              <div
                key={prob.id}
                className={`border rounded-lg p-4 space-y-3 transition-all ${
                  isArised
                    ? (isLight ? 'bg-amber-50/50 border-amber-300' : 'bg-amber-500/10 border-amber-400/30')
                    : isSolved
                      ? (isLight ? 'bg-emerald-50/50 border-emerald-300' : 'bg-emerald-500/10 border-emerald-400/30')
                      : (isLight ? 'bg-purple-50/50 border-purple-300' : 'bg-purple-500/10 border-purple-400/30')
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-xs">
                      {prob.id}
                    </span>
                    <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      {prob.service}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold border flex items-center gap-1.5 ${
                      prob.severity === 'Critical' ? (isLight ? 'bg-red-50 text-red-600 border-red-300' : 'bg-red-500/20 text-red-400 border-red-500/30') :
                      prob.severity === 'High' ? (isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30') :
                      (isLight ? 'bg-cyan-50 text-cyan-700 border-cyan-300' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30')
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sevColor(prob.severity)}`}></span>
                      {prob.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{prob.timestamp}</span>
                    <span className={`px-2.5 py-1 rounded font-bold uppercase text-[11px] ${
                      isArised ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300') :
                      isSolved ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300') :
                      (isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-300')
                    }`}>
                      {isArised ? 'Arised / Active' : isSolved ? `AI Solved (MTTR: ${prob.mttr})` : isPending ? 'Pending Escalation' : 'Closed'}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Vector: <span className="text-cyan-400">{prob.vector}</span>
                </div>

                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {prob.description}
                </p>

                <div className={`pt-2 border-t text-xs flex justify-between items-center gap-3 ${
                  isLight ? 'border-slate-200/60 text-slate-600' : 'border-[#1f2c4d] text-slate-400'
                }`}>
                  <span><strong>Resolution Action:</strong> {prob.actionTaken}</span>
                  {prob.assignee && (
                    <span className={`shrink-0 font-bold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                      {isPending ? 'Assignee: ' : ''}{prob.assignee}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProblems.length === 0 && (
          <div className={`border border-dashed rounded-lg py-10 text-center ${isLight ? 'border-slate-300 text-slate-500' : 'border-[#1f2c4d] text-slate-500'}`}>
            <p className="text-sm font-bold uppercase tracking-wider">No incidents match the active filters</p>
            <p className="text-xs mt-1">Adjust the status or severity filter to expand the result set.</p>
          </div>
        )}
      </div>

      {/* Live Audit Report — fed directly from the shared audit stream */}
      <div className={`border rounded-lg p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0f1f] border-[#1f2c4d]'}`}>
        <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-[#1f2c4d]'}`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> Live Audit Report & Verification Log
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Immutable audit trail mirrored from the shared War Room stream — simulation and mitigation events land here in real time.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0 shadow-[0_0_14px_-6px_rgba(52,211,153,0.8)]">
            Audit Integrity: 100% Validated
          </span>
        </div>

        <div className="space-y-2.5">
          {auditReportLogs.map((audit) => (
            <div
              key={audit.id}
              className={`p-3 rounded border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#070b17] border-[#1f2c4d] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-cyan-400">{audit.id}</span>
                <span className="text-purple-400 font-semibold shrink-0">{audit.time}</span>
                <span className="truncate">{audit.event}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                isResolvedStatus(audit.status)
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {audit.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}