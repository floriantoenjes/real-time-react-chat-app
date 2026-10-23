output "project_id" {
  value = google_project.this.project_id
}

output "tfstate_bucket" {
  value = google_storage_bucket.tfstate.name
}

output "next_steps" {
  value = <<-EOT
    terraform -chdir=../infra init -backend-config="bucket=${google_storage_bucket.tfstate.name}"
    terraform -chdir=../k8s   init -backend-config="bucket=${google_storage_bucket.tfstate.name}"
    infra/terraform.tfvars: project_id = "${google_project.this.project_id}", tfstate_bucket = "${google_storage_bucket.tfstate.name}"
  EOT
}
