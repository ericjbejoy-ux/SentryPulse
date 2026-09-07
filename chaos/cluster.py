import http.server
import socketserver
import multiprocessing
import time

def run_service(name, port):
    class SimpleHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            return # Keep stdout quiet

    with socketserver.TCPServer(("127.0.0.1", port), SimpleHandler) as httpd:
        print(f"[{name}] Running natively on http://127.0.0.1:{port} (PID: {multiprocessing.current_process().pid})")
        httpd.serve_forever()

if __name__ == "__main__":
    services = [
        ("api_gateway", 8001),
        ("auth_service", 8002),
        ("primary_db", 8003)
    ]
    procs = []
    for name, port in services:
        p = multiprocessing.Process(target=run_service, args=(name, port))
        p.start()
        procs.append(p)

    try:
        for p in procs:
            p.join()
    except KeyboardInterrupt:
        print("\nShutting down cluster...")
        for p in procs:
            p.terminate()
