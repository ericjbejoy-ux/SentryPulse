import React, { useRef, useState } from 'react';
import { RefreshCw, Save, Terminal } from 'lucide-react';

/**
 * FR-8: live SSE audit terminal + PDF audit-report export.
 * Owns the hidden print-styled report container and the html2pdf flow;
 * session logs stream in from App via props.
 */
export default function TerminalDrawer({ logs, isDarkMode, onLog, report }) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef(null);
  const { nodes, simState, simulationCount, totalAnomaliesDetected, topVector } = report;

  const executePdfExport = () => {
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `sentrypulse_audit_report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsDownloadingPdf(false);
      onLog('SYS', '✅ PDF audit report successfully generated and downloaded.');
    }).catch((err) => {
      console.error(err);
      setIsDownloadingPdf(false);
      onLog('CRIT', '❌ Failed to export PDF report.');
    });
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    onLog('SYS', '📄 Compiling active audit report into professional PDF format...');

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => executePdfExport();
      document.body.appendChild(script);
    } else {
      executePdfExport();
    }
  };

  return (
    <div className={`border rounded-xl p-6 flex flex-col shadow-xl transition-colors duration-300 ${
      isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Hidden report container, print-styled for clean PDF generation */}
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
                {nodes.map((n) => (
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
  );
}
