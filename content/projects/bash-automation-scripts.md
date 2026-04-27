# DevOps Automation Scripts

A growing collection of bash scripts that automate the DevOps tasks I kept doing manually. Server setup, log rotation, backup pipelines, health checks, system hardening — each script is production-tested, documented, and built with `set -euo pipefail` so they fail loudly instead of silently making things worse.

---

## Scripts in the Collection

### `server-init.sh` — New server bootstrap

Sets up a fresh Ubuntu 22.04 server from zero: creates a non-root user, configures SSH (key-only, no password auth), sets up UFW, installs common tools, configures unattended security upgrades.

```bash
# Usage: run as root on a fresh server
curl -fsSL https://raw.githubusercontent.com/harshyadav/devops-scripts/main/server-init.sh | \
  sudo bash -s -- --user harsh --ssh-key "ssh-ed25519 AAAA..."
```

### `log-rotate.sh` — Application log rotation

Rotates logs in a given directory older than N days, compresses them, and optionally ships them to S3.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${1:?Usage: log-rotate.sh <dir> <days>}"
KEEP_DAYS="${2:-7}"
S3_BUCKET="${S3_BUCKET:-}"

echo "→ Compressing logs older than ${KEEP_DAYS} days in ${LOG_DIR}"
find "$LOG_DIR" -name "*.log" -mtime "+${KEEP_DAYS}" -print0 |
  while IFS= read -r -d '' f; do
    gzip "$f"
    echo "  compressed: ${f}"
  done

if [[ -n "$S3_BUCKET" ]]; then
  echo "→ Syncing to s3://${S3_BUCKET}/logs/"
  aws s3 sync "${LOG_DIR}" "s3://${S3_BUCKET}/logs/" \
    --exclude "*.log" \
    --include "*.log.gz" \
    --storage-class STANDARD_IA
fi
```

### `health-check.sh` — Service monitor with alerting

Checks a list of HTTP endpoints and sends a Slack alert if any return non-200 or time out. Designed to run every 5 minutes from cron.

```bash
SERVICES=(
  "api:https://api.hashwithharsh.dev/health"
  "blog:https://hashwithharsh.dev"
  "metrics:http://prometheus.internal:9090/-/healthy"
)

for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  url="${entry#*:}"
  
  status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$url" || echo "000")
  
  if [[ "$status" != "200" ]]; then
    # POST to Slack webhook
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 *${name}* returned HTTP ${status}\"}"
  fi
done
```

### `backup-postgres.sh` — Database backup to S3

Dumps a Postgres database, encrypts it with GPG, and ships it to S3 with a timestamp. Keeps last 30 days.

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="/tmp/backup_${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" | gzip | gpg --symmetric --cipher-algo AES256 \
  --passphrase "$GPG_PASSPHRASE" --batch -o "${DUMP_FILE}.gpg"

aws s3 cp "${DUMP_FILE}.gpg" "s3://${BACKUP_BUCKET}/postgres/${TIMESTAMP}.sql.gz.gpg"

# Prune old backups
aws s3 ls "s3://${BACKUP_BUCKET}/postgres/" | \
  sort | head -n -30 | awk '{print $4}' | \
  xargs -I{} aws s3 rm "s3://${BACKUP_BUCKET}/postgres/{}"
```

---

## Screenshot

![Terminal showing health-check.sh running and outputting service status for multiple endpoints](https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=900&q=80)

*`health-check.sh` catching a down service and posting to Slack before anyone noticed*

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">12</div>
    <div class="project-stat-label">Scripts</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">100%</div>
    <div class="project-stat-label">Fail-fast (set -euo)</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">0</div>
    <div class="project-stat-label">External dependencies</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">∞</div>
    <div class="project-stat-label">Hours saved</div>
  </div>
</div>

---

## Design Rules I Follow

Every script in this collection follows these rules:

1. **`set -euo pipefail` at the top** — fail on any error, unbound variable, or pipe failure
2. **No silent failures** — every error path prints a message before exiting
3. **Validate inputs early** — check required env vars and arguments before doing any work
4. **Idempotent where possible** — running a script twice should be safe
5. **Dry-run flag** — most destructive scripts accept `--dry-run` to preview what would happen
6. **Log with timestamps** — all output includes timestamps for cron job debugging

```bash
# Template I start every script with
#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

log()  { echo "[${TIMESTAMP}] $*"; }
error(){ echo "[${TIMESTAMP}] ERROR: $*" >&2; exit 1; }

: "${REQUIRED_VAR:?Required environment variable REQUIRED_VAR is not set}"
```
