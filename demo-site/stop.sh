#!/usr/bin/env bash
# Stop the whole demo stack: SentryPulse backend + victim services +
# supervisor + loadgen. Kills by LISTENING PORT (8000-8004), never by
# command-line pattern (pkill -f matches its own shell — don't).
set -u
python3 - "$@" <<'EOF'
import sys
import psutil

PORTS = {8000, 8001, 8002, 8003, 8004}
only = {int(a) for a in sys.argv[1:]} or PORTS
stopped = []
for conn in psutil.net_connections(kind="inet"):
    port = getattr(conn.laddr, "port", None)
    if port in only and conn.status == "LISTEN" and conn.pid:
        try:
            psutil.Process(conn.pid).terminate()
            stopped.append((port, conn.pid))
        except Exception as exc:
            print(f"port {port}: {exc}")
for port, pid in sorted(stopped):
    print(f"stopped :{port} (pid {pid})")
if not stopped:
    print("nothing listening on", sorted(only))
EOF
