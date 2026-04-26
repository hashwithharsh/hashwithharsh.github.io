# DevOps Automation Scripts

## Overview

A growing collection of battle-tested bash scripts that automate common DevOps tasks. Every script here has been used in production and has saved countless hours of manual work. Contributions welcome.

## Project Details

**Status:** Active  
**Year:** 2024  
**Technologies:** Bash, Linux, Shell Scripting

## Scripts Included

### System Administration

**server-setup.sh** - Complete Linux server hardening
- UFW firewall configuration
- Fail2Ban setup for brute-force protection
- SSH hardening
- User and permissions management
- Automatic security updates

**backup-pipeline.sh** - Automated backup with verification
- Incremental backups using rsync
- Compression and rotation
- Remote backup via SSH
- Integrity verification
- Automated retention policies

### Monitoring & Health Checks

**health-check.sh** - Service health monitoring
- HTTP endpoint checks
- TCP port availability
- Disk space monitoring
- Memory usage alerts
- Log error detection

**log-rotation.sh** - Centralized log management
- Automatic compression of old logs
- Retention policy enforcement
- Database log cleanup
- Archive to cold storage

### Infrastructure Management

**docker-cleanup.sh** - Docker maintenance
- Remove unused images
- Prune dangling layers
- Volume cleanup
- Network cleanup

**k8s-node-drain.sh** - Safe node maintenance
- Graceful pod eviction
- Cordon/uncordon operations
- Pod migration verification

## Features

- **Error handling** - Comprehensive error checking and logging
- **Idempotent** - Safe to run multiple times
- **Configurable** - Environment variables for customization
- **Logged** - All operations logged for audit trails
- **Tested** - Runs successfully in production

## Repository

GitHub: [github.com/harshyadav/devops-scripts](https://github.com/harshyadav/devops-scripts)

## Usage Examples

```bash
# Setup a new Ubuntu server
./server-setup.sh

# Run daily backups
0 2 * * * /opt/scripts/backup-pipeline.sh >> /var/log/backups.log

# Monitor services
*/5 * * * * /opt/scripts/health-check.sh
```

## Key Learnings

- Bash scripting best practices
- Process management and signals
- File I/O and system calls
- Regular expressions and text processing
- Error handling and exit codes
- Logging and debugging techniques

## Why These Matter

Automation is the foundation of DevOps. These scripts:
- Reduce manual errors
- Save hours per week
- Improve consistency
- Enable faster incident response
- Scale better than manual processes

## Contributing

These scripts are open for contributions. If you've automated something useful, send a PR!
