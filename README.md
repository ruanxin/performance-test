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

- Deploy kyma operator and manifest operator to control plane cluster
  - add manifest crds and missing permission
  ```
  k apply -f https://raw.githubusercontent.com/kyma-project/kyma-operator/main/operator/config/samples/component-integration-installed/rbac/component_rbac.yaml
  ```
  
# Run test

- Port forward grafana
- Run load test
    ```
    ./k6 run load_generator.js
    ```
# Finding

## Key indicates can be tweaked

### Controller Manager Options
#### SyncPeriod
> SyncPeriod determines the minimum frequency at which watched resources are reconciled. A lower period will correct entropy more quickly, but reduce responsiveness to change if there are many watched resources. Change this value only if you know what you are doing. Defaults to 10 hours if unset.

It assigns to Cache (Informer) `cache.Options.Resync`

#### DeltaFIFO
	// Replace will delete the contents of the store, using instead the
	// given list. Store takes ownership of the list, you should not reference
	// it after calling this function.
	Replace([]interface{}, string) error

	// Resync is meaningless in the terms appearing here but has
	// meaning in some implementations that have non-trivial
	// additional behavior (e.g., DeltaFIFO).
	Resync() error
####