A Bash scripting project that fully automates EC2 provisioning and Apache website deployment using AWS CLI. Instead of manually creating instances, configuring security groups, generating SSH keys, and deploying websites every single time, this script handles the complete infrastructure setup automatically.

The goal was simple:

> Run one script → Get a live website deployed on AWS.

This project helped me understand how real infrastructure automation works behind DevOps tools and cloud workflows.

---

# Project Overview

This script automates:

- AWS CLI installation
- AWS credential verification
- EC2 instance provisioning
- Key pair generation
- Security group creation
- Public IP retrieval
- SSH automation
- Apache installation
- GitHub website deployment

The entire deployment workflow is handled using Bash scripting and AWS CLI commands. :contentReference[oaicite:0]{index=0}

---

# Architecture

```text
Local Machine
     │
     ▼
Bash Script
     │
     ▼
AWS CLI
     │
     ▼
EC2 Provisioning
     │
     ▼
Security Group + Key Pair
     │
     ▼
SSH Into EC2
     │
     ▼
Apache Installation
     │
     ▼
GitHub Website Deployment
     │
     ▼
Live Website
```

---

# Tech Stack

- Bash Scripting
- AWS CLI
- Amazon EC2
- Linux
- SSH
- Apache2
- Git
- GitHub

---

# Features

### Automatic AWS CLI Validation

The script checks whether AWS CLI is configured before deployment.

```bash
aws sts get-caller-identity
```

If credentials are missing, it automatically triggers:

```bash
aws configure
```

---

### Dynamic Security Group Creation

Automatically creates or reuses a security group and opens:

- Port 22 → SSH
- Port 80 → HTTP
- Port 443 → HTTPS

---

### Automatic EC2 Provisioning

Creates EC2 instance using:

```bash
aws ec2 run-instances
```

with custom:

- AMI ID
- Instance Type
- Key Pair
- Security Group
- Tags

---

### Automatic Website Deployment

After EC2 launch, the script:

- SSHs into the server
- Installs Apache & Git
- Clones website repository
- Deploys website automatically

---

# Challenges Faced

## SSH Timing Problems

Initially SSH connections failed because the instance wasn't fully ready.

Adding proper wait handling solved the issue:

```bash
aws ec2 wait instance-running
```

---

## Public IP Delays

Sometimes the public IP wasn't assigned instantly after launch.

This required adding delays before fetching the IP address.

---

## Key Pair Conflicts

AWS throws errors when duplicate key pairs exist.

The script now automatically:

- deletes old key pair
- recreates new one
- downloads fresh `.pem` file

---

# Screenshot

<!-- Add project screenshot below -->

![Project Screenshot](https://drive.google.com/file/d/1gt5vHzLD3mFAiaCMLaq396t1Z6yKOSjI/view?usp=sharing)

---

# Script Output Example

```bash
====================================
WEBSITE DEPLOYED SUCCESSFULLY
====================================

website url:
http://PUBLIC_IP

ssh command:
ssh -i harsh-ec2key.pem ubuntu@PUBLIC_IP
```

---

# What I Learned

This project helped me understand:

- Infrastructure automation
- Cloud provisioning
- AWS CLI workflows
- Remote server automation
- SSH scripting
- Deployment orchestration

Most importantly:

> Real DevOps starts when repetitive tasks become automated workflows.

---