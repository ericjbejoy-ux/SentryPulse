"""faults — fault injection CLI for the demo-site victim stack.

Usage:
  python faults.py latency <gateway|api|db> <ms> [--duration 30]
  python faults.py deadlock db [--duration 20]
  python faults.py kill <gateway|api|db>
  python faults.py clear [gateway|api|db]   (default: all)
  python faults.py status
"""
import argparse
import sys

import httpx

SERVICES = {
    "gateway": {"port": 8001, "node": "idfc-api-gateway"},
    "api": {"port": 8002, "node": "core-banking-switch"},
    "db": {"port": 8003, "node": "cbs-db-primary"},
}
SUPERVISOR_URL = "http://127.0.0.1:8004"


def post_fault(svc: str, payload: dict) -> dict:
    port = SERVICES[svc]["port"]
    r = httpx.post(f"http://127.0.0.1:{port}/fault", json=payload, timeout=5.0)
    r.raise_for_status()
    return r.json()


def pid_on_port(port: int):
    """PID as reported by the supervisor (single source of truth)."""
    try:
        status = httpx.get(f"{SUPERVISOR_URL}/status", timeout=3.0).json()
    except Exception:
        return None
    for svc, info in SERVICES.items():
        if info["port"] == port:
            return status.get(svc, {}).get("pid")
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_lat = sub.add_parser("latency")
    p_lat.add_argument("svc", choices=SERVICES)
    p_lat.add_argument("ms", type=float)
    p_lat.add_argument("--duration", type=float, default=30.0)

    p_dl = sub.add_parser("deadlock")
    p_dl.add_argument("svc", choices=["db"])
    p_dl.add_argument("--duration", type=float, default=20.0)

    p_kill = sub.add_parser("kill")
    p_kill.add_argument("svc", choices=SERVICES)

    p_clear = sub.add_parser("clear")
    p_clear.add_argument("svc", nargs="?", default="all")

    sub.add_parser("status")
    args = ap.parse_args()

    if args.cmd == "latency":
        print(post_fault(args.svc, {"type": "latency", "latency_ms": args.ms, "duration_s": args.duration}))
    elif args.cmd == "deadlock":
        print(post_fault("db", {"type": "deadlock", "duration_s": args.duration}))
    elif args.cmd == "kill":
        r = httpx.post(f"{SUPERVISOR_URL}/kill/{args.svc}", timeout=5.0)
        if r.status_code == 404:
            print(f"[!] {args.svc}: {r.json().get('detail')}")
            sys.exit(1)
        r.raise_for_status()
        info = r.json()
        print(f"[faults] SIGKILL {args.svc} (pid {info['pid']} on :{SERVICES[args.svc]['port']})")
    elif args.cmd == "clear":
        targets = list(SERVICES) if args.svc == "all" else [args.svc]
        for svc in targets:
            try:
                print(svc, post_fault(svc, {"type": "clear"}))
            except Exception as exc:
                print(svc, f"unreachable ({exc})")
    elif args.cmd == "status":
        for svc, info in SERVICES.items():
            try:
                h = httpx.get(f"http://127.0.0.1:{info['port']}/health", timeout=3.0).json()
                m = httpx.get(f"http://127.0.0.1:{info['port']}/metrics", timeout=3.0).json()
                print(f"{svc:8s} {h['status']:8s} pid={pid_on_port(info['port'])} metrics={m}")
            except Exception as exc:
                print(f"{svc:8s} DOWN     ({exc})")


if __name__ == "__main__":
    main()
