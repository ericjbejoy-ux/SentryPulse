/* SentryPulse backend API client (unified single-backend MVP).
 * Base URL is overridable per-machine via `.env` -> VITE_API_URL.
 * Every call is backend-first with graceful local-simulation fallback
 * handled by the caller (see App.jsx), so the UI works offline (NFR-4.1).
 */

export const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000';

async function req(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs || 12000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => req('/api/health', { timeoutMs: 4000 }),
  live: () => req('/api/v1/telemetry/live', { timeoutMs: 4000 }),
  nodes: () => req('/api/v1/telemetry/nodes', { timeoutMs: 4000 }),
  startSimulation: (permutations = 100000, chaos_type = 'THREADPOOL_LOCK', dry_run = false) =>
    req('/api/v1/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ permutations, chaos_type, dry_run }),
      timeoutMs: 15000,
    }),
  triage: (telemetry, useGroq = true) =>
    req(`/api/v1/triage?use_groq=${useGroq ? 'true' : 'false'}`, {
      method: 'POST',
      body: JSON.stringify(telemetry || {}),
      timeoutMs: 25000,
    }),
  pareto: (failingNode = 'cbs-db-primary') =>
    req(`/api/v1/pareto/options?failing_node=${encodeURIComponent(failingNode)}`, {
      timeoutMs: 6000,
    }),
  heal: (payload) =>
    req('/api/v1/n8n/trigger', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 8000,
    }),
  reset: () =>
    req('/api/v1/telemetry/reset', { method: 'POST', timeoutMs: 5000 }),

  // Demo-site proxy (503 when the backend runs without DEMO_SITE_URL).
  demoTopology: () => req('/api/v1/demo/topology', { timeoutMs: 5000 }),
  demoFault: (target, type, latency_ms = 2000, duration_s = 60) =>
    req('/api/v1/demo/fault', {
      method: 'POST',
      body: JSON.stringify({ target, type, latency_ms, duration_s }),
      timeoutMs: 8000,
    }),
  demoKill: (svc) =>
    req(`/api/v1/demo/kill/${encodeURIComponent(svc)}`, {
      method: 'POST',
      timeoutMs: 8000,
    }),
  demoRestart: (svc) =>
    req(`/api/v1/demo/restart/${encodeURIComponent(svc)}`, {
      method: 'POST',
      timeoutMs: 12000,
    }),
  demoClear: () =>
    req('/api/v1/demo/clear', { method: 'POST', timeoutMs: 8000 }),

  subscribeStream: (onTelemetry, onError) => {
    try {
      const es = new EventSource(`${API_BASE}/api/v1/telemetry/stream`);
      es.addEventListener('telemetry', (ev) => {
        try {
          onTelemetry(JSON.parse(ev.data));
        } catch {
          /* ignore malformed frames */
        }
      });
      es.onerror = (e) => {
        if (onError) onError(e);
      };
      return () => es.close();
    } catch (e) {
      if (onError) onError(e);
      return () => {};
    }
  },
};
