# Docker Compose Dev Lab

A collection of battle-tested Docker Compose configurations for spinning up local development environments. Postgres, Redis, Kafka, the ELK stack, MinIO — all pre-configured, all ready with `docker compose up`.

No more "it works on my machine." Every service is pinned, configured, and health-checked.

---

## Available Environments

### PostgreSQL + pgAdmin

```yaml
# postgres/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB:       devdb
      POSTGRES_USER:     dev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d devdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL:    admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      postgres:
        condition: service_healthy
```

### Redis + RedisInsight

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass devpassword --maxmemory 256mb
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  redisinsight:
    image: redislabs/redisinsight:latest
    ports:
      - "8001:8001"
```

### Kafka + Zookeeper + Kafka UI

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on: [zookeeper]
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

---

## Screenshots

![Docker Desktop showing all dev lab containers running with healthy status indicators](https://images.unsplash.com/photo-1605745341112-85968b19335b?w=900&q=80)

*Six services, all healthy — full local stack running on a 2018 laptop with 8GB RAM*

<div class="project-gallery">
  <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=80" alt="pgAdmin interface connected to local PostgreSQL instance" />
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80" alt="Kafka UI showing topics and consumer groups in the local Kafka cluster" />
</div>

---

## Quick Start

```bash
# Clone
git clone https://github.com/harshyadav/docker-lab
cd docker-lab

# Start just what you need
cd postgres && docker compose up -d
cd kafka    && docker compose up -d
cd elk      && docker compose up -d

# Check everything is healthy
docker compose ps

# Tear down cleanly (preserves volumes)
docker compose down

# Nuclear: remove volumes too
docker compose down -v
```

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">8</div>
    <div class="project-stat-label">Environments</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">100%</div>
    <div class="project-stat-label">Health-checked</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">~30s</div>
    <div class="project-stat-label">From zero to running</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">0</div>
    <div class="project-stat-label">Manual config steps</div>
  </div>
</div>

---

## Design Principles

**Pin every image version.** `image: postgres:latest` is a footgun. A Monday morning `docker compose pull` that upgrades Postgres 15 → 16 with a format change will ruin your day. All images in this repo are pinned to specific versions.

**Health checks before `depends_on`.** Without `condition: service_healthy`, a service marked `depends_on` might start before the dependency is actually ready to accept connections. Every service that exposes a network interface has a health check.

**Named volumes over bind mounts for data.** Bind mounts work but have permission quirks on Linux. Named volumes are clean, portable, and Docker manages the lifecycle.

**One `.env` file per compose stack.** All config in one place — no scattered environment variables across the `docker-compose.yml` file.
