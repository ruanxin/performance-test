#! /bin/bash
indent() {
  local indentSize=1
  local indent=1
  if [ -n "$1" ]; then indent=$1; fi
  pr -to $(($indent * $indentSize))
}

HOSTS_FILE="/etc/hosts"

OPERATOR_NAME="kyma-operator"

COMPONENT_ARCHIVE="./example"
DATA_DIR="./data"
COMPONENT_RESOURCES="./resources.yaml"

PRIVATE_KEY="./private-key.pem"
PUBLIC_KEY="./public-key.pem"
PUBLIC_KEY_VERIFICATION_SECRET="./public-key-secret.yaml"
SIGNATURE_NAME="kyma-module-signature"

REMOTE_DESCRIPTOR="./remote-component-descriptor.yaml"
REMOTE_SIGNED_DESCRIPTOR="./remote-component-descriptor-signed.yaml"
SIGNED_PATH="signed"

MODULE_TEMPLATE="./generated-module-template.yaml"
MODULE_TEMPLATE_CHANNEL="stable"
MODULE_NAME="kyma-project.io/module/manifest1"
MODULE_VERSION="v0.0.56"
MODULE_PROFILE="production"

# this requires a k3d registry with a cluster
# e.g. k3d cluster create operator-test --registry-create operator-test-registry.localhost:50241
REGISTRY_NAME="operator-test-registry"
#REGISTRY_HOST="ghcr.io"
REGISTRY_HOST="https://europe-west3-docker.pkg.dev"
#REGISTRY_HOST="localhost"
REGISTRY_URL="${REGISTRY_HOST}/ruanxin"
REGISTRY_URL="${REGISTRY_HOST}/sap-kyma-jellyfish-dev/kyma-operator"
#REGISTRY_URL="${REGISTRY_HOST}:5000"
CHART_NAME="kyma-load-test"
PASSWORD=ya29.c.b0AXv0zTNbhYWunpyTtQXJ_-BXLcryi6SQkJqForyljqLsrnqVt7K6JF6tluh2uwZi3Cr9IZUGZmI9D76OaA3jza7VQqXfrLOOxyU-7l73Nyxxu_7TaZ5iPUr6iY4H3c9sxvPlOioLKw0hYxOprZl21fkX-mUttNhxKMRWv6Q3VrmiCtGZA5dhh9cNtYLSB6SryyBLqL-xbf3glVFLlcpEITxYLtbG-28R1BthyXI5AIvWRrVfuEbG20Gys3cF3pQZsJJehZhApGXd1I38wv5zIvPijjq9TM6ODjXyDOm6wETjouPVm6AZt3XW_x5FeU_qefr6tcONArdQE-lMfSID1hiC5d6PbLKAfeQu-VR0W3UnjYCOiM9X5Qiom2vMuZyXKrSFSDOMUdOyuUCkLK_qmPUOOCKtEQSrBtnU7f950TLJeNNIUSDdXiv0e0nkEWFEdmP0Yg5pB1qVCuW-qA

rm -rf "${DATA_DIR}/${CHART_NAME}"
helm repo add load-test-charts https://ruanxin.github.io/performance-test
helm pull "load-test-charts/${CHART_NAME}" --version=0.4.0 --untar --untardir ${DATA_DIR}

#if k3d registry get ${REGISTRY_NAME} | grep -q ${REGISTRY_NAME}; then
#   echo "OCI Registry ${REGISTRY_NAME} Exists, continuing..."
#else
#   echo "OCI Registry ${REGISTRY_NAME} does not exist!"
#   exit 1
#fi
#
#if grep -q "${REGISTRY_HOST}" ${HOSTS_FILE}; then
#    echo "${REGISTRY_HOST} is listed in host file, continuing..."
#else
#    echo "${REGISTRY_HOST} Doesn't exist in ${HOSTS_FILE}, will attempt to add it"
#    echo "127.0.0.1 ${REGISTRY_HOST}" >> ${HOSTS_FILE}
#fi

rm -r ${COMPONENT_ARCHIVE}

