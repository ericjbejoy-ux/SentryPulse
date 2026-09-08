"""loadgen — traffic generator for the demo-site victim stack.

Hammers POST :8001/pay at a target RPS so the services carry genuine
load (real latency / CPU / error metrics for SentryPulse to score).

Usage:  python loadgen.py [--rps 120] [--duration 120] [--url URL]
"""
import argparse
import asyncio
import time

import httpx


async def worker(url: str, interval: float, stop_at: float, stats: dict) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        while time.time() < stop_at:
            t0 = time.time()
            try:
                # Faucet account: inexhaustible, never starves alice/bob.
                r = await client.post(url, json={"acct": "faucet", "amount": 1.0})
                ok = r.json().get("ok", False)
            except Exception:
                ok = False
            stats["total"] += 1
            stats["ok"] += 1 if ok else 0
            dt = time.time() - t0
            stats["lat_sum"] += dt
            await asyncio.sleep(max(0.0, interval - dt))


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rps", type=float, default=120.0)
    ap.add_argument("--duration", type=float, default=120.0)
    ap.add_argument("--url", default="http://127.0.0.1:8001/pay")
    args = ap.parse_args()

    n_workers = max(1, min(32, int(args.rps // 8) or 1))
    interval = n_workers / args.rps
    stop_at = time.time() + args.duration
    stats = {"total": 0, "ok": 0, "lat_sum": 0.0}
    print(f"[loadgen] {args.rps} rps x {n_workers} workers -> {args.url} for {args.duration}s")
    await asyncio.gather(*[worker(args.url, interval, stop_at, stats) for _ in range(n_workers)])
    total = max(stats["total"], 1)
    print(
        f"[loadgen] done: {stats['total']} reqs, "
        f"ok={stats['ok'] / total:.1%}, avg_lat={stats['lat_sum'] / total * 1000:.1f}ms"
    )


if __name__ == "__main__":
    asyncio.run(main())
