# K8s Monitoring Stack

A full production-grade observability setup for a multi-node Kubernetes cluster. Prometheus scrapes metrics from every node and workload, Grafana visualizes them across 30+ dashboards, and Alertmanager pages when something actually breaks.

---

## Why I Built This

Running Kubernetes without observability is flying blind. I stood up a bare-metal cluster (see the [Kubernetes from Scratch](/post.html?slug=kubernetes-from-scratch) post) and immediately had no idea what was happening inside it. CPU spikes, pod restarts, memory pressure — all invisible. This project fixed that.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                  │
│                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌───────────┐  │
│  │ Node        │   │ Node        │   │ Node      │  │
│  │ Exporter    │   │ Exporter    │   │ Exporter  │  │
│  └──────┬──────┘   └──────┬──────┘   └─────┬─────┘  │
│         │                 │                │         │
│         └────────┬─────────┘                │         │
│                  ▼                          │         │
│          ┌──────────────┐                  │         │
│          │  Prometheus  │◄─────────────────┘         │
│          └──────┬───────┘                            │
│                 │                                    │
│         ┌───────┴────────┐                           │
│         ▼                ▼                           │
│    ┌─────────┐    ┌──────────────┐                   │
│    │ Grafana │    │ Alertmanager │                   │
│    └─────────┘    └──────────────┘                   │
└──────────────────────────────────────────────────────┘
```

---

## Stack

- **Prometheus** — metrics collection and storage (15-day retention)
- **Grafana** — dashboards and visualization
- **Alertmanager** — alert routing to Slack
- **Node Exporter** — host-level metrics (CPU, memory, disk, network)
- **kube-state-metrics** — Kubernetes object metrics (pod states, deployments)
- **kube-prometheus-stack** Helm chart — packages all of the above

---

## Screenshots

![Grafana cluster overview dashboard showing CPU and memory utilization across all nodes](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80)

*Cluster compute overview — real-time CPU and memory across all nodes*

![Grafana dashboard showing Kubernetes pod health and restart counts](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80)

*Pod health dashboard — restart counts, OOMKills, and pending pods tracked*

---

## Demo

<!-- YouTube embed — replace VIDEO_ID with your actual video -->
<div class="video-embed">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    title="K8s Monitoring Stack Demo"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>

*Walkthrough: deploying the stack, exploring dashboards, and firing a test alert to Slack*

---

## Key Metrics I Track

```promql
# CPU usage across the cluster
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (node) * 100)

# Memory pressure per namespace
sum(container_memory_working_set_bytes{namespace!=""}) by (namespace)

# Pod restart rate (anything > 0 over an hour gets flagged)
increase(kube_pod_container_status_restarts_total[1h]) > 0

# Disk usage warning at 80%
(node_filesystem_size_bytes - node_filesystem_free_bytes) /
node_filesystem_size_bytes * 100 > 80
```

---

## Stats

<div class="project-stat-bar">
  <div class="project-stat-item">
    <div class="project-stat-value">30+</div>
    <div class="project-stat-label">Grafana dashboards</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">15d</div>
    <div class="project-stat-label">Metric retention</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">&lt;30s</div>
    <div class="project-stat-label">Alert response time</div>
  </div>
  <div class="project-stat-item">
    <div class="project-stat-value">3</div>
    <div class="project-stat-label">Nodes monitored</div>
  </div>
</div>

---

## Installation

```bash
# Add the Helm repo
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
helm repo update

# Deploy to monitoring namespace
kubectl create namespace monitoring
helm install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values values.yaml
```

The `values.yaml` I use with persistent storage and Slack alerting is in the repo linked below.

---

## Lessons Learned

**Persistent storage is not optional.** First time I deployed this, metrics lived in a `emptyDir`. When the Prometheus pod restarted, I lost two weeks of data. Lesson learned.

**Scrape intervals matter.** Default is 1 minute. For detecting short CPU spikes, I dropped it to 15s on production nodes — memory cost is real, but the signal fidelity is worth it.

**Alert fatigue is real.** The default kube-prometheus-stack rules fire on almost everything. I spent a week tuning thresholds and silencing noisy rules before I trusted the alerts enough to act on them immediately.

---

## Repository

Full Helm values, custom PrometheusRule CRDs, Alertmanager Slack config, and the Grafana dashboard JSON exports are all in the repo.
