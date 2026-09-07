import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Search, Trash2, Save, RefreshCw } from 'lucide-react';

const LOG_LEVELS = ['ALL', 'SYS', 'INFO', 'AI', 'WARN', 'CRIT'];

const logLevelStyle = (level, dark) => {
  if (level === 'CRIT') return dark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-700 border-rose-300';
  if (level === 'WARN') return dark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-300';
  if (level === 'AI') return dark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-700 border-purple-300';
  if (level === 'SYS') return dark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-700 border-sky-300';
  return dark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-400';
};

export default function TerminalDrawer({
  logs,
  onClearLogs,
  onDownloadPdf,
  isDownloadingPdf,
  isDarkMode
}) {
  const [logFilter, setLogFilter] = useState('ALL');
  const [logQuery, setLogQuery] = useState('');
  const logBoxRef = useRef(null);

  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = 0;
  }, [logs]);

  const filteredLogs = logQuery.trim() || logFilter !== 'ALL'
    ? logs.filter(l =>
        (logFilter === 'ALL' || l.level === logFilter) &&
        (logQuery.trim() === '' ||
          l.msg.toLowerCase().includes(logQuery.toLowerCase()) ||
          l.level.toLowerCase().includes(logQuery.toLowerCase()))
      )
    : logs;

  const levelCounts = logs.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`border rounded-lg p-5 flex flex-col shadow-sm transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
    }`}>
      <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-300'}`}>
        <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2.5 ${isDarkMode ? 'text-grad' : 'text-slate-900'}`}>
          <Terminal className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400 drop-cyan' : 'text-slate-400'}`} /> Audit Log Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_2px_rgba(52,211,153,0.55)]"></span> Live
          </span>
          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            title="Export Report as PDF"
            className={`px-3.5 py-1.5 rounded-md border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer font-mono ${
              isDarkMode ? 'bg-[#0a0f1f] border-[#2a3a5c] text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)]' : 'bg-slate-200 border-slate-300 text-slate-900 hover:bg-slate-300'
            } disabled:opacity-50`}
          >
            {isDownloadingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isDownloadingPdf ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Level Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {LOG_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setLogFilter(level)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
              logFilter === level
                ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 shadow-[0_0_14px_-4px_rgba(34,211,238,0.8)]'
                : isDarkMode
                  ? 'bg-[#0a0f1f] text-slate-400 border-[#22304d] hover:text-cyan-200 hover:border-cyan-400/40'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
          >
            {level}
            {level !== 'ALL' && levelCounts[level] > 0 && (
              <span className={`ml-1 text-[10px] ${logFilter === level ? 'text-slate-800' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {levelCounts[level]}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1"></div>
        <button
          onClick={onClearLogs}
          title="Clear stream"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            isDarkMode ? 'border-[#1f2c4d] text-slate-400 hover:text-rose-300 hover:border-rose-500/40' : 'border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-400'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        <input
          type="text"
          value={logQuery}
          onChange={e => setLogQuery(e.target.value)}
          placeholder="Filter log stream…"
          className={`w-full pl-8 pr-12 py-1.5 rounded-md border text-xs font-mono outline-none transition-all ${
            isDarkMode
              ? 'bg-[#050816] border-[#22304d] text-slate-200 placeholder-slate-500 focus:border-cyan-400/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]'
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
          }`}
        />
        {logQuery && (
          <button
            onClick={() => setLogQuery('')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 rounded cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            CLEAR
          </button>
        )}
      </div>

      <div ref={logBoxRef} className={`relative flex-1 border rounded-md p-3.5 font-mono text-xs space-y-2.5 overflow-y-auto max-h-[240px] crt-overlay ${
        isDarkMode ? 'bg-[#040714] border-[#182236] text-slate-200 shadow-[inset_0_0_40px_rgba(34,211,238,0.04)]' : 'bg-[#fafbfc] border-slate-300 text-slate-800'
      }`}>
        {isDarkMode && (
          <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/[0.04] to-transparent animate-scanline"></div>
        )}
        {filteredLogs.length === 0 ? (
          <div className={`text-[11px] py-4 text-center italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            No log entries match the current filter.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={`${log.time}-${idx}`} className="flex gap-2.5 items-start leading-relaxed">
              <span className="text-slate-400 shrink-0 font-bold">[{log.time}]</span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold shrink-0 font-mono border ${logLevelStyle(log.level, isDarkMode)}`}>
                {log.level}
              </span>
              <span className={`break-all font-medium ${log.level === 'CRIT' && !isDarkMode ? 'text-rose-700' : ''}`}>{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}