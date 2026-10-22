output "app_url" {
  value = "https://whatsapp.${local.infra.domain}"
}

output "check_certificate" {
  value = "kubectl -n realtime-chat get certificate wildcard-cert"
}
