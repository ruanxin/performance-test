## Compile k6 with xk6-kubernetes extension
Follow the steps here: https://github.com/grafana/xk6-kubernetes

## Deploy prometheus to K3d for local monitoring setup

```
git clone https://github.com/prometheus-operator/kube-prometheus.git
cd kube-prometheus
git checkout release-0.10

kubectl apply --server-side -f manifests/setup
until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
kubectl apply -f manifests/
```

create grafana api token and replace `apiToken` in `trackingAlerts()`