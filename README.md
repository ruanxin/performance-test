This is a poc load test demo to verify if the concept to combine both client-side (offered by k6) and server-side (offered by prometheus metrics) performance indicators as test criteria can be integrated into a load test workflow.

# Prerequisite
- Compile k6 with xk6-exec extension

  Follow the steps here: https://github.com/grafana/xk6-exec
  The k6 binary under this repository is already compiled with this extension, can be used directly.

- Deploy prometheus operator to control plane cluster
    ```
    cd kube-prometheus-with-pvc
    kubectl apply --server-side -f manifests/setup
    until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
    kubectl apply -f manifests/
    ```

- Create grafana api token and replace `apiToken` in `trackingAlerts()` (`load_generator.js`)

# Run test

- Port forward grafana
- Run load test
    ```
    ./k6 run load_generator.js
    ```
# Update helm chart
- update `Chart.yaml` version
- run `helm package kyma-load-test`
- move generated package to /docs
- reindex helm repo `helm repo index docs --url https://ruanxin.github.io/performance-test/`
- commit changes