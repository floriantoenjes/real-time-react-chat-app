# Uploaded images/audio. The backend talks S3, which GCS supports via its interoperability
# API with HMAC keys (endpoint https://storage.googleapis.com).
resource "google_storage_bucket" "uploads" {
  name     = "${var.project_id}-uploads"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

resource "google_service_account" "uploads" {
  account_id   = "realtime-chat-uploads"
  display_name = "realtime-chat backend object storage (HMAC)"
}

resource "google_storage_bucket_iam_member" "uploads" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectAdmin"
  member = google_service_account.uploads.member
}

resource "google_storage_hmac_key" "uploads" {
  service_account_email = google_service_account.uploads.email
}
