output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "domain" {
  value = var.domain
}

output "cluster_name" {
  value = google_container_cluster.this.name
}

output "cluster_location" {
  value = google_container_cluster.this.location
}

output "cluster_endpoint" {
  value = google_container_cluster.this.endpoint
}

output "cluster_ca_certificate" {
  value = google_container_cluster.this.master_auth[0].cluster_ca_certificate
}

output "ingress_ip" {
  value = google_compute_address.ingress.address
}

output "turn_ip" {
  value = google_compute_address.turn.address
}

output "acme_zone_name" {
  value = google_dns_managed_zone.acme.name
}

output "image_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.this.repository_id}/realtime-chat-gke"
}

output "uploads_bucket" {
  value = google_storage_bucket.uploads.name
}

output "s3_access_key_id" {
  value     = google_storage_hmac_key.uploads.access_id
  sensitive = true
}

output "s3_secret_access_key" {
  value     = google_storage_hmac_key.uploads.secret
  sensitive = true
}

output "jwt_secret" {
  value     = random_password.jwt_secret.result
  sensitive = true
}

output "coturn_secret" {
  value     = random_password.coturn_secret.result
  sensitive = true
}

output "github_workload_identity_provider" {
  description = "GitHub variable GCP_WORKLOAD_IDENTITY_PROVIDER"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_service_account" {
  description = "GitHub variable GCP_SERVICE_ACCOUNT"
  value       = google_service_account.github_deployer.email
}

output "namecheap_records" {
  description = "Create these once under Domain List > Manage > Advanced DNS."
  value       = <<-EOT
    Type    Host              Value
    A       whatsapp          ${google_compute_address.ingress.address}
    A       peer              ${google_compute_address.ingress.address}
    A       turn              ${google_compute_address.turn.address}
    CNAME   _acme-challenge   _acme-challenge.acme.${var.domain}.
    %{for ns in google_dns_managed_zone.acme.name_servers~}
    NS      acme              ${ns}
    %{endfor~}
  EOT
}
