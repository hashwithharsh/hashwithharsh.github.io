# Building a Real CI/CD Pipeline with GitHub Actions

Most CI/CD tutorials show you "Hello World" workflows. This is about an actual pipeline I use: commit goes in, tests run, Docker image gets built and scanned for vulnerabilities, pushed to ECR, and deployed to a running service — all under 3 minutes.

---

## The Pipeline Overview

```
push to main
     │
     ▼
┌─────────────┐
│    Test     │  ← unit tests, lint
└─────┬───────┘
      │ pass
      ▼
┌─────────────┐
│   Build     │  ← docker buildx, layer caching
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Scan      │  ← Trivy vulnerability scanner
└─────┬───────┘
      │ no critical CVEs
      ▼
┌─────────────┐
│    Push     │  ← push to ECR with commit SHA tag
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Deploy    │  ← update ECS task definition, or trigger ArgoCD
└─────────────┘
```

---

## The Full Workflow File

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: hashwithharsh-app
  IMAGE_TAG: ${{ github.sha }}

jobs:
  # ─── Job 1: Test ───────────────────────────
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt -r requirements-dev.txt

      - name: Lint
        run: |
          flake8 . --max-line-length 100
          black --check .

      - name: Run tests
        run: pytest tests/ -v --tb=short

  # ─── Job 2: Build + Scan + Push ────────────
  build-and-push:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    permissions:
      id-token: write   # required for OIDC
      contents: read

    outputs:
      image-uri: ${{ steps.build.outputs.image-uri }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false   # build first, scan, then push
          tags: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          load: true

      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          format: 'table'
          exit-code: '1'           # fail pipeline on CRITICAL CVEs
          severity: 'CRITICAL'
          ignore-unfixed: true

      - name: Push to ECR
        run: |
          docker push ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          # Also tag as 'latest'
          docker tag \
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }} \
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:latest
          docker push ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:latest

      - name: Output image URI
        id: output
        run: echo "image-uri=${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}" >> $GITHUB_OUTPUT

  # ─── Job 3: Deploy ──────────────────────────
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: production   # requires manual approval if configured

    permissions:
      id-token: write
      contents: read

    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS service
        run: |
          # Get current task definition
          TASK_DEFINITION=$(aws ecs describe-task-definition \
            --task-definition hashwithharsh-app \
            --query taskDefinition)
          
          # Update container image
          NEW_TASK_DEF=$(echo $TASK_DEFINITION | jq \
            --arg IMAGE "${{ needs.build-and-push.outputs.image-uri }}" \
            '.containerDefinitions[0].image = $IMAGE')
          
          # Register new task definition revision
          NEW_TASK_ARN=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query taskDefinition.taskDefinitionArn \
            --output text)
          
          # Update service to use new task definition
          aws ecs update-service \
            --cluster hashwithharsh-cluster \
            --service hashwithharsh-app \
            --task-definition $NEW_TASK_ARN \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster hashwithharsh-cluster \
            --services hashwithharsh-app
          echo "✓ Deployment stable"
```

---

## The Key Decisions Explained

### OIDC instead of access keys

```yaml
permissions:
  id-token: write

- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT:role/github-actions-deploy
```

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in secrets. Instead, GitHub and AWS exchange short-lived tokens via OIDC. No credentials to rotate, no credentials to leak.

Setting this up takes 20 extra minutes. It's worth it.

### Layer caching with BuildKit

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

GitHub Actions caches Docker layer cache between runs. On cache hit, a build that used to take 4 minutes drops to 45 seconds.

### Scan before push

The security scan happens on the local image before it ever touches ECR. If Trivy finds a critical CVE, the image never gets pushed and deployment never happens.

### Commit SHA as image tag

```yaml
IMAGE_TAG: ${{ github.sha }}
```

Every image is tagged with the exact commit that built it. This makes rollbacks trivial: you know exactly what code is in every image. `latest` is convenient but tells you nothing about what's actually running.

---

## Secrets and Environment Setup

In your repository: **Settings → Secrets and variables → Actions**

```
AWS_ACCOUNT_ID   = 123456789012
```

That's literally the only secret needed with OIDC. The IAM role handles everything else.

The IAM role trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_USERNAME/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

---

## What Makes This Different from Tutorial Pipelines

1. **OIDC auth** — no static credentials
2. **Vulnerability scanning** before push — security gate, not afterthought  
3. **Commit SHA tagging** — full traceability
4. **Layer caching** — actually fast
5. **ECS deployment** — real cloud service update, not just a docker run somewhere

The full template with the IAM Terraform code to set up the OIDC provider is [on GitHub](https://github.com/harshyadav/cicd-template).
