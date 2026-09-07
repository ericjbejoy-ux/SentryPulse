#!/usr/bin/env bash
# Starts the 3 victim services directly (no supervisor). For the full
# demo (incl. auto-heal restarts) use supervisor.py instead.
set -u
cd "$(dirname "$0")"
python3 gateway.py & echo $! > .gateway.pid
python3 api.py & echo $! > .api.pid
python3 dbsim.py & echo $! > .dbsim.pid
echo "demo-site up: :8001 gateway, :8002 api, :8003 dbsim"
echo "stop with: kill \$(cat .gateway.pid .api.pid .dbsim.pid)"
