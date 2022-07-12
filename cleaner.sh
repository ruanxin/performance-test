#!/bin/bash
kubectl get manifests -o custom-columns="NAME:metadata.name" | xargs -n1 kubectl patch manifest -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl get manifests -o custom-columns="NAME:metadata.name" | xargs -n1 kubectl --wait=false delete manifest

kubectl get kyma -o custom-columns="NAME:metadata.name" | xargs -n1 kubectl patch kyma -p '{"metadata":{"finalizers":null}}' --type=merge
kubectl get kyma -o custom-columns="NAME:metadata.name" | xargs -n1 kubectl --wait=false delete kyma
