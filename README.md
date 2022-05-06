This is a poc load test demo to verify if the concept to combine both client-side (offered by k6) and server-side (offered by prometheus metrics) performance indicators as test criteria can be integrated into a load test workflow.

# Prerequisite
- Compile k6 with xk6-kubernetes extension

  Follow the steps here: https://github.com/grafana/xk6-kubernetes

- Deploy prometheus operator to target cluster
    ```
    git clone https://github.com/prometheus-operator/kube-prometheus.git
    cd kube-prometheus
    git checkout release-0.10
    
    kubectl apply --server-side -f manifests/setup
    until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
    kubectl apply -f manifests/
    ```

- Create grafana api token and replace `apiToken` in `trackingAlerts()` (`load_generator.js`)

# Run test

- Port forward grafana
- Run load test
    ```
    k6 run load_generator.js
    ```