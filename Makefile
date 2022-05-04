#export KUBECONFIG=/Users/I552416/Downloads/kubeconfig--kyma-prow--rec-wkly-lt.yaml
#scale_down:
#	kubectl scale deploy  mothership-reconciler  --replicas=0 -n reconciler
#
#scale_up:
#	kubectl scale deploy  mothership-reconciler  --replicas=1 -n reconciler

port-forward-grafana:
	kubectl -n monitoring port-forward svc/grafana 3000

port-forward-prometheus:
	kubectl -n monitoring port-forward svc/prometheus-k8s 9090

#port-forward-postgresql:
#	kubectl -n reconciler port-forward svc/reconciler-postgresql 5555:5432

#port-forward-mothership-reconciler:
#	kubectl -n reconciler port-forward svc/reconciler-mothership-reconciler 8080:80
#
#port-forward-istio-reconciler:
#	kubectl -n reconciler port-forward svc/istio-configuration-reconciler 8081:8080
#
#port-forward-base-reconciler:
#	kubectl -n reconciler port-forward svc/base-reconciler 8082:8080


log-base-reconciler:
	kubectl -n reconciler logs base-reconciler-7b659d5fb8-q2mqv

log-mothership-reconciler:
	kubectl -n reconciler logs mothership-reconciler-777bcd4dcf-627hw mothership-reconciler

log-istio-reconciler:
	kubectl -n reconciler logs istio-configuration-reconciler-676c4c6d8d-m7sng



