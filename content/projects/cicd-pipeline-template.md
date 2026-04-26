# GitHub Actions CI/CD Template

## Overview

An opinionated, production-ready CI/CD pipeline template for containerized applications. Automates the entire workflow from code push to production deployment with security scanning, testing, and artifact management built in.

## Project Details

**Status:** Active  
**Year:** 2025  
**Technologies:** GitHub Actions, Docker, Kubernetes, ECR, EKS

## Pipeline Stages

```
Code Push
  ↓
Build & Test
  ↓
Security Scan (Trivy)
  ↓
Push to ECR
  ↓
Deploy to EKS
  ↓
Health Checks
```

## Features

1. **Automated Testing** - Runs unit and integration tests on every push
2. **Container Security Scanning** - Trivy scans images for vulnerabilities
3. **ECR Integration** - Pushes images to AWS Elastic Container Registry
4. **Kubernetes Deployment** - Automatic deployment to EKS clusters
5. **Rollback on Failure** - Auto-rollback if health checks fail
6. **Deployment Notifications** - Slack/email notifications on status changes

## Configuration

The pipeline is highly configurable:

- Branch-specific deployments (main → prod, develop → staging)
- Environment variables for different stages
- Conditional steps based on branches or tags
- Manual approval gates for production deployments

## Repository

GitHub: [github.com/harshyadav/cicd-template](https://github.com/harshyadav/cicd-template)

## Use Cases

- **Microservices**: Deploy multiple services with dependency management
- **Monorepos**: Conditional builds for only changed services
- **Blue-Green Deployments**: Zero-downtime updates to production
- **GitOps**: Infrastructure-as-Code triggered by git commits

## Key Learnings

- GitHub Actions workflow syntax and advanced features
- Docker multi-stage builds for optimized images
- Kubernetes deployment strategies
- Security scanning and vulnerability management
- ECR authentication and image management

## What Makes This Special

Most CI/CD templates are either too simple or require extensive customization. This template strikes the balance: it's functional out-of-the-box but flexible enough for your specific needs.
