variable "project_id" {
  description = "Project ID created by the bootstrap root."
  type        = string
}

variable "tfstate_bucket" {
  description = "State bucket from the bootstrap root (CI gets access to it)."
  type        = string
}

variable "region" {
  type    = string
  default = "europe-west3"
}

variable "zone" {
  description = "Zone of the (zonal) GKE cluster."
  type        = string
  default     = "europe-west3-a"
}

variable "domain" {
  description = "Apex domain; the app is served on whatsapp./peer./turn.<domain>."
  type        = string
  default     = "floriantoenjes.com"
}

variable "github_repository" {
  description = "owner/repo allowed to push images and deploy via Workload Identity Federation."
  type        = string
  default     = "floriantoenjes/real-time-react-chat-app"
}

variable "node_machine_type" {
  type    = string
  default = "e2-standard-2"
}

variable "node_count_max" {
  type    = number
  default = 2
}

variable "use_spot_nodes" {
  description = "Spot VMs are ~60-90% cheaper but can be preempted at any time."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Protects the GKE cluster from `terraform destroy`."
  type        = bool
  default     = true
}
