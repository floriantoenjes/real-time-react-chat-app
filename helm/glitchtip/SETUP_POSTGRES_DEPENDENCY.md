`helm repo add bitnami https://charts.bitnami.com/bitnami`

`helm repo update`

`helm install postgres bitnami/postgresql \
  --set auth.postgresPassword=your-secure-password \
  --set auth.username=username \
  --set auth.password=password
  --set auth.database=auth`