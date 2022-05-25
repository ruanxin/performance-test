// import { Kubernetes } from 'k6/x/kubernetes';
import {check, sleep, fail} from 'k6';
import http from 'k6/http';
import exec from 'k6/x/exec';

const nameSpace = "load-test";

const VU = 160;
const ITERATION = 20;

export const options = {
    scenarios: {
        create_kyma_crs: {
            exec: 'createKymaCRs',
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
const kyma_loadtest_template = open('./operator_loadtest_kyma.yaml')

export function createKymaCRs() {
    const kymaName = 'kyma-' + __VU + '-' + __ITER;
    const kyma = kyma_loadtest_template.replace(/kyma-1-00/, kymaName);
    const cmd = "echo " + "'" + kyma + "'" + " | kubectl apply -f -"
    const out = exec.command('bash', ['-c', cmd]);
    console.log("creating: ", kymaName);
    console.log("out: ", out);
    check(out, {'kyma created': (out) => out.includes("created")})
    sleep(1);
}

function deleteKymaCRs() {
    for (let vu = 1; vu <= VU; vu++) {
        for (let iter = 0; iter < ITERATION; iter++) {
            const kymaName = 'kyma-' + vu + '-' + iter;
            const manifestName = 'manifest' + kymaName;
            console.log("deleting: ", manifestName)
            const cmd1 = "kubectl delete --force manifest " + manifestName
            const outManifest = exec.command('bash', ['-c', cmd1]);
            check(outManifest, {"manifest deleted": (outManifest) => outManifest.includes("force deleted")})
            console.log("deleting: ", outManifest)
            const cmd2 = "kubectl delete kyma " + kymaName
            const outKyma = exec.command('bash', ['-c', cmd2]);
            check(outKyma, {"kyma deleted": (outKyma) => outKyma.includes("force deleted")})

            console.log("deleting: ", outKyma)

            sleep(1);
        }
    }
}
export function trackingAlerts() {
    const apiToken = 'eyJrIjoiYTJpUTRSeVJuRTVUc1BDN3Y5SHdLalNLVGs3N3VBdXkiLCJuIjoidGVzdCIsImlkIjoxfQ==';
    const requestHeaders = {
        'User-Agent': 'k6',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiToken,
    };

    const params = {
        headers: requestHeaders,
    };
    const res = http.get('http://localhost:3000/api/alertmanager/grafana/api/v2/alerts', params);
    res.json().forEach( alert => {
        console.log(alert['status']['state'])
        if (alert['status']['state'] === 'active') {
            check(alert, {'alert triggered': false})
        }
    })
}


export function setup() {

}

export function teardown(data) {
    console.log("teardown")
    // deleteKymaCRs();
}

