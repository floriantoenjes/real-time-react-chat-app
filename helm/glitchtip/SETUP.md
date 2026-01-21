# GlitchTip Error Tracking

This Helm chart installs GlitchTip with PostgreSQL as a complete error tracking stack.

Based on the official [GlitchTip Helm Chart](https://gitlab.com/glitchtip/glitchtip-helm-chart/).

## Prerequisites

Add the required Helm repositories (one-time setup):
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add glitchtip https://gitlab.com/api/v4/projects/16325141/packages/helm/stable
helm repo update
```

## Installation

1. Update chart dependencies:
```bash
helm dependency update helm/glitchtip
```

2. Install the stack:
```bash
helm upgrade --install glitchtip ./helm/glitchtip
```

## Accessing GlitchTip

With ingress enabled (default), access at:
```
https://glitchtip.floriantoenjes.com
```

Or port-forward if ingress is disabled:
```bash
kubectl port-forward -n glitchtip svc/glitchtip-web 8000:80
```

## Initial Setup

1. Open GlitchTip in your browser
2. Create your first user account (first user becomes admin)
3. Create an organization and project
4. Copy the DSN and use it in your applications

## Configuration

### Setting SECRET_KEY (Required for Production)

Set a secure Django SECRET_KEY in `values.yaml`:
```yaml
glitchtip:
  env:
    secret:
      SECRET_KEY: "your-secure-random-key"
```

Or use an existing Kubernetes secret:
```yaml
glitchtip:
  existingSecret: my-glitchtip-secrets
```

### Database Credentials

Database credentials are configured in `values.yaml` under `postgresql.auth` and must match the `DATABASE_URL` in `glitchtip.env.secret`.

## Verification

Check that all pods are running:
```bash
kubectl get pods -n glitchtip
```

Check migration job completed:
```bash
kubectl get jobs -n glitchtip
```

## Components

- **PostgreSQL**: Database backend (Bitnami chart)
- **GlitchTip Web**: Main application
- **GlitchTip Worker**: Background job processor
- **Valkey**: Caching layer (included with GlitchTip)

## Updating

1. Update Helm repos: `helm repo update`
2. Update the image tag in `values.yaml`
3. Preview changes: `helm diff upgrade glitchtip ./helm/glitchtip -n glitchtip`
4. Apply upgrade: `helm upgrade glitchtip ./helm/glitchtip -n glitchtip`
