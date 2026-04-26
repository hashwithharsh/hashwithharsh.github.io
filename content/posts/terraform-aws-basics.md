# Terraform + AWS: My First Real Infrastructure as Code

I'd read about Terraform for months before actually using it. The concept felt simple — write config files, run `terraform apply`, infrastructure appears. Reality was more interesting.

This is what I learned building my first real Terraform project: a VPC with public and private subnets, an EC2 instance, an S3 bucket, and the IAM roles to connect them. And the story of how I accidentally deleted my dev environment on day 3.

---

## What Terraform Actually Is

Terraform is a tool that manages the full lifecycle of infrastructure resources. You declare what you want in `.tf` files, and Terraform figures out the API calls needed to make reality match your declaration.

The key insight: Terraform doesn't just create resources. It tracks them in a **state file** and manages the difference between "what exists" and "what you declared." That's where the real power (and the footguns) live.

---

## Project Structure

I settled on this structure after a few iterations:

```
infra/
├── main.tf          # providers and top-level config
├── variables.tf     # input variables
├── outputs.tf       # what to expose after apply
├── vpc.tf           # networking
├── compute.tf       # EC2
├── storage.tf       # S3
├── iam.tf           # roles and policies
└── terraform.tfvars # actual variable values (git-ignored!)
```

One file per concern. You could do it all in `main.tf` but that gets unreadable fast.

---

## Setting Up the Provider

```hcl
# main.tf
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — do this from day 1, not as an afterthought
  backend "s3" {
    bucket         = "hashwithharsh-tf-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "hashwithharsh-lab"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

The `default_tags` block is underrated. Every resource I create gets tagged automatically. Makes cost attribution actually work.

---

## The VPC

```hcl
# vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project}-vpc" }
}

# Public subnets — internet facing
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true
  tags = { Name = "${var.project}-public-${count.index + 1}" }
}

# Private subnets — no direct internet access
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${var.project}-private-${count.index + 1}" }
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

# NAT Gateway so private subnets can reach the internet (outbound only)
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${var.project}-nat" }
  depends_on    = [aws_internet_gateway.main]
}
```

The `cidrsubnet` function is useful — it does the subnet math for you based on the parent CIDR block.

---

## Variables and tfvars

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}
```

```hcl
# terraform.tfvars — this file is git-ignored
environment = "dev"
aws_region  = "ap-south-1"
```

The `validation` block on the environment variable catches mistakes before they reach AWS. I learned to add more of these after my third accidental prod deployment.

---

## The Apply Workflow

```bash
# Always run plan first — read it entirely before applying
terraform init
terraform plan -out=tfplan

# Review the plan output carefully:
# + = create
# ~ = update in-place  
# -/+ = destroy and recreate (dangerous!)
# - = destroy

terraform apply tfplan
```

**Lesson learned:** `-/+ destroy and recreate` means downtime. See that on a database and stop immediately.

---

## The Incident

On day 3, I ran:

```bash
terraform destroy
```

I was trying to destroy a specific resource with `-target`. I forgot the `-target` flag. It asked me to confirm by typing `yes`. I typed `yes`.

Terraform destroyed my entire dev environment in 47 seconds.

This is why:
1. Remote state with locking is not optional
2. Specific resource destruction: `terraform destroy -target=aws_instance.web`
3. I now always paste the exact command I want to run, never type from memory

---

## State: The Thing That Will Bite You

The state file tracks every resource Terraform manages. It lives in `terraform.tfstate` or (better) in S3.

Things that will corrupt or confuse your state:

```bash
# Never do this — it deletes state but not the real resource
# The resource becomes unmanaged (orphaned)
terraform state rm aws_instance.web

# If someone creates a resource manually in AWS console,
# import it into state before Terraform tries to create a duplicate:
terraform import aws_instance.web i-0abc123def456789
```

The golden rule: **never touch infrastructure manually if Terraform manages it.** 

---

## What I'd Tell Past Me

1. **Set up remote state on day 1.** Local state is a single-machine, single-failure trap.

2. **Use workspaces for environments.** `terraform workspace new staging` keeps state separate without duplicating code.

3. **Read the plan output like a contract.** It tells you exactly what will happen. Surprises in `terraform apply` are your fault for not reading.

4. **Modules from day 1 if you have multiple environments.** Write once, instantiate many times with different variables.

5. **`terraform fmt` and `terraform validate` before every commit.** Add them to your pre-commit hook.

---

The full VPC module code is on [my GitHub](https://github.com/harshyadav/terraform-aws-vpc) if you want the complete working version. It's cleaner than this tutorial and handles edge cases I didn't cover here.
