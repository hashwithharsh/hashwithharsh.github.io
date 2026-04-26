# Monitoring Your Cluster with Prometheus + Grafana

You don't know what your cluster is doing until you can see it. Metrics, dashboards, alerts — this is the full observability stack I set up for a real Kubernetes cluster using Helm.

We're covering Prometheus for metrics collection, Grafana for visualization, and Alertmanager for wiring up notifications when something breaks.

---

## Why Not Just Cloud-Native Monitoring?

AWS CloudWatch, GCP Cloud Monitoring — they work, they're managed, and they cost money in ways that surprise you. The Prometheus + Grafana stack is:

- **Free** (open source)
- **More powerful** (PromQL > CloudWatch metrics math)
- **Portable** (same stack on any cloud or bare metal)
- **The industry standard** — you'll encounter it everywhere

---

## Install with kube-prometheus-stack

The `kube-prometheus-stack` Helm chart is the right way to do this. It installs Prometheus, Grafana, Alertmanager, and a set of pre-built dashboards and alert rules.

```bash
# Add the Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace monitoring

# Install with custom values
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values monitoring-values.yaml
```

The `monitoring-values.yaml`:

```yaml
# monitoring-values.yaml
grafana:
  adminPassword: "change-me-in-production"
  
  # Persistent storage for dashboards and settings
  persistence:
    enabled: true
    size: 5Gi
  
  # Ingress if you have an ingress controller
  ingress:
    enabled: false  # set to true with your actual domain

prometheus:
  prometheusSpec:
    # How long to keep metrics (storage trade-off)
    retention: 15d
    
    # Persistent storage for metrics data
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 20Gi
    
    # Scrape all ServiceMonitors in any namespace
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false

alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 2Gi
```

```bash
# Verify everything is running
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

---

## Accessing the Dashboards

```bash
# Grafana — port forward to access locally
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# Open: http://localhost:3000 (admin / change-me-in-production)

# Prometheus UI
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
# Open: http://localhost:9090

# Alertmanager UI
kubectl port-forward -n monitoring svc/kube-prometheus-stack-alertmanager 9093:9093
```

The kube-prometheus-stack comes with about 30 pre-built Grafana dashboards. The ones I use daily:
- **Kubernetes / Compute Resources / Cluster** — overall CPU/memory
- **Kubernetes / Compute Resources / Namespace** — per-namespace breakdown
- **Node Exporter / Full** — host-level metrics
- **Kubernetes / Networking / Cluster** — network I/O

---

## PromQL: The Query Language

PromQL takes time to click. Here are the queries I actually use:

```promql
# CPU usage per node (percentage)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (node) * 100)

# Memory usage per pod
container_memory_usage_bytes{namespace="production", container!=""}

# HTTP request rate to a service (requests/sec over 5 min window)
rate(http_requests_total{job="my-service"}[5m])

# Error rate (5xx responses as % of total)
sum(rate(http_requests_total{status=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100

# Pod restart count over 1 hour
increase(kube_pod_container_status_restarts_total[1h]) > 0

# Disk usage (warning when >80%)
(node_filesystem_size_bytes - node_filesystem_free_bytes) /
node_filesystem_size_bytes * 100 > 80
```

Key PromQL concepts to understand:
- **Instant vector** — current value: `up`
- **Range vector** — values over time: `up[5m]`
- **`rate()`** — per-second rate of a counter over a range
- **`increase()`** — total increase over a range (not per-second)
- **`by (label)`** — group by a label value

---

## Instrumenting Your Own App

The pre-built dashboards cover infrastructure. For your application metrics, you need to instrument your code:

```python
# Python — prometheus_client library
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define metrics
REQUEST_COUNT = Counter(
    'app_requests_total',
    'Total request count',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'app_request_latency_seconds',
    'Request latency in seconds',
    ['endpoint'],
    buckets=[.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5]
)

ACTIVE_USERS = Gauge('app_active_users', 'Number of active users')

# Use them in your code
def handle_request(method, endpoint):
    start = time.time()
    try:
        result = process_request()
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status='200').inc()
        return result
    except Exception as e:
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status='500').inc()
        raise
    finally:
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(time.time() - start)

# Expose /metrics endpoint
start_http_server(8000)  # Prometheus scrapes this
```

Then tell Prometheus to scrape it:

```yaml
# ServiceMonitor custom resource (created by kube-prometheus-stack CRDs)
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: my-app    # must match your Service labels
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

---

## Alerting

The kube-prometheus-stack includes default PrometheusRule resources with sensible alerts (node down, pod crashlooping, disk pressure, etc.). Add your own:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
  namespace: monitoring
spec:
  groups:
  - name: application
    rules:
    # Alert if error rate > 5% for 5 minutes
    - alert: HighErrorRate
      expr: |
        sum(rate(http_requests_total{status=~"5.."}[5m])) /
        sum(rate(http_requests_total[5m])) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }}"

    # Alert if pod has restarted more than 3 times in an hour
    - alert: PodCrashLooping
      expr: increase(kube_pod_container_status_restarts_total[1h]) > 3
      for: 0m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
```

---

## Wiring Alertmanager to Slack

```yaml
# alertmanager-config.yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: slack-config
  namespace: monitoring
spec:
  route:
    receiver: slack-notifications
    groupBy: ['alertname', 'severity']
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 12h
  
  receivers:
  - name: slack-notifications
    slackConfigs:
    - apiURL:
        name: slack-webhook-secret
        key: webhook-url
      channel: '#alerts'
      title: '{{ .CommonAnnotations.summary }}'
      text: '{{ .CommonAnnotations.description }}'
      sendResolved: true
```

---

The full Helm values and PrometheusRule examples are in the [k8s-monitoring-stack repo](https://github.com/harshyadav/k8s-monitoring). It's what I actually run, not a clean demo — including the mistakes and workarounds.