component-cli component-archive create ${COMPONENT_ARCHIVE} --component-name ${MODULE_NAME} --component-version ${MODULE_VERSION}
component-cli ca resources add ${COMPONENT_ARCHIVE} ${COMPONENT_RESOURCES}
#component-cli ca remote push -v9 ${COMPONENT_ARCHIVE} --repo-ctx ${REGISTRY_URL}
component-cli ca remote push -v9 --username oauth2accesstoken --password ${PASSWORD} ${COMPONENT_ARCHIVE} --repo-ctx ${REGISTRY_URL}

rm ${PRIVATE_KEY}
openssl genpkey -algorithm RSA -out ${PRIVATE_KEY}
rm ${PUBLIC_KEY}
openssl rsa -in ${PRIVATE_KEY} -pubout > ${PUBLIC_KEY}
component-cli ca signatures sign rsa ${REGISTRY_URL} ${MODULE_NAME} ${MODULE_VERSION} --upload-base-url ${REGISTRY_URL}/${SIGNED_PATH} --recursive --signature-name ${SIGNATURE_NAME} --private-key ${PRIVATE_KEY}
component-cli ca signatures verify rsa ${REGISTRY_URL}/${SIGNED_PATH} ${MODULE_NAME} ${MODULE_VERSION} --signature-name ${SIGNATURE_NAME} --public-key ${PUBLIC_KEY}

cat <<EOF > ${PUBLIC_KEY_VERIFICATION_SECRET}
apiVersion: v1
kind: Secret
metadata:
  name: kyma-signature-check #change with your kyma name
  labels:
    "operator.kyma-project.io/managed-by": "${OPERATOR_NAME}"
    "operator.kyma-project.io/signature": "${SIGNATURE_NAME}"
type: Opaque
data:
  key: $(cat ${PUBLIC_KEY} | base64)
EOF

echo "Public Key successfully generated as secret:"
kubectl apply -f ${PUBLIC_KEY_VERIFICATION_SECRET}

rm ${REMOTE_DESCRIPTOR}
component-cli ca remote get ${REGISTRY_URL} ${MODULE_NAME} ${MODULE_VERSION} >> ${REMOTE_DESCRIPTOR}
rm ${REMOTE_SIGNED_DESCRIPTOR}
component-cli ca remote get ${REGISTRY_URL}/${SIGNED_PATH} ${MODULE_NAME} ${MODULE_VERSION} >> ${REMOTE_SIGNED_DESCRIPTOR}

echo "Successfully generated Remote Descriptors in ${REMOTE_DESCRIPTOR} (Signed Version at ${REMOTE_SIGNED_DESCRIPTOR})"

cat <<EOF > ${MODULE_TEMPLATE}
apiVersion: operator.kyma-project.io/v1alpha1
kind: ModuleTemplate
metadata:
  name: moduletemplate-sample-manifest
  namespace: default
  labels:
    "operator.kyma-project.io/managed-by": "${OPERATOR_NAME}"
    "operator.kyma-project.io/controller-name": "manifest"
    "operator.kyma-project.io/module-name": "$(basename $MODULE_NAME)"
    "operator.kyma-project.io/profile": "${MODULE_PROFILE}"
  annotations:
    "operator.kyma-project.io/module-version": "$(yq e ".component.version" remote-component-descriptor-signed.yaml)"
    "operator.kyma-project.io/module-provider": "$(yq e ".component.provider" remote-component-descriptor-signed.yaml)"
    "operator.kyma-project.io/descriptor-schema-version": "$(yq e ".meta.schemaVersion" remote-component-descriptor-signed.yaml)"
    "operator.kyma-project.io/control-signature-name": "$(yq e ".signatures[0].name" remote-component-descriptor-signed.yaml)"
    "operator.kyma-project.io/generated-at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
spec:
  channel: ${MODULE_TEMPLATE_CHANNEL}
  data:
    kind: Manifest
    resource: manifests
    apiVersion: component.kyma-project.io/v1alpha1
  descriptor:
$(cat ${REMOTE_SIGNED_DESCRIPTOR} | indent 4)
EOF

echo "Generated ModuleTemplate at ${MODULE_TEMPLATE}"
#kubectl apply -f ${MODULE_TEMPLATE}