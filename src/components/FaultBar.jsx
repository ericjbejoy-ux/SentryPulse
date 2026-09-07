import React, { useEffect, useState } from 'react';
import { Biohazard, Skull, RotateCcw, Eraser } from 'lucide-react';
import { api } from '../lib/api.js';

/**
 * In-UI crash-test controls (demo-site mode only). Proxies through the
 * SentryPulse backend (:8000) — the browser never touches victim ports.
 * Every action is echoed to the audit terminal via onLog AND shown inline,
 * so a button can never silently fail. A pre-flight probe on mount tells
 * you exactly what's missing (backend live but victim down, etc.).
 */
const TARGETS = [
  { id: 'gateway', label: 'gateway :8001' },
  { id: 'api', label: 'api :8002' },
  { id: 'db', label: 'db :8003' },
];

export default function FaultBar({ isDarkMode, onLog }) {
  const [target, setTarget] = useState('api');
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null); // {ok, text}
  const [preflight, setPreflight] = useState('checking'); // checking | ready | down

  useEffect(() => {
    let mounted = true;
    api.demoTopology()
      .then(() => { if (mounted) setPreflight('ready'); })
      .catch((err) => { if (mounted) setPreflight(`down: ${err.message}`); });
    return () => { mounted = false; };
  }, []);

  const run = async (name, fn, okMsg) => {
    setBusy(name);
    setResult(null);
    try {
      const res = await fn();
      const text = `${okMsg} ${JSON.stringify(res).slice(0, 160)}`;
      setResult({ ok: true, text });
      onLog('WARN', `☠️ Fault [${name}] on ${target}: ${text}`);
    } catch (err) {
      setResult({ ok: false, text: err.message });
      onLog('CRIT', `❌ Fault [${name}] failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const btn = 'px-3 py-1.5 rounded-md border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50';
  const btnTheme = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100';

  return (
    <div className={`border rounded-xl px-4 py-3 shadow-lg ${
      isDarkMode ? 'bg-[#090d14] border-rose-500/30' : 'bg-white border-rose-200'
    }`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
          ☠️ Crash-test (live victim)
        </span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={`px-2 py-1.5 rounded-md border text-[11px] font-mono cursor-pointer ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}
        >
          {TARGETS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button disabled={busy} onClick={() => run('latency', () => api.demoFault(target, 'latency', 2000, 120), '2s latency injected')} className={`${btn} ${btnTheme}`}>
          <Biohazard className="w-3.5 h-3.5 text-amber-400" /> {busy === 'latency' ? '…' : 'Latency 2s'}
        </button>
        <button disabled={busy} onClick={() => run('deadlock', () => api.demoFault(target, 'deadlock', 0, 30), 'deadlock injected')} className={`${btn} ${btnTheme}`}>
          <Biohazard className="w-3.5 h-3.5 text-orange-400" /> {busy === 'deadlock' ? '…' : 'Deadlock'}
        </button>
        <button disabled={busy} onClick={() => run('kill', () => api.demoKill(target), 'SIGKILL sent')} className={`${btn} ${btnTheme}`}>
          <Skull className="w-3.5 h-3.5 text-rose-400" /> {busy === 'kill' ? '…' : 'Kill'}
        </button>
        <button disabled={busy} onClick={() => run('restart', () => api.demoRestart(target), 'process restarted')} className={`${btn} ${btnTheme}`}>
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> {busy === 'restart' ? '…' : 'Restart'}
        </button>
        <button disabled={busy} onClick={() => run('clear', () => api.demoClear(), 'faults cleared')} className={`${btn} ${btnTheme}`}>
          <Eraser className="w-3.5 h-3.5 text-slate-400" /> {busy === 'clear' ? '…' : 'Clear all'}
        </button>
      </div>
      {preflight !== 'ready' && (
        <div className={`mt-2 text-[11px] ${preflight === 'checking' ? 'text-slate-400' : 'text-amber-400'}`}>
          {preflight === 'checking'
            ? '… probing victim stack'
            : `⚠️ Victim unreachable (${preflight.replace('down: ', '')}). Start it: python demo-site/supervisor.py + loadgen.py --rps 100`}
        </div>
      )}
      {result && (
        <div className={`mt-2 text-[11px] font-mono ${result.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
          {result.ok ? '✅' : '❌'} {result.text}
        </div>
      )}
    </div>
  );
}
