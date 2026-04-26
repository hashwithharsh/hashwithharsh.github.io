# Docker Compose Dev Lab

## Overview

A curated collection of Docker Compose configurations for spinning up complete development environments. Every common service you need is already configured, tested, and ready to run locally. No more "works on my machine" excuses.

## Project Details

**Status:** Active  
**Year:** 2024  
**Technologies:** Docker, Docker Compose, DevOps

## What's Included

### Database Services
- **PostgreSQL** - With persistent volumes and custom initialization
- **MongoDB** - Pre-configured with replica sets
- **Redis** - Caching and session management

### Message Queues
- **Kafka** - Full cluster with Zookeeper
- **RabbitMQ** - With management UI

### Observability
- **ELK Stack** - Elasticsearch, Logstash, Kibana
- **Prometheus + Grafana** - Metrics and visualization

### Development Tools
- **pgAdmin** - PostgreSQL management GUI
- **Mongo Express** - MongoDB administration
- **Redis Commander** - Redis GUI

## Quick Start

```bash
# Start the entire stack
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f service-name
```

## Repository

GitHub: [github.com/harshyadav/docker-lab](https://github.com/harshyadav/docker-lab)

## Features

- **Pre-configured services** - Sensible defaults for immediate use
- **Health checks** - Services validate their own startup
- **Networking** - All services communicate on a shared network
- **Persistent data** - Volumes configured to survive container restarts
- **Environment variables** - Customizable through `.env` file

## Use Cases

- **Onboarding developers** - Run everything needed for development
- **Testing integrations** - Test with real services, not mocks
- **Local CI/CD testing** - Replicate production services locally
- **Learning** - Understand how services communicate
- **Experimentation** - Try new technologies without cluttering your system

## Lessons Learned

- Docker networking and service discovery
- Volume management and data persistence
- Docker Compose override files for environments
- Service health checks and dependencies
- Resource limits and optimization

## Pro Tips

1. Use `docker-compose.override.yml` for local customizations
2. Set resource limits to avoid consuming your entire machine
3. Use service dependencies wisely — some services need startup time
4. Leverage named volumes for data persistence
