#!/usr/bin/env python3
"""
Auditor for Groq 17-Key Daily Token Quota (TPD) & Cooldown Timers.
Tests each key with a realistic ~2,800-token prompt matching the actual
batch chunk extraction payload, extracts the exact remaining wait time,
and projects the exact clock time when each key unlocks.
"""

import os
import re
import time
import datetime
from dotenv import dotenv_values
from openai import OpenAI, RateLimitError

def main():
    env_path = "/media/kamalesh/KAMALESH/PROJECTS/procurement-agent/backend/build/.env"
    cfg = dotenv_values(env_path)
    keys_str = cfg.get("GROQ_API_KEYS", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        keys = [cfg[f"GROQ_KEY_{i}"] for i in range(1, 50) if f"GROQ_KEY_{i}" in cfg]
    model = cfg.get("GROQ_MODEL", "openai/gpt-oss-120b")

    # Exact realistic payload ~2,800 tokens (approx 3 dense chunks)
    prompt = "This is a regulatory pharmaceutical procurement guideline document text. " * 310
    now = datetime.datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    print("=" * 96)
    print(f"GROQ {len(keys)}-KEY ROLLING TPD UNLOCK AUDIT | MODEL: {model}")
    print(f"AUDIT STARTED AT: {now_str}")
    print("=" * 96)

    results = []

    for i, k in enumerate(keys, 1):
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=k, timeout=15.0)
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=20
            )
            results.append({
                "key": i,
                "status": "READY",
                "used": "Available",
                "limit": 200000,
                "wait_sec": 0,
                "wait_str": "READY NOW",
                "unlock_time": "NOW",
                "org": "Active Org"
            })
        except RateLimitError as e:
            msg = str(e)
            used_m = re.search(r"Used\s+(\d+)", msg)
            lim_m = re.search(r"Limit\s+(\d+)", msg)
            org_m = re.search(r"organization\s+`([^`]+)`", msg)
            wait_m = re.search(r"try again in\s+([^\.]+s)", msg)
            
            headers = getattr(e, "response", None)
            retry_after = headers.headers.get("retry-after") if headers else None
            
            wait_sec = float(retry_after) if retry_after else 0.0
            unlock_dt = datetime.datetime.now() + datetime.timedelta(seconds=wait_sec)
            
            used_val = int(used_m.group(1)) if used_m else "?"
            lim_val = int(lim_m.group(1)) if lim_m else 200000
            wait_text = wait_m.group(1) if wait_m else f"{wait_sec:.0f}s"
            
            results.append({
                "key": i,
                "status": "COOLDOWN",
                "used": used_val,
                "limit": lim_val,
                "wait_sec": wait_sec,
                "wait_str": wait_text,
                "unlock_time": unlock_dt.strftime("%H:%M:%S"),
                "org": org_m.group(1) if org_m else "?"
            })
        except Exception as ex:
            results.append({
                "key": i,
                "status": "ERROR",
                "used": "?",
                "limit": "?",
                "wait_sec": 9999,
                "wait_str": str(ex)[:30],
                "unlock_time": "?",
                "org": "?"
            })
        time.sleep(0.4)

    print(f"{'#':<4} | {'Status':<8} | {'TPD Used / Limit':<22} | {'Waiting Time':<18} | {'Unlock Time':<11} | Organization ID")
    print("-" * 96)
    
    for r in results:
        if isinstance(r["used"], int):
            used_str = f"{r['used']:,} / {r['limit']:,}"
        else:
            used_str = f"{r['used']} / {r['limit']}"
        key_num = f"#{r['key']:02d}"
        status = r['status']
        wait_s = r['wait_str']
        unlock_s = r['unlock_time']
        org_s = r['org']
        print(f"{key_num:<4} | {status:<8} | {used_str:<22} | {wait_s:<18} | {unlock_s:<11} | {org_s}")

    cooldown_waits = [r["wait_sec"] for r in results if r["wait_sec"] > 0]
    max_wait = max(cooldown_waits) if cooldown_waits else 0
    min_wait = min(cooldown_waits) if cooldown_waits else 0
    ready_count = sum(1 for r in results if r["status"] == "READY")

    final_dt = (datetime.datetime.now() + datetime.timedelta(seconds=max_wait)).strftime("%H:%M:%S")

    print("=" * 96)
    print(f"📊 SUMMARY:")
    print(f"  • Ready Immediately : {ready_count}/{len(keys)} Keys")
    print(f"  • In Rolling Cooldown: {len(cooldown_waits)}/{len(keys)} Keys")
    if cooldown_waits:
        print(f"  • Earliest Key Unlocks In : {min_wait/60:.1f} minutes ({min_wait:.0f}s)")
        print(f"  • All Keys Unlocked By    : {max_wait/60:.1f} minutes (~{final_dt})")
    print("=" * 96)

if __name__ == "__main__":
    main()
