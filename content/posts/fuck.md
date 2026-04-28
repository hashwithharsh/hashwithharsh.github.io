# 🐧 Linux Day 1 — Foundations & Filesystem Navigation

Goal: Build a strong mental model of Linux and filesystem navigation.  
If this foundation is weak, everything later in DevOps becomes confusing.

---

# 1. What Linux Actually Is

Linux is an **Operating System (OS)** that manages:

- CPU
- Memory
- Storage
- Processes
- Networking

Almost every modern infrastructure runs Linux:

- Cloud servers
- Containers
- CI/CD runners
- Kubernetes nodes

---

# 2. Linux Architecture

```
User
  ↓
Shell
  ↓
System Libraries
  ↓
Kernel
  ↓
Hardware
```

## Kernel

The core of Linux.

Responsibilities:

- CPU scheduling
- Memory management
- Device management
- Process control

## Shell

Command interpreter that allows users to interact with Linux.

Common shell:

```
bash
```

Example commands:

```
ls
cd /home
```

## System Libraries

Libraries that allow applications to communicate with the kernel.

## Hardware

Physical components like:

- CPU
- RAM
- Disk
- Network devices

---

# 3. Linux Filesystem

Unlike Windows which uses multiple drives:

```
C:\
D:\
```

Linux uses **one filesystem tree** starting at:

```
/
```

This is the **root directory**.

Everything in Linux exists under `/`.

---

# 4. Important Linux Directories

```
/
├── bin
├── boot
├── dev
├── etc
├── home
├── lib
├── proc
├── root
├── tmp
├── usr
└── var
```

## /bin

Essential commands:

```
ls
cp
mv
cat
```

## /etc

System configuration files.

Examples:

```
/etc/passwd
/etc/ssh/sshd_config
```

## /home

User home directories.

Example:

```
/home/user1
/home/user2
```

## /root

Home directory for the root (administrator) user.

## /var

Variable system data.

Important directory:

```
/var/log
```

Used for logs and debugging.

## /tmp

Temporary files.

Often cleared after reboot.

## /dev

Device files representing hardware.

Examples:

```
/dev/sda
/dev/null
```

## /proc

Virtual filesystem showing kernel information.

Examples:

```
/proc/cpuinfo
/proc/meminfo
```

---

# 5. Basic Linux Commands

## Current Directory

```
pwd
```

Example output:

```
/home/user
```

## List Files

```
ls
```

Detailed list:

```
ls -l
```

Shows:

- permissions
- owner
- size
- timestamp

## Show Hidden Files

```
ls -a
```

Better version:

```
ls -la
```

---

# 6. Change Directory

Go to directory:

```
cd /etc
```

Go back:

```
cd ..
```

Go home:

```
cd ~
```

---

# 7. File & Directory Operations

Create directory:

```
mkdir devops
```

Create file:

```
touch file1.txt
```

Copy file:

```
cp file1.txt file2.txt
```

Move / rename file:

```
mv file2.txt file3.txt
```

Delete file:

```
rm file3.txt
```

---

# 8. Understanding Paths

Two types of paths.

## Absolute Path

Starts from root `/`.

Example:

```
/home/user/file.txt
```

Best for scripts and automation.

## Relative Path

Relative to current directory (`pwd`).

Examples:

```
../file.txt
./script.sh
scripts/deploy.sh
```

---

# 9. Hands-On Practice

Step 1

```
mkdir linux_day1
cd linux_day1
```

Step 2

```
mkdir devops
mkdir cloud
mkdir scripts
```

Step 3

```
touch file1.txt
touch file2.txt
touch file3.txt
```

Step 4

```
mv file1.txt devops/
mv file2.txt cloud/
```

Step 5

```
cp cloud/file2.txt scripts/
```

Step 6

```
ls -R
```

---

# 10. Filesystem Exploration

Run:

```
ls /
ls /etc
ls /var
ls /home
ls /usr
```

Explore the system to understand Linux structure.

---

# 11. Command Drills

Run each command **10 times**:

```
pwd
ls
ls -l
ls -a
cd ..
cd /
cd ~
```

Practice:

```
mkdir test
touch test/file.txt
rm test/file.txt
rmdir test
```

---

# 12. End of Day Mission

Create this structure using commands only:

```
linux_practice
 ├── project1
 │    ├── config
 │    └── logs
 └── project2
      └── scripts
```

Create files inside:

```
deploy.sh
config.yaml
log1.txt
```

---

# Day 1 Skills Checklist

By the end of Day 1 you should understand:

- Linux architecture
- Linux filesystem structure
- Absolute vs relative paths
- File navigation
- File creation
- File movement
- Directory operations

---

# Quick Interview Questions

### Difference between absolute and relative paths?

Absolute path:

```
/home/user/file.txt
```

Relative path:

```
../file.txt
```

---

### Navigate from

```
/home/user/projects
```

to

```
/etc
```

Command:

```
cd /etc
```

---

### Show hidden files

```
ls -a
```

Better:

```
ls -la
```

---

# Next Lesson — Day 2

Topics:

- grep
- find
- sed
- awk
- log parsing
- system searching

These tools are used daily by DevOps engineers.
