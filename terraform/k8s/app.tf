resource "helm_release" "realtime_chat" {
  # The chart hard-codes service names like realtime-chat-redis, so the release name must stay "realtime-chat"
  name      = "realtime-chat"
  namespace = kubernetes_namespace_v1.app.metadata[0].name
  chart     = "${path.module}/../../helm/realtime-chat"

  # coturn stays ContainerCreating until cert-manager has issued wildcard-cert (DNS-01 takes a few minutes)
  timeout = 900

  values = [yamlencode({
    image = {
      repository = local.infra.image_repository
      tag        = var.image_tag
    }
    ingress = {
      className = "traefik"
    }
    coturn = {
      realm      = local.infra.domain
      externalIp = local.infra.turn_ip
      secretName = "wildcard-cert"
      selfSignedCert = {
        enabled = false
      }
      service = {
        loadBalancerIP = local.infra.turn_ip
      }
      deploymentAnnotations = {
        "secret.reloader.stakater.com/reload" = "wildcard-cert"
      }
    }
    s3 = {
      url        = "https://storage.googleapis.com"
      region     = "auto"
      bucketName = local.infra.uploads_bucket
      debug      = "true"
    }
    s3mock = {
      enabled = false
    }
    mongodb = {
      # Single-member replica set: three members in one zone on 1-2 nodes add little availability
      # but triple CPU/memory. Still a replica set, so the connection string stays the same.
      replicaCount = 1
      # With a limit, WiredTiger sizes its cache from the container instead of the whole node
      resources = {
        requests = { cpu = "100m", memory = "768Mi" }
        limits   = { memory = "1536Mi" }
      }
    }
  })]

  set_sensitive = [
    { name = "JWT_SECRET", value = local.infra.jwt_secret },
    { name = "coturn.secret", value = local.infra.coturn_secret },
    { name = "S3_ACCESS_KEY_ID", value = local.infra.s3_access_key_id },
    { name = "S3_SECRET_ACCESS_KEY", value = local.infra.s3_secret_access_key },
  ]

  depends_on = [helm_release.traefik, helm_release.cert_issuers, helm_release.reloader]
}
