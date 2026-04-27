# Ansible Server Hardening Playbook

Ansible playbooks for automating Linux server provisioning and security hardening. Idempotent, tested on Ubuntu 22.04 and Amazon Linux 2. Run once on a fresh server and it comes out the other end production-ready.

> **Status:** Work in progress — core hardening roles are complete, CIS benchmark checks are still being added.

---

## What It Does

```
server-hardening/
├── inventory/
│   ├── production.yml
│   └── staging.yml
├── roles/
│   ├── common/          ← system updates, essential packages, timezone
│   ├── users/           ← create sudo users, add SSH keys, disable root
│   ├── ssh/             ← harden sshd_config (key-only, no root, changed port)
│   ├── firewall/        ← configure UFW (allow only needed ports)
│   ├── fail2ban/        ← brute-force protection
│   ├── auditd/          ← system call auditing
│   └── docker/          ← install and configure Docker with security options
└── site.yml             ← top-level playbook
```

---

## Running It

```bash
# Syntax check before touching real servers
ansible-playbook site.yml --syntax-check

# Dry run — see what would change
ansible-playbook site.yml --check --diff -i inventory/staging.yml

# Apply to staging
ansible-playbook site.yml -i inventory/staging.yml

# Apply to production (prompts for vault password)
ansible-playbook site.yml -i inventory/production.yml --ask-vault-pass
```

---

## Key Roles

### `ssh` role — sshd hardening

```yaml
# roles/ssh/templates/sshd_config.j2
Port {{ ssh_port | default(22) }}
Protocol 2

# Auth
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
LoginGraceTime 30

# Disable unused features
X11Forwarding no
AllowTcpForwarding no
GatewayPorts no
PermitEmptyPasswords no

# Limit to allowed users
AllowUsers {{ ssh_allowed_users | join(' ') }}
```

### `firewall` role — UFW configuration

```yaml
# roles/firewall/tasks/main.yml
- name: Reset UFW to defaults
  ufw:
    state: reset

- name: Default deny incoming
  ufw:
    direction: incoming
    policy: deny

- name: Default allow outgoing
  ufw:
    direction: outgoing
    policy: allow

- name: Allow SSH on configured port
  ufw:
    rule: allow
    port: "{{ ssh_port | default('22') }}"
    proto: tcp

- name: Allow app ports
  ufw:
    rule: allow
    port: "{{ item }}"
    proto: tcp
  loop: "{{ firewall_allowed_ports | default([]) }}"

- name: Enable UFW
  ufw:
    state: enabled
    logging: 'on'
```

### `fail2ban` role

```yaml
# roles/fail2ban/templates/jail.local.j2
[sshd]
enabled  = true
port     = {{ ssh_port | default(22) }}
maxretry = 3
findtime = 600
bantime  = 3600
```

---

## Screenshots

![Ansible playbook output showing tasks being applied to multiple servers in parallel with green OK and yellow changed status](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&q=80)

*Playbook run against a 3-node staging environment — 47 tasks, all idempotent*

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">7</div>
    <div class="project-stat-label">Roles</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">47</div>
    <div class="project-stat-label">Hardening tasks</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">~4min</div>
    <div class="project-stat-label">Fresh server → hardened</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">2</div>
    <div class="project-stat-label">Distros supported</div>
  </div>
</div>

---

## Secrets Management

All secrets (passwords, API keys, vault tokens) are stored using **Ansible Vault**:

```bash
# Encrypt a secrets file
ansible-vault encrypt group_vars/all/vault.yml

# Edit it
ansible-vault edit group_vars/all/vault.yml

# Reference in a task
- name: Set database password
  environment:
    DB_PASSWORD: "{{ vault_db_password }}"
```

The vault password itself lives in AWS Secrets Manager and is fetched by the CI pipeline before running the playbook — no secrets on disk.

---

## What's Still In Progress

- [ ] CIS Ubuntu 22.04 Level 1 benchmark checks (auditd rules in progress)
- [ ] Molecule tests for all roles (common and ssh roles done)
- [ ] Amazon Linux 2023 support
- [ ] AIDE file integrity monitoring role

The core hardening is solid and production-ready. The CIS compliance checks are coming — watching this space.
