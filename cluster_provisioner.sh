#!/bin/bash
for i in {1..2}
do
  gcloud container clusters create lt"$i" --zone=europe-north1-a --project sap-kyma-jellyfish-dev
  SERVER=$(kubectl config view --raw -ojson | jq -r '.clusters[] | select(.name=="gke_sap-kyma-jellyfish-dev_europe-north1-a_lt'${i}'") | .cluster.server')
  CERT_DATA=$(kubectl config view --raw -ojson | jq -r '.clusters[] | select(.name=="gke_sap-kyma-jellyfish-dev_europe-north1-a_lt'${i}'") | .cluster."certificate-authority-data"')
  ENCODED=$(echo "apiVersion: v1
  kind: Config
  current-context: my-cluster
  contexts: [{name: my-cluster, context: {cluster: cluster-1, user: user-1}}]
  users: [{name: user-1, user: {auth-provider: {name: gcp}}}]
  clusters:
  - name: cluster-1
    cluster:
      server: \"${SERVER}\"
      certificate-authority-data:$CERT_DATA" | base64)
  echo $ENCODED
  index=$((i+1))
  kubectl get secret -n manifest-operator manifest-operator-targets-test -ojson | jq '.data["kubeconfig-tsm0'${index}'.yaml"]="'${ENCODED}'"' | kubectl apply -f -
done


#k config use-context gke_sap-kyma-jellyfish-dev_europe-north1-a_tsm01
#k config view -ojson | jq -r '.clusters[] | select(.name=="gke_sap-kyma-jellyfish-dev_europe-north1-a_lt1")'

