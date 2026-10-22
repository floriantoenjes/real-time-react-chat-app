# DNS for the domain stays at Namecheap. Only the ACME challenge is delegated here:
# Namecheap gets NS records for acme.<domain> and a CNAME
# _acme-challenge.<domain> -> _acme-challenge.acme.<domain>, which cert-manager follows.
resource "google_dns_managed_zone" "acme" {
  name        = "acme"
  dns_name    = "acme.${var.domain}."
  description = "Delegated zone for Let's Encrypt DNS-01 challenges"
}

# cert-manager authenticates as its Kubernetes ServiceAccount via Workload Identity Federation;
# this project only contains the acme zone, so project-wide dns.admin stays narrow.
resource "google_project_iam_member" "cert_manager_dns" {
  project = var.project_id
  role    = "roles/dns.admin"
  member  = "principal://iam.googleapis.com/projects/${data.google_project.this.number}/locations/global/workloadIdentityPools/${var.project_id}.svc.id.goog/subject/ns/cert-manager/sa/cert-manager"
}
