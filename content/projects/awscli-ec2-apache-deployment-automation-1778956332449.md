# AWS EC2 Apache Deployment Automation

A Bash scripting project that fully automates AWS EC2 provisioning and Apache website deployment using AWS CLI. Instead of manually creating instances, configuring security groups, generating SSH keys, and deploying websites every single time, this script handles the complete deployment workflow automatically.

---

## Why I Built This

After launching EC2 instances manually again and again, I realized most of the work was repetitive:

- creating key pairs
- opening security group ports
- waiting for EC2 startup
- SSH into server
- installing Apache
- deploying website files manually

At some point this stopped feeling like learning cloud and started feeling like repetitive operations work.

So I built a Bash automation script that handles the entire deployment process in one run.

> Run script → Get live website deployed automatically.

This project helped me understand how infrastructure automation actually works behind DevOps workflows.

---

## Architecture

```text
┌──────────────────────────────┐
│        Local Machine         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         Bash Script          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           AWS CLI            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       EC2 Provisioning       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Security Group + Key Pair    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        SSH Into EC2          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Apache + Git Installation    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   GitHub Website Deployment  │
└──────────────────────────────┘
```

---

## Stack

- **Bash Scripting** — automation logic
- **AWS CLI** — cloud provisioning
- **Amazon EC2** — compute instance
- **Security Groups** — firewall rules
- **SSH** — remote server access
- **Apache2** — web server
- **Git** — website deployment
- **GitHub** — website source repository

---

## Screenshots

### Script Overview

![Script Overview](Screenshot%20From%202026-05-17%2001-31-27.png)

*Initial section of the Bash script containing AWS configuration, instance naming logic, and AWS CLI installation.*

---

### AWS Configuration Validation

![AWS Configuration Validation](Screenshot%20From%202026-05-17%2001-31-37.png)

*Checking AWS CLI configuration automatically before deployment begins.*

---

### Key Pair & Security Group Creation

![Security Group Creation](Screenshot%20From%202026-05-17%2001-31-45.png)

*Creating SSH key pair and dynamically configuring AWS security groups.*

---

### Inbound Rules Configuration

![Inbound Rules](Screenshot%20From%202026-05-17%2001-31-51.png)

*Automatically opening ports 22, 80, and 443 for SSH, HTTP, and HTTPS access.*

---

### EC2 Instance Provisioning

![EC2 Provisioning](Screenshot%20From%202026-05-17%2001-31-56.png)

*Launching EC2 instance and waiting for instance startup.*

---

### Public IP & Instance Details

![Public IP Retrieval](Screenshot%20From%202026-05-17%2001-32-01.png)

*Fetching public IP address and displaying EC2 instance details automatically.*

---

### Apache Deployment Automation

![Apache Deployment](Screenshot%20From%202026-05-17%2001-32-05.png)

*Connecting to EC2 remotely and deploying Apache web server automatically.*

---

### Final Deployment Output

![Final Output](Screenshot%20From%202026-05-17%2001-32-10.png)

*Final deployment output showing live website URL and SSH access command.*

---

## Demo Video

<video width="100%" controls>
  <source src="https://drive.google.com/uc?export=download&id=1p2j1ycb9_qcprT8s9OdowQ4ZEAkui-y_" type="video/mp4">
</video>

*Complete walkthrough of EC2 provisioning, Apache installation, and automated website deployment.*

---

## Features

### Automatic AWS CLI Validation

The script checks whether AWS CLI credentials are configured before deployment.

```bash
aws sts get-caller-identity
```

If AWS CLI is not configured:

```bash
aws configure
```

is triggered automatically.

---

### Dynamic Security Group Automation

Automatically creates or reuses security groups and configures:

- SSH → Port 22
- HTTP → Port 80
- HTTPS → Port 443

No manual AWS Console configuration required.

---

### Automatic EC2 Provisioning

Creates EC2 instance using:

```bash
aws ec2 run-instances
```

with custom:

- AMI ID
- Instance Type
- Security Group
- Key Pair
- Tags

---

### Remote Apache Deployment

After EC2 launch, the script:

- SSHs into server automatically
- installs Apache and Git
- clones website repository
- deploys website files
- restarts Apache service

Everything happens automatically inside one script.

---

## Script Output Example

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

## Challenges I Faced

### SSH Timing Issue

Initially SSH failed because EC2 wasn't fully ready.

Adding:

```bash
aws ec2 wait instance-running
```

and proper delays solved the problem.

---

### Public IP Delays

Sometimes the instance launched before public IP assignment completed.

The fix was simply waiting before fetching the IP.

---

### Key Pair Conflicts

AWS throws duplicate key pair errors if the same key already exists.

The script now automatically:

- deletes old key pair
- recreates new one
- downloads fresh `.pem`

making the script reusable.

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">100%</div>
    <div class="project-stat-label">Automated Deployment</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">1</div>
    <div class="project-stat-label">Single Bash Script</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">3</div>
    <div class="project-stat-label">Ports Configured</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">∞</div>
    <div class="project-stat-label">Manual Steps Saved</div>
  </div>
</div>

---

## What I Learned

This project helped me understand:

- infrastructure automation
- cloud provisioning
- AWS CLI workflows
- SSH automation
- deployment orchestration
- server bootstrap processes

Most importantly:

> Real DevOps starts when repetitive infrastructure tasks become automated workflows.

---

## Future Improvements

- Terraform version
- Route53 integration
- HTTPS using Let's Encrypt
- Nginx reverse proxy
- Docker deployment support
- CI/CD pipeline integration
- Multi-instance deployments

---

## Repository

Full Bash automation script and deployment workflow available in the repository.

---

— Harsh Yadav  
DevOps & Cloud engineer in the making  
Built it. Broke it. Understood it.