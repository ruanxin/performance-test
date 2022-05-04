#!/bin/bash
for i in {1..10}
do
  k3d cluster delete target-cluster-"$i"
done