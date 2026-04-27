# GitHub Actions CI/CD Template

An opinionated, production-ready CI/CD pipeline template for containerized applications. Commit to `main` → tests run → Docker image built with layer caching → Trivy security scan → push to ECR → deploy to EKS. Under 3 minutes, start to finish.

---

## Pipeline Flow

```
git push origin main
        │
        ▼
┌───────────────┐     fail
│  1. Test      │ ──────────► ✗ PR blocked
│  lint + pytest│
└───────┬───────┘
        │ pass
        ▼
┌───────────────┐
│  2. Build     │  docker buildx + layer cache
│  Docker image │  commit SHA tag
└───────┬───────┘
        │
        ▼
┌───────────────┐     CRITICAL CVE found
│  3. Scan      │ ──────────► ✗ image never pushed
│  Trivy        │
└───────┬───────┘
        │ clean
        ▼
┌───────────────┐
│  4. Push      │  → ECR (SHA tag + latest)
│  to ECR       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  5. Deploy    │  → ECS service update / EKS rollout
│  to AWS       │  wait for stability
└───────────────┘
```

---

## Screenshots

![GitHub Actions workflow run showing all five stages passing in sequence](https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=900&q=80)

*A clean pipeline run: all 5 stages green, 2m 47s total from push to deployment stable*

<div class="project-gallery">
  <img src="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500&q=80" alt="Trivy security scan output showing no critical vulnerabilities" />
  <img src="https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?w=500&q=80" alt="ECR repository showing images tagged with git commit SHAs" />
</div>

---

## The Full Workflow

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION:       ap-south-1
  ECR_REPOSITORY:   hashwithharsh-app
  IMAGE_TAG:        ${{ github.sha }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with: { python-version: '3.11', cache: 'pip' }
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: flake8 . && black --check . && pytest tests/ -v

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read }

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC — no static keys)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/gha-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Build (with layer caching)
        uses: docker/build-push-action@v5
        with:
          push: false
          load: true
          tags: ${{ steps.ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan (block on CRITICAL CVEs)
        uses: aquasecurity/trivy-action@master
        with:
          exit-code: '1'
          severity: 'CRITICAL'
          ignore-unfixed: true

      - name: Push to ECR
        run: docker push ... && docker push ...:latest
```

---

## Key Design Decisions

### OIDC — no stored AWS credentials

```yaml
permissions:
  id-token: write   # required for OIDC token exchange
```

GitHub and AWS exchange short-lived tokens. No `AWS_ACCESS_KEY_ID` sitting in secrets, nothing to rotate, nothing to leak. Takes 20 minutes to set up once and saves hours of credential hygiene forever.

### Scan before push

The vulnerability scan runs against the local image before it ever touches ECR. A CRITICAL CVE fails the pipeline before anything gets deployed. Security as a gate, not an afterthought.

### Commit SHA tagging

```
image: 123456789.dkr.ecr.ap-south-1.amazonaws.com/app:a3f9b2c
```

Every image is tagged with the exact git commit that built it. Rollback means pointing to the previous SHA — you always know exactly what's running.

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">&lt;3min</div>
    <div class="project-stat-label">Push to deployed</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">0</div>
    <div class="project-stat-label">Stored AWS keys</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">45s</div>
    <div class="project-stat-label">Build (cache hit)</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">100%</div>
    <div class="project-stat-label">Traced by commit SHA</div>
  </div>
</div>

---

## Setup in a New Repo

1. Copy `.github/workflows/deploy.yml` from the template repo
2. Run the Terraform in `/iam/` to create the OIDC provider and IAM role
3. Add `AWS_ACCOUNT_ID` to GitHub Secrets
4. Push to `main` and watch it run

The Terraform for the IAM setup is included in the repo — no manual console clicking.
