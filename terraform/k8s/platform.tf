resource "helm_release" "traefik" {
  name             = "traefik"
  namespace        = "traefik"
  create_namespace = true
  repository       = "https://traefik.github.io/charts"
  chart            = "traefik"
  version          = "41.7.1"

  values = [yamlencode({
    ingressClass = {
      enabled        = true
      isDefaultClass = false
      name           = "traefik"
    }
    service = {
      spec = {
        loadBalancerIP        = local.infra.ingress_ip
        externalTrafficPolicy = "Local"
      }
    }
    ports = {
      web = {
        http = {
          redirections = {
            entryPoint = { to = "websecure", scheme = "https", permanent = true }
          }
        }
      }
      websecure = {
        # Socket.io and PeerJS keep WebSockets open for hours
        transport = { respondingTimeouts = { readTimeout = 0 } }
      }
    }
  })]
}

resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  version          = "v1.21.2"

  values = [yamlencode({
    crds = { enabled = true }
    # The KSA cert-manager/cert-manager is granted roles/dns.admin via Workload Identity (infra/dns.tf).
    # Public resolvers so the CNAME to the delegated zone is followed like Let's Encrypt sees it.
    extraArgs = [
      "--dns01-recursive-nameservers-only",
      "--dns01-recursive-nameservers=8.8.8.8:53,1.1.1.1:53",
    ]
  })]
}

# Restarts coturn when cert-manager renews the certificate; coturn only reads it on startup.
resource "helm_release" "reloader" {
  name             = "reloader"
  namespace        = "reloader"
  create_namespace = true
  repository       = "https://stakater.github.io/stakater-charts"
  chart            = "reloader"
  version          = "2.2.18"
}

resource "kubernetes_namespace_v1" "app" {
  metadata {
    name = "realtime-chat"
  }
}

resource "helm_release" "cert_issuers" {
  name      = "cert-issuers"
  namespace = "cert-manager"
  chart     = "${path.module}/charts/cert-issuers"

  values = [yamlencode({
    email          = var.acme_email
    environment    = var.letsencrypt_environment
    project        = local.infra.project_id
    hostedZoneName = local.infra.acme_zone_name
    certificate = {
      namespace  = kubernetes_namespace_v1.app.metadata[0].name
      secretName = "wildcard-cert"
      dnsNames   = [local.infra.domain, "*.${local.infra.domain}"]
    }
  })]

  depends_on = [helm_release.cert_manager]
}
