# Kubernetes Monitoring Stack

## Overview

Full observability setup for a multi-node Kubernetes cluster using the industry-standard monitoring tools. This stack provides comprehensive metrics collection, visualization, and intelligent alerting to catch issues before your users do.

## Project Details

**Status:** Active  
**Year:** 2025  
**Technologies:** Kubernetes, Prometheus, Grafana, Alertmanager, Loki

## Architecture

The monitoring stack consists of:

- **Prometheus**: Scrapes metrics from all cluster components and applications
- **Grafana**: Visualizes metrics with custom dashboards and real-time alerts
- **Alertmanager**: Routes and manages alerts based on configurable rules
- **Loki**: Log aggregation for debugging and tracing

## Key Features

1. **Multi-node monitoring** - Tracks all nodes, pods, and services
2. **Custom dashboards** - Pre-built Grafana dashboards for quick insights
3. **Intelligent alerting** - Alert on anomalies, thresholds, and system events
4. **Log aggregation** - All cluster logs in one searchable interface
5. **Auto-discovery** - Prometheus auto-discovers new pods and services

## Repository

GitHub: [github.com/harshyadav/k8s-monitoring](https://github.com/harshyadav/k8s-monitoring)

## What I Learned

- Prometheus scrape configs and service discovery
- PromQL queries for complex metric analysis
- Building production-grade dashboards in Grafana
- Alert routing and notification channels
- Kubernetes DNS and service discovery mechanics

## Next Steps

- Implement long-term metrics storage (Victoria Metrics)
- Add distributed tracing with Jaeger
- Build custom Prometheus exporters for application metrics
