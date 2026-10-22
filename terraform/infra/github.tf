# Lets GitHub Actions in var.github_repository push images and deploy without a key file.
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions deployer"
}

resource "google_service_account_iam_member" "github_deployer_wif" {
  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_artifact_registry_repository_iam_member" "github_deployer" {
  repository = google_artifact_registry_repository.this.name
  location   = google_artifact_registry_repository.this.location
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.github_deployer.member
}

# CI runs `terraform apply` on the k8s root, which also manages cluster-scoped resources
# (cert-manager CRDs, Traefik RBAC), hence admin rather than developer.
resource "google_project_iam_member" "github_deployer_gke" {
  project = var.project_id
  role    = "roles/container.admin"
  member  = google_service_account.github_deployer.member
}

# Read the infra state and read/write the k8s state
resource "google_storage_bucket_iam_member" "github_deployer_tfstate" {
  bucket = var.tfstate_bucket
  role   = "roles/storage.objectAdmin"
  member = google_service_account.github_deployer.member
}
