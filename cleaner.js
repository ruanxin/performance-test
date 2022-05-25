// import { Kubernetes } from 'k6/x/kubernetes';
import {check, sleep, fail} from 'k6';
import http from 'k6/http';
import exec from 'k6/x/exec';

const nameSpace = "load-test";

const VU = 160;
const ITERATION = 20;

export const options = {
    scenarios: {
        delete_kyma_crs: {
            exec: 'deleteKymaCRs',
            executor: 'per-vu-iterations',
            vus: VU,
            iterations: ITERATION,
            gracefulStop: '1m',
        },
        // tracking_alerts: {
        //     exec: 'trackingAlerts',
        //     executor: 'constant-arrival-rate',
        //     duration: '3m',
        //     rate: 1,
        //     timeUnit: '10s',
        //     preAllocatedVUs: 1,
        //     maxVUs: 1,
        //     // startTime: '2m', // run after create_configmap
        // }
    },
    thresholds: {
        'checks{scenario:create_kyma_crs}': ['rate==1'], // no errors
        // 'checks{scenario:tracking_alerts}': ['rate==1'], // no alerts
    },

};

export function deleteKymaCRs() {
    const kymaName = 'kyma-' + __VU + '-' + __ITER;
    const manifestName = 'manifest' + kymaName;
    console.log("deleting: ", manifestName)
    const cmd1 = "kubectl delete manifest " + manifestName
    const outManifest = exec.command('bash', ['-c', cmd1]);
    check(outManifest, {"manifest deleted": (outManifest) => outManifest.includes("deleted")})
    console.log("deleting: ", outManifest)
    const cmd2 = "kubectl delete kyma " + kymaName
    const outKyma = exec.command('bash', ['-c', cmd2]);
    check(outKyma, {"kyma deleted": (outKyma) => outKyma.includes("deleted")})
    console.log("deleting: ", outKyma)
    sleep(1);
}
