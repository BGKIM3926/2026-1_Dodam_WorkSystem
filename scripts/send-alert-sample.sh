#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://dodam.tplinkdns.com:28080/api/alert}"

curl -fsS -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{
  "system_id": "1",
  "content": {
    "report_type": "hardware",
    "health_flags": [
      {
        "level": "CRITICAL",
        "category": "DISK_SPACE",
        "message": "/ 사용률이 90%로 위험합니다."
      }
    ]
  }
}
JSON

printf '\n'
