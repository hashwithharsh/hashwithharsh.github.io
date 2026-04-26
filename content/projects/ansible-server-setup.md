# Ansible Server Hardening Playbook

## Overview

Ansible playbooks for automating Linux server provisioning and security hardening. Idempotent, tested on Ubuntu 22.04 and Amazon Linux 2. Deploy secure servers consistently across your infrastructure.

## Project Details

**Status:** In Progress  
**Year:** 2025  
**Technologies:** Ansible, Linux, Infrastructure as Code, Security

## What Gets Hardened

### System Configuration
- Kernel parameters optimization
- Network stack hardening
- Sysctl security settings
- Disable unnecessary services

### SSH Security
- SSH key-based authentication
- Disable root login
- Change default port (optional)
- Fail2Ban integration
- Rate limiting

### Firewall & Access Control
- UFW configuration
- Port allowlisting
- Protocol-specific rules
- Logging and monitoring

### User Management
- Create service accounts
- Sudo configuration
- SSH key management
- Group-based permissions

### Package Management
- Automatic security updates
- Remove unnecessary packages
- Update package cache
- Dependency resolution

## Playbook Structure

```yaml
├── site.yml                 # Main playbook
├── roles/
│   ├── base/               # Core system setup
│   ├── security/           # Security hardening
│   ├── ssh/                # SSH configuration
│   ├── firewall/           # UFW setup
│   ├── users/              # User provisioning
│   └── monitoring/         # Agent installation
└── inventory/
    ├── production.yml
    ├── staging.yml
    └── group_vars/
```

## Usage

```bash
# Harden all production servers
ansible-playbook -i inventory/production.yml site.yml

# Target specific group
ansible-playbook -i inventory/production.yml site.yml \
  -l webservers

# Run only security role
ansible-playbook -i inventory/production.yml site.yml \
  -t security
```

## Repository

GitHub: [github.com/harshyadav/ansible-hardening](https://github.com/harshyadav/ansible-hardening)

## Features

- **Idempotent** - Safe to run repeatedly without side effects
- **Tested** - Validated on Ubuntu 22.04 and Amazon Linux 2
- **Modular** - Use individual roles as needed
- **Documented** - Comments and documentation in every role
- **Configurable** - Customize via group_vars and host_vars

## Security Principles Applied

1. **Principle of Least Privilege** - Users have minimal required permissions
2. **Defense in Depth** - Multiple layers of security
3. **Fail Secure** - Defaults are secure, opt-in to permissive rules
4. **Automation** - Consistent hardening across all servers
5. **Auditability** - All changes logged and traceable

## Best Practices

- Use SSH keys, never passwords
- Implement centralized logging
- Regular security updates
- Monitor for unauthorized access
- Periodic security audits

## What I Learned

- Ansible playbook design patterns
- Role structure and reusability
- Variable scoping and precedence
- Handlers and notifications
- Conditional execution
- Error handling and recovery
- CIS Benchmarks application

## Future Enhancements

- SELinux configuration
- AppArmor profiles
- Log aggregation setup
- Intrusion detection
- Automated compliance checking
