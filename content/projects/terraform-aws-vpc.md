# Terraform AWS VPC Module

A reusable, production-ready Terraform module for provisioning AWS VPCs. Public and private subnets across multiple availability zones, NAT gateways, security groups, VPC endpoints — everything a real workload needs, defined once and instantiated everywhere.

---

## The Problem It Solves

Every AWS project I started had the same boilerplate VPC setup: copy-paste from the last project, adjust CIDRs, forget to update the NAT gateway count, wonder why the private subnet can't reach the internet three hours later.

I wrote this module once properly. Now I instantiate it in 30 seconds.

---

## What It Provisions

```
VPC (10.0.0.0/16)
├── Public Subnets (one per AZ)
│   ├── Internet Gateway
│   ├── Route: 0.0.0.0/0 → IGW
│   └── Auto-assign public IPs: true
├── Private Subnets (one per AZ)
│   ├── NAT Gateway (in public subnet)
│   ├── Route: 0.0.0.0/0 → NAT
│   └── Auto-assign public IPs: false
├── VPC Endpoints (optional)
│   ├── S3 Gateway endpoint
│   └── ECR API/DKR endpoints
└── Default Security Group
    └── Locked down (no ingress, no egress)
```

---

## Module Usage

```hcl
module "vpc" {
  source = "github.com/harshyadav/terraform-aws-vpc"

  project            = "hashwithharsh"
  environment        = "prod"
  aws_region         = "ap-south-1"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]

  # Cost optimisation: one NAT per AZ for prod, one shared for dev
  single_nat_gateway = false

  # VPC endpoints keep S3 traffic off the internet
  enable_s3_endpoint  = true
  enable_ecr_endpoint = true

  tags = {
    Team      = "platform"
    CostCenter = "infra"
  }
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}
```

---

## Architecture Diagram

![AWS VPC architecture showing public and private subnets across three availability zones with NAT gateways](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=80)

*Three-AZ setup: each AZ has one public and one private subnet, each with its own NAT gateway for AZ-level fault isolation*

---

## Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `project` | string | — | Project name, used in resource names and tags |
| `environment` | string | — | `dev`, `staging`, or `prod` |
| `vpc_cidr` | string | `10.0.0.0/16` | VPC CIDR block |
| `availability_zones` | list(string) | — | List of AZs to use |
| `single_nat_gateway` | bool | `false` | Share one NAT for all AZs (saves money in dev) |
| `enable_s3_endpoint` | bool | `true` | Add S3 gateway VPC endpoint |
| `enable_ecr_endpoint` | bool | `false` | Add ECR API + DKR endpoints |

---

## Screenshots

<div class="project-gallery">
  <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80" alt="AWS console showing VPC subnets across availability zones" />
  <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80" alt="Terraform plan output showing resources to be created" />
</div>

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">24</div>
    <div class="project-stat-label">AWS resources</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">3</div>
    <div class="project-stat-label">AZs supported</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">~2min</div>
    <div class="project-stat-label">Apply time</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">100%</div>
    <div class="project-stat-label">Idempotent</div>
  </div>
</div>

---

## Cost Considerations

A NAT gateway costs roughly **$0.045/hour + $0.045/GB** in ap-south-1. For production, one per AZ gives you fault isolation. For dev, `single_nat_gateway = true` cuts the NAT bill by 66%.

VPC endpoints for S3 and ECR are free. They keep traffic inside AWS's network and can meaningfully reduce data transfer costs if you're pulling a lot of ECR images.

---

## Lessons Learned

The `cidrsubnet` function in Terraform is your friend. Rather than hardcoding subnet CIDRs, I compute them:

```hcl
# Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)

# Private subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
```

The offset of `+10` gives enough gap between public and private ranges that adding more subnets later doesn't require renumbering.
