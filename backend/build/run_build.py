"""
Master Build Runner forwarding to build_all.py.
Executes the unified rebuild of all 5 database layers.
"""

import sys
import os

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from build.build_all import main as build_all_main

if __name__ == "__main__":
    success = build_all_main()
    sys.exit(0 if success else 1)
