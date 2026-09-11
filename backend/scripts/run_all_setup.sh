#!/usr/bin/env bash
# ==============================================================================
# AutonoSource Master Data Ingestion & Build Setup Script
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Executing AutonoSource Build Pipeline ==="
cd "$BACKEND_DIR"
PYTHONPATH=. python build/build_all.py

echo -e "\n=== Setup Completed Successfully! ==="

