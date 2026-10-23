resource "random_id" "project_suffix" {
  byte_length = 3
}

resource "google_project" "this" {
  name            = var.project_name
  project_id      = "${var.project_id_prefix}-${random_id.project_suffix.hex}"
  billing_account = var.billing_account
  org_id          = var.org_id
  folder_id       = var.folder_id

  deletion_policy = "PREVENT"
}

locals {
  services = [
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "dns.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
    "sts.googleapis.com",
  ]
}

resource "google_project_service" "this" {
  for_each = toset(local.services)

  project            = google_project.this.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "tfstate" {
  project  = google_project.this.project_id
  name     = "${google_project.this.project_id}-tfstate"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.this]
}
