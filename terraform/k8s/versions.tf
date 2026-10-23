terraform {
  required_version = ">= 1.9"

  # Same bucket as the infra root: terraform init -backend-config="bucket=<tfstate_bucket>"
  backend "gcs" {
    prefix = "k8s"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.6"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.3"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.3"
    }
  }
}

data "terraform_remote_state" "infra" {
  backend = "gcs"
  config = {
    bucket = var.tfstate_bucket
    prefix = "infra"
  }
}

locals {
  infra = data.terraform_remote_state.infra.outputs
}

provider "google" {
  project = local.infra.project_id
  region  = local.infra.region
}

data "google_client_config" "this" {}

provider "kubernetes" {
  host                   = "https://${local.infra.cluster_endpoint}"
  token                  = data.google_client_config.this.access_token
  cluster_ca_certificate = base64decode(local.infra.cluster_ca_certificate)
}

provider "helm" {
  kubernetes = {
    host                   = "https://${local.infra.cluster_endpoint}"
    token                  = data.google_client_config.this.access_token
    cluster_ca_certificate = base64decode(local.infra.cluster_ca_certificate)
  }
}
