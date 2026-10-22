terraform {
  required_version = ">= 1.9"

  # Bucket comes from the bootstrap root: terraform init -backend-config="bucket=<tfstate_bucket>"
  backend "gcs" {
    prefix = "infra"
  }

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
  project = var.project_id
  region  = var.region
}

data "google_project" "this" {}
