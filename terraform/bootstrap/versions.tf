terraform {
  required_version = ">= 1.9"

  # Local state on purpose: this root creates the bucket the other roots keep their state in.
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.6"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }
}

provider "google" {
  region = var.region
}
