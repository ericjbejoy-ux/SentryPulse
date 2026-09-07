import { useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Polls the live demo-site topology (backend proxy) every 2s, but only
 * while the backend reports demo-site mode. Returns null otherwise, in
 * which case the canvas falls back to its hardcoded static graph.
 */
export function useLiveTopology(liveSource, backendStatus) {
  const [topology, setTopology] = useState(null);

  useEffect(() => {
    if (liveSource !== 'demo-site' || backendStatus !== 'live') {
      setTopology(null);
      return undefined;
    }
    let mounted = true;
    const poll = () => {
      api.demoTopology()
        .then((t) => { if (mounted) setTopology(t); })
        .catch(() => { /* transient poll failure: keep last frame */ });
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, [liveSource, backendStatus]);

  return topology;
}
