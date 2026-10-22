variable "tfstate_bucket" {
  description = "State bucket from the bootstrap root (to read the infra outputs)."
  type        = string
}

variable "acme_email" {
  description = "Let's Encrypt account email (expiry notices)."
  type        = string
}

variable "letsencrypt_environment" {
  description = "Start with staging to avoid rate limits, switch to production once the certificate becomes Ready."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.letsencrypt_environment)
    error_message = "Must be staging or production."
  }
}

variable "image_tag" {
  description = "Tag of the realtime-chat-gke image in Artifact Registry."
  type        = string
}
