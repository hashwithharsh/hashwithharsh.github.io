# I Automated EC2 + Apache Deployment… Then SSH Became the Real Problem
(demo video are on my Github mentioned above)

## Intro

Nobody tells you this when you start learning DevOps…

Creating an EC2 instance manually is fun exactly one time.

After that, it becomes:

- launch instance
- create keypair
- create security group
- open ports
- wait for public IP
- SSH into server
- install Apache
- clone repo
- deploy website

Repeat. Again. And again.

So I decided to automate the entire flow using a single Bash script.

Not Terraform.  
Not Ansible.  
Just pure shell scripting and AWS CLI.

And honestly… this project taught me more about automation flow than most “beginner DevOps projects” online.

---

# The Idea

The goal was simple:

Run one script → get a live website hosted on AWS automatically.

The script handles:

- AWS CLI installation
- AWS authentication check
- Key pair creation
- Security group creation
- EC2 launch
- Public IP fetching
- SSH connection
- Apache installation
- GitHub website deployment

Everything happens automatically.

Project script reference: :contentReference[oaicite:0]{index=0}

---

# Architecture

![Architecture Diagram](https://miro.medium.com/v2/resize:fit:1400/1*0g6U1Q2F3H9x4V4V9f1r9A.png)

```text
Local Machine
      ↓
Bash Script
      ↓
AWS CLI Commands
      ↓
EC2 Instance Created
      ↓
Security Group Attached
      ↓
SSH Into Server
      ↓
Apache Installed
      ↓
GitHub Repo Cloned
      ↓
Website Live
```

---

# Tech Used

- AWS EC2
- Bash Scripting
- AWS CLI
- Apache2
- Git
- Linux
- SSH

---

# What I Thought

I thought launching EC2 from Bash would be the difficult part.

Turns out…

The real challenge was handling all the small infrastructure details around it.

Things like:

- existing keypairs
- security group reuse
- waiting for SSH readiness
- instance startup delays
- permissions on `.pem` files
- SSH host verification

This is where automation projects become real.

---

# Deep Dive Into the Script

## 1. Dynamic EC2 Naming

The script first asks the user for an instance name.

```bash
read -p "enter ec2 instance name: " USER_INSTANCE_NAME
```

If nothing is entered, it uses a default name.

This small thing makes the script reusable.

---

## 2. AWS CLI Configuration Check

This part was important.

```bash
aws sts get-caller-identity
```

At first I ignored validation completely.

Bad idea.

Without checking authentication first, the entire automation fails later in confusing ways.

Now the script checks AWS authentication before continuing.

That changed everything.

---

## 3. Key Pair Automation

The script:

- deletes old keypairs
- creates a fresh one
- downloads the `.pem` file
- applies correct permissions

```bash
chmod 400 harsh-ec2key.pem
```

Linux permissions became very real here.

SSH is extremely strict with private keys.

If permissions are wrong, SSH refuses connection immediately.

Simple way to understand it:

Private keys are basically VIP passes.  
If everyone can access the pass, SSH stops trusting it.

---

## 4. Security Group Handling

The script intelligently:

- checks whether the security group exists
- creates it if missing
- adds:
  - SSH
  - HTTP
  - HTTPS rules

This part felt like infrastructure logic instead of scripting.

Because now the script is making decisions dynamically.

---

## 5. Waiting for EC2 Properly

This part saved me from multiple headaches.

```bash
aws ec2 wait instance-running
```

And later:

```bash
sleep 40
```

Why?

Because “instance running” does NOT mean:

- SSH is ready
- networking is ready
- packages are installable

I learned this the hard way after getting random SSH failures.

Something felt off there initially.

Turns out cloud infrastructure needs stabilization time.

---

## 6. Remote Deployment Through SSH

This was the most satisfying part.

The script SSHes into the server automatically:

```bash
ssh -o StrictHostKeyChecking=no -i ${KEY_NAME}.pem ubuntu@${PUBLIC_IP}
```

Then executes deployment commands remotely.

Including:

- Apache installation
- Git installation
- service enable/start
- GitHub repo clone
- moving files into `/var/www/html`

This is where it clicked.

Infrastructure automation is basically:

> “make machines configure themselves.”

---

# What Actually Happens Behind the Scenes

When the script runs:

1. AWS creates a virtual machine
2. Security rules are attached
3. A public IP gets assigned
4. SSH becomes available
5. Bash connects remotely
6. Commands execute on another Linux machine
7. Apache serves the website publicly

The crazy part?

All of this happens from one terminal window.

---

# Challenges I Faced

## SSH Connection Failures

This happened multiple times.

Reason?  
The instance was “running” but SSH wasn’t ready yet.

Fix:  
Added waiting delays.

---

## Existing Keypair Conflicts

AWS throws errors if the keypair already exists.

Fix:  
Delete old keypair before creating a new one.

---

## Apache Deployment Path Issues

Initially files were cloning into nested directories.

The website wouldn’t load correctly.

Fix:

```bash
sudo mv hashwithharsh.github.io/* .
```

Issue was simpler than expected.

---

# What I Learned

This project improved my understanding of:

- infrastructure automation
- AWS CLI workflows
- remote server management
- Linux permissions
- deployment pipelines
- SSH behavior
- Bash scripting structure

More importantly…

It changed how I think about automation.

Automation is not:

> “running commands automatically.”

It is:

> “handling every possible failure before users see it.”

---

# Real World Relevance

This is basically a mini deployment pipeline.

Real companies use more advanced tools like:

- Terraform
- Ansible
- Jenkins

But understanding this low-level flow matters a lot.

Because if automation breaks in production…

You still need to understand what’s happening underneath.

---

# Future Improvements

Things I want to add next:

- HTTPS with SSL
- Route53 domain setup
- Nginx reverse proxy
- Docker deployment support
- Terraform version
- Auto cleanup script
- CI/CD integration

---

# GitHub Repository

Example deployment repo cloned in script:

```bash
https://github.com/hashwithharsh/hashwithharsh.github.io.git
```


# Final Thoughts

This project looked small at first.

But it touched:

- cloud
- networking
- Linux
- security
- deployment
- automation

Which is basically the heart of DevOps.

And honestly…

Building projects like this teaches way more than watching another 2-hour tutorial.

---

— Harsh Yadav  
DevOps & Cloud engineer in the making  
Built it. Broke it. Understood it.