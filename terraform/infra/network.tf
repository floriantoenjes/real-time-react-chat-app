resource "google_compute_network" "this" {
  name                    = "realtime-chat"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "this" {
  name          = "realtime-chat-${var.region}"
  network       = google_compute_network.this.id
  region        = var.region
  ip_cidr_range = "10.10.0.0/20"

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}

# Reserved up front so the IPs can go into DNS and into coturn's config before any
# LoadBalancer Service exists. Regional, because both are passthrough Network LBs.
resource "google_compute_address" "ingress" {
  name   = "realtime-chat-ingress"
  region = var.region
}

resource "google_compute_address" "turn" {
  name   = "realtime-chat-turn"
  region = var.region
}
