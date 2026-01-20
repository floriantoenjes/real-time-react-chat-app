## Loki

`helm upgrade --install loki grafana/loki-distributed --namespace logging \
--set "loki.storage.type=s3" \                              
--set "loki.storage.bucketNames.chunks=loki" \
--set "loki.storage.bucketNames.ruler=loki" \
--set "loki.storage.bucketNames.admin=loki" \
--set "loki.storage.s3.endpoint=realtime-chat-s3mock.default.svc.cluster.local:9090" \
--set "loki.storage.s3.accessKeyId=" \
--set "loki.storage.s3.secretAccessKey=" \
--set "loki.storage.s3.insecure=true" \
--set "loki.storage.s3.s3ForcePathStyle=true"`

## Promtrail

`helm upgrade --values values.yaml --namespace logging  --install promtail grafana/promtail`

## Grafana

`helm upgrade --install grafana grafana/grafana --namespace logging \
--set "service.type=NodePort" \
--set "adminPassword=admin"`

`kubectl port-forward -n logging svc/grafana 3000:80`