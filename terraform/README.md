# Deploying to GKE with Terraform

Three Terraform roots, applied in order:

| Root        | State                | Creates                                                                                                    |
|-------------|----------------------|------------------------------------------------------------------------------------------------------------|
| `bootstrap` | local                | GCP project, enabled APIs, GCS bucket for the other states                                                 |
| `infra`     | GCS, prefix `infra`  | VPC, zonal GKE cluster, 2 static IPs, Cloud DNS zone for ACME, Artifact Registry, uploads bucket + HMAC key, GitHub OIDC, generated secrets |
| `k8s`       | GCS, prefix `k8s`    | Traefik, cert-manager, Reloader, Let's Encrypt issuer + wildcard certificate, the `helm/realtime-chat` release |

`infra` and `k8s` are separate so the Helm/Kubernetes providers are configured from a cluster that already exists.

## How TLS works

coturn terminates TLS itself (`turns:` on 5349), so it needs the certificate **and private key** as files.
Google-managed certificates never expose the key, so cert-manager issues a Let's Encrypt wildcard
certificate for `floriantoenjes.com` / `*.floriantoenjes.com` into the Secret `wildcard-cert`, which
both Traefik (Ingress TLS) and coturn mount.

Let's Encrypt validates via **DNS-01**, which doesn't need a running load balancer. DNS stays at Namecheap;
only `_acme-challenge` is CNAMEd into the Terraform-managed Cloud DNS zone `acme.floriantoenjes.com`,
where cert-manager writes the TXT records. Reloader restarts coturn when the certificate is renewed.

The static IPs are reserved before anything is deployed, so DNS and coturn's `external-ip` are known up front.

## First-time setup

Prerequisites: `terraform` >= 1.9, `gcloud`, a billing account.

```bash
gcloud auth application-default login
gcloud billing accounts list
```

**1. Bootstrap**

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars   # set billing_account
terraform init && terraform apply
terraform output next_steps
```

Keep `bootstrap/terraform.tfstate` safe (it is gitignored); it only manages the project and the state bucket.

**2. Infrastructure**

```bash
cd ../infra
cp terraform.tfvars.example terraform.tfvars   # project_id, tfstate_bucket from step 1
terraform init -backend-config="bucket=<tfstate_bucket>"
terraform apply
terraform output namecheap_records
```

**3. DNS at Namecheap (once)**

Domain List → Manage → Advanced DNS → add every record from `namecheap_records`
(A records for `whatsapp`, `peer`, `turn`; the `_acme-challenge` CNAME; the `acme` NS records).
Remove any existing records for these hosts first. Check:

```bash
dig +short _acme-challenge.floriantoenjes.com CNAME
dig +short NS acme.floriantoenjes.com
```

**4. First image**

Set the GitHub repository variables listed at the top of `.github/workflows/release.yaml`
(values from `terraform output` in `bootstrap` and `infra`) and push a tag. The workflow builds the image
and runs step 5 itself. To do step 5 locally instead, build and push the image manually:

```bash
gcloud auth configure-docker europe-west3-docker.pkg.dev
IMAGE=$(terraform -chdir=terraform/infra output -raw image_repository)
docker buildx build --platform linux/amd64 --push -t $IMAGE:1.9.10 \
  --build-arg VITE_PEERJS_SERVER_HOST=peer.floriantoenjes.com \
  --build-arg VITE_PEERJS_SERVER_PORT=443 \
  --build-arg VITE_TURN_SERVER_URL=turns:turn.floriantoenjes.com:5349 .
```

**5. Kubernetes**

```bash
cd terraform/k8s
cp terraform.tfvars.example terraform.tfvars   # tfstate_bucket, acme_email, image_tag
terraform init -backend-config="bucket=<tfstate_bucket>"
terraform apply
```

This starts with the Let's Encrypt **staging** issuer (untrusted certificate, generous rate limits). Once
`kubectl -n realtime-chat get certificate wildcard-cert` shows `READY True`, set
`letsencrypt_environment = "production"` and apply again; the certificate is reissued automatically.

```bash
gcloud container clusters get-credentials realtime-chat --zone europe-west3-a --project <project_id>
```

## Deploying new versions

Push a tag. The workflow builds `IMAGE_REPOSITORY:<tag>` and runs `terraform apply` in `terraform/k8s`
with `image_tag=<tag>`. Terraform is the single owner of the Helm releases, so don't `helm upgrade` by hand.

## Troubleshooting

- Certificate not ready: `kubectl describe certificate,certificaterequest,order,challenge -A` and
  `kubectl -n cert-manager logs deploy/cert-manager`. Usually the CNAME/NS records aren't live yet.
- coturn pod stuck in `ContainerCreating`: it waits for the `wildcard-cert` Secret.
- TLS on the TURN port: `openssl s_client -connect turn.floriantoenjes.com:5349 -servername turn.floriantoenjes.com`.
- Calls connect only on the same network: check `chrome://webrtc-internals` for a `relay` candidate pair.
  With `no-udp`, the relay port range may need to be opened on the coturn Service.
- Uploads fail with a checksum/signature error from GCS: set `requestChecksumCalculation: 'WHEN_REQUIRED'`
  on the S3 client in `backend/src/modules/global/object-storage.service.ts`.

## Teardown

`terraform destroy` in `k8s`, then `infra` (set `deletion_protection = false` and apply first).
The project itself has `deletion_policy = "PREVENT"`.
