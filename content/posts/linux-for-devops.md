# Linux Skills Every DevOps Engineer Actually Needs

This is not a beginner's Linux guide. There are plenty of those.

This is the list of skills that separates someone who *uses* Linux from someone who *understands* it — the difference between googling every `chmod` and knowing why file permissions work the way they do.

---

## Process Management

### Understanding the process tree

Every process has a parent. Understanding this matters when things go wrong:

```bash
# Show process tree — see parent/child relationships
pstree -p

# Find what spawned a specific process
ps -o ppid= -p <PID>

# Show all processes with full command line
ps aux

# Real-time process monitoring with detailed info
htop   # or btop for a prettier version
```

### Signals — not just kill -9

```bash
# Graceful shutdown — asks process to clean up and exit
kill -SIGTERM <PID>    # or kill -15

# Force kill — no cleanup, use as last resort
kill -SIGKILL <PID>    # or kill -9

# Reload config without restart (if the app supports it)
kill -SIGHUP <PID>

# Pause a process (CTRL+Z sends this)
kill -SIGSTOP <PID>

# Resume it
kill -SIGCONT <PID>
```

Using `kill -9` as your first move is the equivalent of cutting a power cord. It works, but you're skipping the cleanup step. Always try SIGTERM first, wait a few seconds, then escalate.

---

## File Permissions — The Actual Model

Most people learn `chmod 755` and stop there. Here's what's actually happening:

```
Permission string: -rwxr-xr-x
                   │├┤├┤├┤
                   ││ │ │ └── other: r-x (5 = 101 binary)
                   ││ │ └──── group: r-x (5)
                   ││ └────── owner: rwx (7 = 111 binary)
                   │└──────── file type (- = file, d = dir, l = symlink)
```

```bash
# Numeric mode — each digit is owner/group/other
# r=4, w=2, x=1 — add them up
chmod 644 file.txt    # owner: rw-, group: r--, other: r--
chmod 755 script.sh   # owner: rwx, group: r-x, other: r-x
chmod 600 private.key # owner: rw-, no one else can read it

# Symbolic mode — easier to read
chmod u+x script.sh   # add execute for owner
chmod go-w file.txt   # remove write from group and other
chmod a+r public.txt  # add read for everyone

# Sticky bit on directories — only owner can delete their files
chmod +t /tmp         # classic example: /tmp is world-writable but sticky

# SUID — run as file owner, not caller (used by passwd, sudo)
chmod u+s /usr/bin/passwd
```

```bash
# Check ownership
ls -la file.txt

# Change owner
chown harsh:devops file.txt

# Change recursively (carefully)
chown -R harsh:devops /var/app
```

---

## Networking Diagnostics

This is where you spend most of your debugging time:

```bash
# Check what's listening on which port
ss -tlnp              # modern, prefer this over netstat
netstat -tlnp         # older systems

# See all connections
ss -anp

# Test connectivity
ping -c 4 8.8.8.8
curl -v https://example.com      # shows full request/response headers
curl -I https://example.com      # headers only
telnet host 3306                 # test TCP connectivity to a port
nc -zv host 3306                 # cleaner than telnet for port checks

# DNS lookup
dig google.com
dig @8.8.8.8 google.com          # query specific DNS server
nslookup google.com

# Trace the route
traceroute 8.8.8.8
mtr 8.8.8.8                      # real-time, like traceroute + ping

# See routing table
ip route show
ip route get 192.168.1.1         # which interface would be used?

# Check firewall rules (requires root)
iptables -L -n -v
```

When a container or service can't reach something, I work through this in order: DNS → connectivity → port → firewall → application.

---

## Systemd — Running Services in Production

```bash
# Service management
systemctl start   nginx
systemctl stop    nginx
systemctl restart nginx
systemctl reload  nginx    # reload config without full restart

# Check status (shows recent log lines too)
systemctl status nginx

# Enable/disable at boot
systemctl enable  nginx
systemctl disable nginx

# View logs for a service
journalctl -u nginx               # all logs
journalctl -u nginx -f            # follow (like tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -n 50         # last 50 lines

# Check why a service failed
systemctl status nginx
journalctl -u nginx -xe           # show context around error
```

Writing a simple systemd unit file:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# After creating the file:
systemctl daemon-reload
systemctl enable --now myapp
```

---

## Text Processing (the one that saves hours)

```bash
# grep — find patterns
grep "ERROR" app.log
grep -i "error" app.log           # case insensitive
grep -r "TODO" /src               # recursive
grep -v "DEBUG" app.log           # exclude matching lines
grep -A 5 "Exception" app.log     # 5 lines after match
grep -B 3 "FATAL" app.log         # 3 lines before match
grep -c "ERROR" app.log           # count matches

# awk — column extraction and processing
awk '{print $2}' access.log       # print 2nd field
awk -F: '{print $1}' /etc/passwd  # use : as field separator
awk '$3 > 500 {print $0}' log     # filter by field value

# sed — stream editing
sed 's/old/new/g' file.txt        # replace all occurrences
sed -i 's/old/new/g' file.txt     # edit file in-place
sed '/pattern/d' file.txt         # delete matching lines
sed -n '10,20p' file.txt          # print lines 10-20

# sort and uniq — frequency analysis
sort access.log | uniq -c | sort -rn | head -20  # top 20 most frequent lines

# Find top IPs in nginx access log:
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

---

## Disk and Performance

```bash
# Disk usage
df -h                   # filesystem usage
du -sh /var/*           # directory sizes
du -sh * | sort -rh | head -20   # largest directories

# Find big files
find / -type f -size +100M 2>/dev/null | sort -k5 -rn

# I/O monitoring
iostat -x 1             # extended I/O stats, 1 second interval
iotop                   # per-process I/O (like top for disk)

# Memory
free -h
cat /proc/meminfo

# CPU
mpstat 1                # per-CPU stats
top -bn1               # batch mode, one iteration (good for scripts)
```

---

## The Bash Tricks I Use Every Day

```bash
# Brace expansion
mkdir -p /opt/{app,logs,config,tmp}
touch service-{1..5}.txt

# Command substitution
CURRENT_DATE=$(date +%Y%m%d)
LOG_FILE="app-${CURRENT_DATE}.log"

# Check if command succeeded
if ! systemctl start nginx; then
    echo "nginx failed to start" >&2
    exit 1
fi

# Run something in the background, capture PID
./long-running-script.sh &
BG_PID=$!
echo "Running as PID: $BG_PID"

# Wait for it to finish
wait $BG_PID

# Set strict mode in scripts — fail fast
set -euo pipefail
```

---

The common thread in all of this: **understand the why, not just the commands.** Knowing that `ss` reads from `/proc/net` is what lets you debug why it shows different results than your application thinks.

Spend time reading man pages. `man ss`, `man awk`, `man systemd.service` — they're dense but authoritative. Every hour you invest pays back when something breaks at 2am.
