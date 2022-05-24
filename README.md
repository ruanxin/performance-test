This is a poc load test demo to verify if the concept to combine both client-side (offered by k6) and server-side (offered by prometheus metrics) performance indicators as test criteria can be integrated into a load test workflow.

# Prerequisite
- Compile k6 with xk6-exec extension

  Follow the steps here: https://github.com/grafana/xk6-exec

- Deploy prometheus operator to control plane cluster
    ```
    git clone https://github.com/prometheus-operator/kube-prometheus.git
    cd kube-prometheus
    git checkout release-0.10
    
    kubectl apply --server-side -f manifests/setup
    until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
    kubectl apply -f manifests/
    ```

- Create grafana api token and replace `apiToken` in `trackingAlerts()` (`load_generator.js`)

- Deploy kyma operator and manifest operator to control plane cluster
  - add manifest crds and missing permission
  ```
  k apply -f https://raw.githubusercontent.com/kyma-project/manifest-operator/main/api/config/crd/bases/component.kyma-project.io_manifests.yaml
  k apply -f https://raw.githubusercontent.com/kyma-project/kyma-operator/main/operator/config/samples/component-integration-installed/rbac/component_rbac.yaml
  ```
  - deploy manifest moduletemplate
  ```
  k apply -f https://raw.githubusercontent.com/kyma-project/kyma-operator/main/operator/config/samples/component-integration-installed/operator_v1alpha1_moduletemplate_manifest_stable.yaml
  k apply -f https://raw.githubusercontent.com/kyma-project/kyma-operator/main/operator/config/samples/component-integration-installed/operator_v1alpha1_moduletemplate_manifest_rapid.yaml
  ```
  
# Run test

- Port forward grafana
- Run load test
    ```
    k6 run load_generator.js
    ```