import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const MAX_STRIKE = 3;

/**
 * Polls the live demo-site topology (backend proxy) every 2s, but only
 * while the backend reports demo-site mode. Returns null otherwise, in
 * which case the canvas falls back to its hardcoded static graph.
 *
 * After MAX_STRIKE consecutive poll failures the last frame is dropped
 * (null) instead of freezing green forever — the canvas + FaultBar fall
 * back honestly until polls succeed again.
 */
export function useLiveTopology(liveSource, backendStatus) {
  const [topology, setTopology] = useState(null);
  const strikes = useRef(0);

  useEffect(() => {
    if (liveSource !== 'demo-site' || backendStatus !== 'live') {
      strikes.current = 0;
      setTopology(null);
      return undefined;
    }
    let mounted = true;
    const poll = () => {
      api.demoTopology()
        .then((t) => {
          if (!mounted) return;
          strikes.current = 0;
          setTopology(t);
        })
        .catch(() => {
          if (!mounted) return;
          strikes.current += 1;
          if (strikes.current >= MAX_STRIKE) setTopology(null);
        });
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, [liveSource, backendStatus]);

  return topology;
}
