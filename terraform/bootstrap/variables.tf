variable "project_name" {
  description = "Display name of the GCP project."
  type        = string
  default     = "realtime-chat"
}

variable "project_id_prefix" {
  description = "Prefix for the globally unique project ID; a random suffix is appended."
  type        = string
  default     = "realtime-chat"
}

variable "billing_account" {
  description = "Billing account ID (XXXXXX-XXXXXX-XXXXXX), see `gcloud billing accounts list`."
  type        = string
}

variable "org_id" {
  description = "Optional organization ID. Leave both org_id and folder_id null for a personal account without an organization."
  type        = string
  default     = null
}

variable "folder_id" {
  description = "Optional folder ID to create the project in."
  type        = string
  default     = null
}

variable "region" {
  description = "Default region, also used for the state bucket."
  type        = string
  default     = "europe-west3"
}
