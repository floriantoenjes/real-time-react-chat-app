# Loki-Grafana Logging Stack

This Helm chart installs Grafana, Loki, and Promtail as a complete logging stack.

## Prerequisites

1. Have the realtime-chat Helm chart with the s3mock container installed.

2. Add the Grafana Helm repository (one-time setup):
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

## Installation

1. Update chart dependencies:
```bash
helm dependency update helm/loki-grafana
```

2. Install the stack:
```bash
helm upgrade --install loki-grafana ./helm/loki-grafana \
  --create-namespace --namespace logging
```

## Accessing Grafana

Port-forward to access Grafana:
```bash
kubectl port-forward -n logging svc/loki-grafana 3000:80
```

Open http://localhost:3000 in your browser.
- Username: `admin`
- Password: `admin`

## Configure Loki Data Source

In Grafana, add Loki as a data source with URL:
```
http://loki-grafana-loki-distributed-gateway.logging.svc.cluster.local:80
```

## Verification

Check that all pods are running:
```bash
kubectl get pods -n logging
```

## Components

- **Grafana**: Visualization and dashboards
- **Loki Distributed**: Log aggregation and storage (configured for S3 backend via s3mock)
- **Promtail**: Log collection agent (DaemonSet on all nodes)
