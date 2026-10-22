resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "random_password" "coturn_secret" {
  length  = 32
  special = false
}
