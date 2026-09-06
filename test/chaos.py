import psutil
import time
import sys

def find_primary_db_pid():
    for conn in psutil.net_connections(kind='inet'):
        if conn.laddr.port == 8003:
            return conn.pid
    return None

pid = find_primary_db_pid()
if not pid:
    print("Error: primary_db (port 8003) is not running.")
    sys.exit(1)

print(f"Targeting primary_db process (PID: {pid})...")
proc = psutil.Process(pid)

# Option A: Terminate process to simulate an unhandled crash
proc.kill()
print("Success: Injected sudden unhandled crash on primary_db (SIGKILL sent).")
