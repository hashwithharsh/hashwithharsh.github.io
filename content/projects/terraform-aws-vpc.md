# Terraform AWS VPC Module

## Overview

A production-ready, reusable Terraform module for provisioning AWS Virtual Private Clouds with all the networking essentials: public and private subnets, NAT gateways, security groups, and high availability across multiple availability zones.

## Project Details

**Status:** Active  
**Year:** 2025  
**Technologies:** Terraform, AWS, Infrastructure as Code

## What This Module Does

This module handles the complete VPC setup with industry best practices:

- Multi-AZ deployment for redundancy
- Public subnets with internet gateway access
- Private subnets with NAT gateway for outbound traffic
- Configurable security group rules
- Network ACLs for additional security layers
- Proper routing tables and associations

## Module Architecture

```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   └── Internet Gateway
├── Private Subnets (10.0.10.0/24, 10.0.11.0/24)
│   └── NAT Gateway
└── Security Groups & NACLs
```

## Usage

```hcl
module "vpc" {
  source = "github.com/harshyadav/terraform-aws-vpc"
  
  vpc_cidr = "10.0.0.0/16"
  enable_nat_gateway = true
  enable_dns_support = true
}
```

## Repository

GitHub: [github.com/harshyadav/terraform-aws-vpc](https://github.com/harshyadav/terraform-aws-vpc)

## Key Learnings

- Terraform module design patterns
- AWS networking fundamentals
- High availability architecture
- State management and remote backends
- Terraform testing and validation

## Why This Matters

Instead of manually creating VPCs through the AWS console, this module:
- Reduces setup time from hours to minutes
- Ensures consistency across projects
- Follows security best practices
- Scales to multiple environments easily
